import os
import asyncio
import contextlib
import httpx
import json
import re
from datetime import date
from json_repair import repair_json
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mousse_api.db import get_session
from mousse_api.db.models import Countries

from mousse_api.api.schemata.ner import NERAnalysisResponse, LLMResponse, Entities, TimeRange

class ClientDisconnectedError(Exception):
    """Custom exception for client disconnections."""
    pass

def summarize_schema(schema):
    props= [f"{key}: {item['description']}" for key, item in schema['properties'].items()]
    return ',\n'.join(props)

def numerics_to_months(month_list: list[int] | None):
    if month_list is None:
        return []
    mapping = [
        {"kind": "Month", "value": "01", "label": "January"},
        {"kind": "Month", "value": "02", "label": "February"},
        {"kind": "Month", "value": "03", "label": "March"},
        {"kind": "Month", "value": "04", "label": "April"},
        {"kind": "Month", "value": "05", "label": "May"},
        {"kind": "Month", "value": "06", "label": "June"},
        {"kind": "Month", "value": "07", "label": "July"},
        {"kind": "Month", "value": "08", "label": "August"},
        {"kind": "Month", "value": "09", "label": "September"},
        {"kind": "Month", "value": "10", "label": "October"},
        {"kind": "Month", "value": "11", "label": "November"},
        {"kind": "Month", "value": "12", "label": "December"},
    ]
    return [mapping[month] for month in month_list]

router = APIRouter(
    tags=["NER"],
    prefix="/ner"
)

SYSTEM_PROMPT = """
You are a Name-Entity Recognition system designed to extract and process location and date-related entities. Follow these steps:
1. Detect location-related and date-related entities.
2. Map detected locations to their corresponding country or list of countries.
3. Recognize whether the date-related entity corresponds to an absolute date range or a reccuring yearly period, e.g. season of the year. In the first case of date range, transform the date-related entity into ISO 8601 date format range. Use the current date %(today)s as a reference for relative time references. In the case of yearly period, extract the corresponding months, indicated by an integer starting from 1, e.g. 8 for August.
4. Find all syntactical relations of the detected entities (e.g. prepositions) and clean the query from them, i.e detected entities plus their relations in the prompt.
5. Summarize the result in a single JSON, with the following: %(schema)s

**Special attention on this**: Return only the JSON without any further explanation or notes.
""" % {"today": str(date.today()), "schema": summarize_schema(LLMResponse.model_json_schema())}

MAX_TOKENS = 128

MAX_REQUESTS = 3

class JSON_NOT_FOUND(Exception):
    """Raised when the LLM response does not contain a valid JSON"""

async def _chat_completion(query: str, request: Request) -> str:
    url = "http://tgi:80/v1/chat/completions"
    model = os.getenv('LLM_MODEL')
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        "max_tokens": MAX_TOKENS,
        "temperature": 0,
    }

    headers = { 'Content-Type': 'application/json' }

    async with httpx.AsyncClient() as client:
        task = asyncio.create_task(
            client.post(url, headers=headers, json=payload, timeout=120)
        )
        async def monitor_disconnection():
            try:
                while True:
                    message = await request.receive()
                    if message['type'] == 'http.disconnect':
                        break
                task.cancel()
            except asyncio.CancelledError:
                pass
        disconnect_task = asyncio.create_task(monitor_disconnection())

        try:
            response = await task
        except asyncio.CancelledError:
            raise ClientDisconnectedError("Client disconnected before request completion.")
        finally:
            disconnect_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await disconnect_task

        response = response.json()

    try:
        markdown_string = response['choices'][0]['message']['content']
    except (KeyError, IndexError, ValueError, TypeError) as e:
        markdown_string = ""

    return markdown_string

def _extract_json(markdown_string: str) -> str:
    json_match = re.search(r"```json\n(.*?)\n```", markdown_string, re.DOTALL)
    if not json_match:
        raise JSON_NOT_FOUND
    return json_match.group(1)

@router.get(
    '/analyze',
    summary="Name-Entity Recognition",
    description="""
Analyzes a query for named entities related to locations and dates using a LLM for name-entity recognition (NER).
The extracted entities are processed and mapped to countries, date ranges, or recurring yearly periods.
Additionally, the query is cleaned by removing detected entities and their syntactical relations, leaving only
the core query text. The endpoint returns structured information for downstream applications.

### Endpoint Details:
- **Query**: The user-provided input string for analysis.

#### Process
1. **Entity Extraction**:
    - Location-related entities are extracted and mapped to corresponding countries.
    - Date-related entities are analyzed and transformed into ISO 8601 date ranges or recurring yearly periods (months).
2. **Relation Cleanup**: Entities and their syntactical relations (e.g., prepositions) are removed from the query.
3. **Validation**: It is ensured that the LLM-generated JSON matches the required schema and any malformed JSON is repaired if needed.
4. **Country Mapping**: Mapped countries are retrieved from the database based on extracted location names.
5. **Response Construction**: The response includes structured entities, temporal filters, and a cleaned query.
    """,
    response_model=NERAnalysisResponse
)
async def ner(request: Request, query: str = Query(..., description="Input text for analysis"), session: AsyncSession = Depends(get_session)):

    success = False
    retries = 0
    while not success and retries < 1:
        try:
            markdown_string = await _chat_completion(query, request)
        except ClientDisconnectedError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))
        try:
            try:
                json_string = _extract_json(markdown_string)
            except JSON_NOT_FOUND:
                safe_json = repair_json(markdown_string)
            else:
                safe_json = repair_json(json_string)
            llm_result = json.loads(safe_json)
            llm_result = LLMResponse(**llm_result)
        except Exception as e:
            retries += 1
        else:
            success = True
    
    if not success:
        raise HTTPException(status_code=503, detail="LLM did not return a meaningful response")
    
    countries = []
    if llm_result.country is not None:
        sql_query = select(Countries.code, Countries.label)\
            .where(Countries.label.in_(llm_result.country))
        query_result = await session.execute(sql_query)
        countries = [{'code': country[0], 'label': country[1]} for country in query_result.all()]
    
    timerange = TimeRange(
        start=llm_result.periodStart.isoformat() if llm_result.periodStart is not None else None,
        end=llm_result.periodEnd.isoformat() if llm_result.periodEnd is not None else None,
    ) if llm_result.periodStart is not None or llm_result.periodEnd is not None else None
    entities = Entities(location=llm_result.location, date=llm_result.date)

    response = NERAnalysisResponse(
        query=query,
        country=countries,
        timerange=timerange if timerange is not None else TimeRange(),
        phase=numerics_to_months(llm_result.phase) if timerange is None else [],
        entities=entities,
        cleanedQuery=llm_result.cleanedQuery,
    )
    
    return response

from datetime import date
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mousse_api.db import get_session
from mousse_api.db.models import Countries

from mousse_api.api.schemata.ner import NERAnalysisResponse, LLMResponse, Entities, TimeRange

from mousse_api.api.utils.prompts import NER_PROMPT
from mousse_api.api.utils.llm import llm_request, LLMException

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
    return [mapping[month - 1] for month in month_list if month > 0 and month < 13]

router = APIRouter(
    tags=["NER"],
    prefix="/ner"
)

system_prompt = NER_PROMPT % {"today": str(date.today()), "schema": summarize_schema(LLMResponse.model_json_schema())}

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

    try:
        llm_result = await llm_request(
            query=query,
            system_prompt=system_prompt,
            request=request,
            PydanticModel=LLMResponse,
            max_requests=3,
            max_tokens=384,
        )
    except LLMException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
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

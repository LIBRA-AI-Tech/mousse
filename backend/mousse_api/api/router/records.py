import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from mousse_api.db import get_session
from mousse_api.db.models import RawRecord
from mousse_api.api.schemata.records import SearchBody, SearchJSONResponse, SearchGeoJSONResponse, RecordDetails
from mousse_api.api.utils.vector_search_sql import SqlConstuctor
from mousse_api.api.utils.inference import inference
from mousse_api.api.utils.helpers import epoch_to_months

router = APIRouter(
    tags=["Records"],
    prefix="/records",
)

async def _get_record_by_uuid(uuid: UUID, session: AsyncSession) -> dict | None:
    stmt = select(
        RawRecord.metadata_
    ).where(RawRecord.record_uuid == uuid)
    result = await session.execute(stmt)

    record = result.first()
    return record

@router.get('', summary="Record details", description="Individual record details", response_model=RecordDetails)
async def details(id: UUID = Query(..., description="Record UUID"), session: AsyncSession = Depends(get_session)):
    record = await _get_record_by_uuid(id, session)
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    record = record._asdict()['metadata_']
    return record

@router.get('/raw', summary="Raw record", description="Get raw metadata of a specific record given its unique id.")
async def record(id: UUID = Query(..., description="Record UUID"), session: AsyncSession = Depends(get_session)):
    stmt = select(
        RawRecord.metadata_
    ).where(RawRecord.record_uuid == id)
    result = await session.execute(stmt)

    record = result.first()
    if record:
        record = record._asdict()['metadata_']
    return record

@router.post(
    '/search',
    summary="Semantic Search and Filtering",
    description="""
Performs a semantic search on the given query and applies optional filters based on spatial, temporal,
and other criteria. The search uses embeddings to find relevant results and supports pagination for
large result sets.

### Endpoint Details

- **Query**: The search term provided by the user, processed using semantic embeddings.

- **Filters**:
    - **Countries**: Restricts results to specific countries based on provided country codes.
    - **Features**: Filters results spatially using GeoJSON-defined geographic boundaries.
    - **Date Range**: Narrows results to a specific time frame using start and end dates.
    - **Epoch**: Allows filtering by predefined temporal periods, such as months or seasons.

- **Pagination**:
    - Results are paginated based on the `page` and `resultsPerPage` parameters.

- **Threshold**: A filtering parameter that adjusts the relevance threshold for semantic similarity.

#### Process
1. The search query is transformed into embeddings for semantic similarity.
2. SQL filters are dynamically constructed based on the provided filters.
3. The search is executed against the database using the constructed SQL and embeddings.
4. Results are returned as a paginated response with metadata about whether more results are available.
    """,
    response_model=SearchJSONResponse | SearchGeoJSONResponse
)
async def search(body: SearchBody, session: AsyncSession = Depends(get_session)):
    sql = SqlConstuctor(page=body.page, results_per_page=body.resultsPerPage, threshold=body.threshold)
    if body.features is not None and len(body.features) > 0:
        sql.add('spatial', body.features)
    elif body.country is not None and len(body.country) > 0:
        sql.add('country', body.country)
    if body.dateRange is not None and (body.dateRange.start or body.dateRange.end):
        start_date = body.dateRange.start.isoformat() if body.dateRange.start is not None else '0001-01-01'
        end_date = body.dateRange.end.isoformat() if body.dateRange.end is not None else '9999-12-31'
        sql.add('daterange', start_date, end_date)
    if body.epoch is not None and len(body.epoch) > 0:
        months = epoch_to_months(body.epoch)
        sql.add('epoch', months)

    embedding = inference([body.query])

    stmt = sql.create(embedding[0].tolist(), output=body.output)

    results = await session.execute(stmt)

    data = [dict(row) for row in results.mappings()]

    has_more = len(data) > body.resultsPerPage

    data = data[:body.resultsPerPage]
    if body.output == 'geojson':
        data = dict(
            type="FeatureCollection",
            features=[json.loads(list(f.values())[0]) for f in data]
        )

    response = dict(
        page = body.page,
        hasMore = has_more,
        data = data
    )

    return response

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from mousse_api.db import get_session
from mousse_api.db.models import RawRecord
from mousse_api.api.schemata.records import SearchBody, SearchResponse
from mousse_api.api.utils.vector_search_sql import SqlConstuctor
from mousse_api.api.utils.inference import inference

router = APIRouter(
    tags=["Records"],
    prefix="/records",
)

def _epoch_to_months(epoch):
    """
    Converts an epoch representation to a list of months.

    The function maps season names (e.g., 'summer', 'winter') to their corresponding 
    months and includes any directly specified month values in the epoch input. 
    Duplicate months are removed, and the final result is a unique list of months.

    Args:
        epoch (list): A list containing season names or month numbers. 
            Each item in the list must have a `value` attribute.

    Returns:
        list[int]: A list of unique month numbers corresponding to the input epoch.
    """
    epoch = [e.value for e in epoch]
    seasons = {'summer': [6, 7, 8], 'autumn': [9, 10, 11], 'winter': [12, 1, 2], 'spring': [3, 4, 5]}
    months = [int(m) for m in epoch if m not in seasons]
    for season in seasons:
        if season in epoch:
            months.extend(seasons[season])
    return list(set(months))

@router.get('', summary="Raw record", description="Get raw metadata of a specific record given its unique id.")
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
    response_model=SearchResponse
)
async def search(body: SearchBody, session: AsyncSession = Depends(get_session)):
    sql = SqlConstuctor(page=body.page, results_per_page=body.resultsPerPage, threshold=body.threshold)
    if body.countries is not None:
        sql.add('country', body.countries)
    elif body.features is not None:
        sql.add('features', body.features)
    if body.dateRange is not None:
        start_date = body.dateRange.start.isoformat() if body.dateRange.start is not None else '0001-01-01'
        end_date = body.dateRange.end.isoformat() if body.dateRange.end is not None else '9999-12-31'
        sql.add('daterange', start_date, end_date)
    elif body.epoch is not None:
        months = _epoch_to_months(body.epoch)
        sql.add('epoch', months)
    
    embedding = inference([body.query])

    stmt = sql.create(embedding[0].tolist())

    results = await session.execute(stmt)

    data = [dict(row) for row in results.mappings()]

    has_more = len(data) > body.resultsPerPage

    response = dict(
        page = body.page,
        hasMore = has_more,
        data = data[:10]
    )

    return response
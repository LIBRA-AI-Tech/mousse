from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from mousse_api.db import get_session
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

@router.post('/search', summary="Search metadata", response_model=SearchResponse)
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

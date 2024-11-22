from fastapi import APIRouter
from time import sleep

router = APIRouter(
    tags=["Search"]
)

@router.get('/search', summary="Search metadata")
async def search():
    return {'message': 'dummy'}

@router.get('/analyze', summary="Analyze query to extract location and time range entities")
async def analyze(query: str):
    sleep(1.5)
    return {
        'query': query,
        'country': [{'code': 'EL', 'label': 'Greece'}],
        'timerange': {
            'start': '2023-01-01',
            'end': '2023-12-31',
        },
        'phase': [],
        'entities': {
            'location': 'Athens',
            'date': '2023'
        },
        'cleanedQuery': 'Air pollution'
    }

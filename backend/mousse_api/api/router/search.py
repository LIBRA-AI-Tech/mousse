from fastapi import APIRouter
from time import sleep

router = APIRouter(
    tags=["Search"]
)

@router.get('/search', summary="Search metadata")
async def search():
    return {'message': 'dummy'}

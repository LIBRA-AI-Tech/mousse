from fastapi import APIRouter

router = APIRouter(
    tags=["Search"]
)

@router.get('/search', summary="Search metadata")
async def search() -> None:
    return {'message': 'dummy'}

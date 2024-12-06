import json
from fastapi import APIRouter, Depends, Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from mousse_api.db import get_session
from mousse_api.db.models import Countries
from mousse_api.api.schemata.country import CountryBase, CountryGeoJSON

router = APIRouter(
    tags=["Countries"],
    prefix='/country',
)

@router.get(
    '/list',
    summary="List of countries",
    description=(
        "Retrieves a complete list of all countries stored in the database. Each country is represented "
        "with basic information, such as its code and label. This endpoint can be used to display country options "
        "or for other reference purposes."
    ),
    response_model=list[CountryBase]
)
async def countries(session: AsyncSession = Depends(get_session)):
    countries = await session.scalars(select(Countries))
    return countries.all()

@router.get(
    '/codes/{codes}',
    summary="Get a GeoJSON of selected countries",
    description=(
        "Retrieves the geographic boundaries of the specified countries in GeoJSON format. Users provide "
        "a semi-colon-separated list of country codes as a path parameter, and the endpoint returns a GeoJSON "
        "FeatureCollection containing the geometry and associated metadata for each selected country."
    ),
    response_model=CountryGeoJSON
)
async def geojson(codes: str = Path(..., description="Semi-column separated list of country codes", example="IT;EL"), session: AsyncSession = Depends(get_session)):
    query = select(
        func.ST_AsGeoJSON(Countries.geometry).label('geojson'),
        Countries.code,
        Countries.label,
    ).where(Countries.code.in_(codes.split(';')))

    result = await session.execute(query)
    
    # Format the results as a list of dictionaries
    geojson_features = [
        {
            "type": "Feature",
            "id": row.code,
            "properties": {
                "code": row.code,
                "label": row.label
            },
            "geometry": json.loads(row.geojson),
        }
        for row in result.all()
    ]

    # Wrap the features in a GeoJSON FeatureCollection
    return {
        "type": "FeatureCollection",
        "features": geojson_features
    }

from pydantic import BaseModel, Field
from pydantic_geojson import FeatureModel, FeatureCollectionModel

class CountryBase(BaseModel):
    code: str = Field(..., max_length=3, description="The ISO code of the country", example="IT")
    label: str = Field(..., description="The english name or label of the country", example="Italy")

class CountryDetails(FeatureModel):
    properties: CountryBase

class CountryGeoJSON(FeatureCollectionModel):
    features: list[CountryDetails]

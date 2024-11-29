from pydantic import BaseModel, Field
from pydantic_geojson import FeatureModel, FeatureCollectionModel

class CountryBase(BaseModel):
    code: str = Field(..., max_length=3, description="Country code", example="IT")
    label: str = Field(..., description="Country (english) name", example="Italy")

class CountryDetails(FeatureModel):
    properties: CountryBase

class CountryGeoJSON(FeatureCollectionModel):
    features: list[CountryDetails]

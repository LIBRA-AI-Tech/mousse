from pydantic import BaseModel, Field
from pydantic_geojson import FeatureModel

class CountryBase(BaseModel):
    code: str = Field(..., max_length=3, description="Country code")
    label: str = Field(..., description="Country (english) name")

class CountryDetails(FeatureModel):
    properties: CountryBase

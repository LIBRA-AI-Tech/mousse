from datetime import date
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, Field, PositiveInt
from pydantic_geojson import FeatureModel

class Epoch(Enum):
    jan = "01"
    feb = "02"
    mar = "03"
    apr = "04"
    may = "05"
    jun = "06"
    jul = "07"
    aug = "08"
    sep = "09"
    oct = "10"
    nov = "11"
    dec = "12"
    winter = "winter"
    spring = "spring"
    summer = "summer"
    autumn = "autumn"

class DateRange(BaseModel):
    start: date | None = Field(None, description="Starting date of the specified timerange", example="2024-06-01")
    end: date | None = Field(None, description="Ending date of the specified timerange", example="2024-08-31")

class SearchBody(BaseModel):
    query: str = Field(..., description="The search query string used to identify relevant records.", example="Air pollution")
    page: PositiveInt = Field(1, description="The page number to retrieve in a paginated search result, starting from 1.")
    resultsPerPage: PositiveInt = Field(10, description="The number of results to include per page in the response, with a maximum limit of 100.", le=100)
    threshold: float = Field(0.2, description="A threshold value (between 0 and 1) for filtering or scoring results. Higher values may indicate stricter criteria.", gt=0, lt=1)
    countries: list[str] | None = Field(None, description="A list of country codes to filter results by geographic region.", example=['FR', 'IT'])
    features: list[FeatureModel] | None = Field(None, description="A list of GeoJSON features used for spatial filtering (**intersection**). These features define geographic boundaries or areas of interest for the search.")
    dateRange: DateRange | None = Field(None, description="A date range to filter results based on their temporal attributes.")
    epoch: list[Epoch] | None = Field(None, description="A list of time periods to filter results, including specific months (e.g., '01' for January) or seasons (e.g., 'winter' for the winter season).")

class Records(BaseModel):
    uuid: UUID = Field(..., description="A unique identifier for the record, represented as a UUID.")
    original_id: str = Field(..., description="The original identifier of the record from the source system.", example="urn:de.pangaea:dataset:741134")
    title: str = Field(..., description="The title of the record, summarizing its content or purpose.", example="Lithology of sediment core BACHALP, Bachalpsee, Switzerland")
    description: str | None = Field('', description="A detailed description of the record, providing additional context.")
    format: list[str] | None = Field(..., description="A list of formats associated with the record, such as file types or categories.", example=["text/tab-separated-values"])
    keyword: list[str] | None = Field(..., description="A list of keywords relevant to the record, useful for search and categorization.", example=["European Alps", "hydrological disturbances"])
    topic: list[str|None] | None = Field(..., description="A list of topics or themes associated with the record, providing contextual classification.", example="geoscientific|information")

class SearchResponse(BaseModel):
    page: PositiveInt = Field(..., description="The current page number of the paginated response.", example=1)
    hasMore: bool = Field(..., description="Indicates whether there are more pages available after the current one.")
    data: list[Records] = Field(..., description="A list of records returned in the current page of the search results.")
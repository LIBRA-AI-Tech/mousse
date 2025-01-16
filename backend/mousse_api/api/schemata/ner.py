from pydantic import BaseModel, Field
from datetime import date

class Entities(BaseModel):
    location: list[str] | None = Field(None, description="Exact location as found in the query", example="Rome")
    date: list[str] | None = Field(None, description="Exact date as found in the query", example="last summer")

class TimeRange(BaseModel):
    start: str | None = Field(None, description="Starting date of the extracted timerange", example="2024-06-01")
    end: str | None = Field(None, description="Ending date of the extracted timerange", example="2024-08-31")

class Country(BaseModel):
    code: str = Field(..., description="Country code", example="IT")
    label: str = Field(..., description="Country (english) name", example="Italy")

class Month(BaseModel):
    kind: str
    value: str
    label: str

class LLMResponse(BaseModel):
    country: list[str] = Field([], description="Extracted list of country or countries")
    periodStart: date | None = Field(None, description="Period start in ISO 8601 format, filled in only if date-related entity corresponds to absolute date range, else null")
    periodEnd: date | None = Field(None, description="Period end in ISO 8601 format, filled in only if date-related entity corresponds to absolute date range, else null")
    phase: list[int] | None = Field(None, description="A list of months indicated by integers from 1 to 12, filled in only if date-related entity corresponds to a reccuring yearly period. It should be null in case `periodStart` or `periodEnd` has been extracted.", min=1, max=12)
    location: list[str] | None = Field(None, description="A list of location-related entities **exactly** as found in the prompt")
    date: list[str] | None = Field(None, description="A list of date-related entities **exactly** as found in the prompt")
    cleanedQuery: list[str] = Field(..., description="A list of parts of the query cleaned from the extracted date-related entity and the location-related entity and their related parts (e.g. prepositions)")

class NERAnalysisResponse(BaseModel):
    query: str = Field(..., description="Original query", example="Air pollution in Rome last summer")
    country: list[Country] | None = Field(None, description="Extracted Country")
    timerange: TimeRange | None = Field(None, description="Extracted Time Range")
    phase: list[Month] | None = Field(None, description="Extracted time phase", example=[])
    entities: Entities | None = Field(None, description="Exact entities as found in query")
    cleanedQuery: list[str] = Field(..., description="Query cleaned from the extracted entities and their related parts", example="Air pollution in Rome")

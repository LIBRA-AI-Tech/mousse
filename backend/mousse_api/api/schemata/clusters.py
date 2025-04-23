from pydantic import BaseModel, Field, PositiveInt

from .records import MinimumSearchBody, SearchOutput

class ClusterResponse(BaseModel):
    """
    Model for the response of the cluster endpoint.
    """
    id: int = Field(..., description="The unique (within this request) identifier for the cluster.")
    representativeTitle: str|None = Field(..., description="The title of the representative text for the cluster.")
    summary: str|None = Field(..., description="A summary of the cluster.")
    elementCount: int = Field(..., description="The number of elements in the cluster.")

class ClusterSearchBody(MinimumSearchBody):
    """
    Model for the request body of the cluster endpoint.
    """
    numberOfClusters: int = Field(
        8,
        description="The number of clusters to be created. Default is 5.",
        example=5
    )

class MemberClusterSearchBody(ClusterSearchBody):
    """
    Model for the request body of the member cluster endpoint.
    """
    page: PositiveInt = Field(1, description="The page number to retrieve in a paginated search result, starting from 1.")
    resultsPerPage: PositiveInt = Field(10, description="The number of results to include per page in the response, with a maximum limit of 100.", le=100)
    output: SearchOutput = Field('json', description="Determines the output of the data.")
from pydantic import BaseModel, Field

from .records import MinimumSearchBody

class ClusterResponse(BaseModel):
    """
    Model for the response of the cluster endpoint.
    """

    id: int = Field(..., description="The unique (within this request) identifier for the cluster.")
    representativeTitle: str = Field(..., description="The title of the representative text for the cluster.")
    summary: str = Field(..., description="A summary of the cluster.")
    elementCount: int = Field(..., description="The number of elements in the cluster.")

class ClusterSearchBody(MinimumSearchBody):
    numberOfClusters: int = Field(
        8,
        description="The number of clusters to be created. Default is 5.",
        example=5
    )

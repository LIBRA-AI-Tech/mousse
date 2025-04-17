import json
import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from mousse_api.db import get_session
from mousse_api.api.schemata.clusters import ClusterResponse, ClusterSearchBody
from mousse_api.api.utils.vector_search_sql import SqlConstuctor
from mousse_api.api.utils.inference import inference
from mousse_api.api.utils.helpers import epoch_to_months
from mousse_api.api.utils.cluster import ClusterClassifier

router = APIRouter(
    tags=["Clusters"],
    prefix="/clustered",
)

@router.post('/search', summary="Clustered Search", description="Get clustered search results based on the given query.", response_model=list[ClusterResponse])
async def clustered_search(body: ClusterSearchBody, session: AsyncSession = Depends(get_session)):
    sql = SqlConstuctor(threshold=0.5, results_per_page=1000)
    if body.features is not None and len(body.features) > 0:
        sql.add('spatial', body.features)
    elif body.country is not None and len(body.country) > 0:
        sql.add('country', body.country)
    if body.dateRange is not None and (body.dateRange.start or body.dateRange.end):
        start_date = body.dateRange.start.isoformat() if body.dateRange.start is not None else '0001-01-01'
        end_date = body.dateRange.end.isoformat() if body.dateRange.end is not None else '9999-12-31'
        sql.add('daterange', start_date, end_date)
    if body.epoch is not None and len(body.epoch) > 0:
        months = epoch_to_months(body.epoch)
        sql.add('epoch', months)

    embedding = inference([body.query])

    stmt = sql.create_clustering(embedding[0].tolist())

    results = await session.execute(stmt)

    data = [dict(row) for row in results.mappings()]
    text_ids = [str(r['uuid']) for r in data]
    texts = [r['title'] for r in data]
    projections = np.array([json.loads(r['vector']) for r in data])
    scores = [float(r['score']) for r in data]
    classifier = ClusterClassifier(texts=texts, text_ids=text_ids, projections=projections, scores=scores)

    clusters = classifier.fit(n_clusters=body.numberOfClusters)
    clusters_reduced = [ClusterResponse(
        id=cluster.id,
        representativeTitle=cluster.representative_text,
        summary=cluster.summary,
        elementCount=len(cluster.elements)
    ) for cluster in clusters]

    return clusters_reduced

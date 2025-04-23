import json
import numpy as np
from fastapi import APIRouter, Depends, Path
from sqlalchemy import text, bindparam
from pgvector.sqlalchemy import Vector
from sqlalchemy.ext.asyncio import AsyncSession
from dataclasses import asdict

from mousse_api.db import get_session
from mousse_api.api.schemata.clusters import ClusterResponse, ClusterSearchBody, MemberClusterSearchBody
from mousse_api.api.schemata.records import SearchGeoJSONResponse, SearchJSONResponse
from mousse_api.api.utils.vector_search_sql import SqlConstuctor
from mousse_api.api.utils.inference import inference
from mousse_api.api.utils.helpers import epoch_to_months
from mousse_api.api.utils.cluster import ClusterClassifier
from mousse_api.api.utils.cache import cache_clustered_results, get_cached_clusters
from mousse_api.valkey_client import get_valkey_client
from mousse_api.api.utils.inference import inference

router = APIRouter(
    tags=["Clusters"],
    prefix="/clustered",
)

valkey = get_valkey_client()

async def _get_clusters(body: ClusterSearchBody, session: AsyncSession):
    clusters = get_cached_clusters(valkey, body)
    if not clusters:
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
        clusters = [asdict(cluster) for cluster in clusters]
    cache_clustered_results(valkey, query_body=body, clustered_result=clusters)
    return clusters

@router.post('/search', summary="Clustered Search", description="Get clustered search results based on the given query.", response_model=list[ClusterResponse])
async def clustered_search(body: ClusterSearchBody, session: AsyncSession = Depends(get_session)):
    clusters = await _get_clusters(body, session)

    clusters_reduced = [ClusterResponse(
        id=cluster['id'],
        representativeTitle=cluster['representative_text'],
        summary=cluster['summary'],
        elementCount=len(cluster['elements'])
    ) for cluster in clusters]

    return clusters_reduced

@router.post('/members/cluster/{cluster_id}', summary="Clustered Members", description="Get clustered members based on the given cluster ID.", response_model=SearchJSONResponse | SearchGeoJSONResponse)
async def clustered_members(body: MemberClusterSearchBody, cluster_id: int = Path(..., description="Cluster id", example=1), session: AsyncSession = Depends(get_session)):
    query_body: ClusterSearchBody = ClusterSearchBody(
        query=body.query,
        country=body.country,
        features=body.features,
        dateRange=body.dateRange,
        epoch=body.epoch,
        numberOfClusters=body.numberOfClusters
    )
    clusters = await _get_clusters(query_body, session)
    cluster = next((c for c in clusters if c['id'] == cluster_id), None)

    if not cluster:
        return []
    
    start_idx = (body.page - 1) * body.resultsPerPage
    end_idx = start_idx + body.resultsPerPage
    cluster_members = [member['text_id'] for member in cluster['elements'][start_idx:end_idx]]
    if len(cluster_members) == 0:
        return dict(
            page=body.page,
            hasMore=False,
            data=[]
        )

    select_stmt = "*" if body.output == 'json' else "ST_AsGeoJSON(records.*, id_column => 'uuid')"
    stmt = f"""
        WITH emb AS (
            SELECT record_uuid, vector <=> :embedding AS distance
            FROM core.embedding
            WHERE record_uuid IN ({', '.join(f"'{member}'" for member in cluster_members)})
        ),
        records AS (
            SELECT
                ROUND(1 - emb.distance::numeric, 4) AS score,
                rec.uuid, rec.geoss_id AS original_id, rec.title, rec.description,
                rec.format, rec.keyword,
                array_agg(topic.topic) AS topic,
                loc.geometry
            FROM emb
            JOIN core.record AS rec ON rec."uuid" = emb.record_uuid
            LEFT JOIN core.record_topic bridge ON bridge.record_uuid= rec.uuid
            LEFT JOIN core.topic topic ON topic.id = bridge.topic_id
            LEFT JOIN core.location loc ON loc.record_uuid = rec.uuid
            GROUP BY rec."uuid", emb.distance, loc.geometry
            ORDER BY distance
        )
        SELECT {select_stmt}
        FROM records
        WHERE uuid IN ({', '.join(f"'{member}'" for member in cluster_members)})
    """
    embedding = inference([body.query])[0].tolist()
    results = await session.execute(text(stmt).bindparams(
        bindparam("embedding", value=embedding, type_=Vector)
    ))
    
    data = [dict(row) for row in results.mappings()]
    if body.output == 'geojson':
        data = dict(
            type="FeatureCollection",
            features=[json.loads(list(f.values())[0]) for f in data]
        )
    
    response = dict(
        page=body.page,
        hasMore=len(cluster['elements']) > end_idx,
        data=data
    )

    return response

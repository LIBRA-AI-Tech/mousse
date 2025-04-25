import sys
import asyncio
import pandas as pd
import pyarrow.parquet as pq
import numpy as np
from uuid import uuid4
import re
import json
import shapely
from shapely.ops import transform
from shapely.geometry import Polygon, Point, Polygon
from geoalchemy2 import WKTElement, Geometry
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, VARCHAR, ENUM, TSTZRANGE, JSON
import sqlalchemy.ext.asyncio
from pgvector.sqlalchemy import Vector
from mousse_api.db import get_session
from mousse_api.logger import getLogger

logger = getLogger()

CHUNKSIZE = 1000

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

async def ingest(datapath: str) -> None:
    async for session in get_session():
        parquet_file = pq.ParquetFile(datapath)
        for batch in parquet_file.iter_batches(batch_size=CHUNKSIZE):
            df = batch.to_pandas()
            df['uuid'] = df.apply(lambda e: str(uuid4()), axis=1)

            async with session.begin():
                conn = await session.connection()
                await conn.run_sync(
                    lambda sync_conn: _ingest_all(df, sync_conn)
                )

def _ingest_all(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    df = df.rename(columns={'mean_embeddings': '_embeddings'})
    _ingest_record(df, con)
    _ingest_tr(df, con)
    _ingest_topic(df, con)
    _ingest_raw(df, con)
    _ingest_geom(df, con)
    _ingest_embedding(df, con)

def _ingest_record(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    df_record = df[['uuid', 'id', 'title', 'description', 'format', 'type', 'keyword']].rename(columns={'id': 'geoss_id'})
    dtype_mapping = {
        'uuid': UUID(),
        'format': ARRAY(VARCHAR()),
        'type': ENUM("simple", "composed", name="record_type_enum", schema='core'),
        'keyword': ARRAY(VARCHAR())
    }
    df_record.to_sql('record', con, schema='core', if_exists='append', index=False, method='multi', dtype=dtype_mapping)

def _ingest_tr(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    tr_mask = df[['uuid', 'when']].notnull()['when']
    df_record_tr = df[['uuid', 'when']][tr_mask].explode('when')
    df_record_tr['from'] = df_record_tr.apply(lambda e: e['when']['from'], axis=1)
    df_record_tr['to'] = df_record_tr.apply(lambda e: e['when']['to'], axis=1)
    df_record_tr['from'] = pd.to_datetime(df_record_tr['from'], utc=True, errors='coerce')
    df_record_tr['to'] = pd.to_datetime(df_record_tr['to'], utc=True, errors='coerce')
    df_record_tr = df_record_tr[(df_record_tr.notnull()['from']) * (df_record_tr.notnull()['to'])]
    df_record_tr['time_interval'] = df_record_tr.apply(lambda e: (e['from'], e['to']) if e['from'] <= e['to'] else (e['to'], e['from']), axis=1)
    df_record_tr = df_record_tr[['uuid', 'time_interval']].rename(columns={'uuid': 'record_uuid'})

    dtype_mapping = {
        'record_uuid': UUID(),
        'time_interval': TSTZRANGE,
    }

    df_record_tr.to_sql('record_time_range', con, schema='core', if_exists='append', index=False, method='multi', dtype=dtype_mapping)

def _ingest_topic(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    topic_mask = df[['uuid', 'topic']].notnull()['topic']
    df_topic = df[['uuid', 'topic']][topic_mask].explode('topic')
    df_topic['topic'] = df_topic.apply(lambda e: re.sub(r'([A-Z]{1})', r'|\1', e['topic']).lower(), axis=1)
    df_topic = df_topic.rename(columns={'uuid': 'record_uuid'})

    con.execute(text('DROP TABLE IF EXISTS temp_topic;'))
    con.execute(text("""
        CREATE TEMPORARY TABLE temp_topic (
            id SERIAL PRIMARY KEY,
            topic TEXT
        );
    """))

    df_topic[['topic']].to_sql('temp_topic', con, if_exists='append', index=False, method='multi')

    con.execute(text("""
        INSERT INTO core.topic (topic)
        SELECT topic FROM temp_topic
        ON CONFLICT (topic) DO NOTHING;
    """))

    topic_ids = con.execute(text("""
        SELECT t.id, t.topic
        FROM core.topic t
        JOIN temp_topic temp ON t.topic = temp.topic;
    """)).fetchall()

    id_topic_mapping = {row[1]: row[0] for row in topic_ids}
    df_topic['topic_id'] = df_topic['topic'].map(id_topic_mapping)
    dtype_mapping = {
        'record_uuid': UUID(),
    }
    df_topic[['record_uuid', 'topic_id']].drop_duplicates().to_sql('record_topic', con, schema='core', if_exists='append', index=False, method='multi', dtype=dtype_mapping)

def _ingest_raw(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    df_raw = df.copy()
    df_raw['metadata'] = df.apply(lambda e: json.loads(json.dumps({c: e[c] for c in e.keys() if not c.startswith('_') and c != 'uuid'}, cls=NumpyEncoder)), axis=1)
    dtype_mapping = {
        'record_uuid': UUID(),
        'metadata': JSON(),
    }
    df_raw[['uuid', 'metadata']].rename(columns={'uuid': 'record_uuid'}).to_sql('raw_record', con, schema='core', if_exists='append', index=False, method='multi', dtype=dtype_mapping)

def _bbox_to_polygon(bbox):
    # Extract the coordinates
    east, west = bbox['east'], bbox['west']
    north, south = bbox['north'], bbox['south']
    
    # Define the polygon points
    polygon_points = [
        (west, north),   # Top-left corner
        (east, north),   # Top-right corner
        (east, south),   # Bottom-right corner
        (west, south),   # Bottom-left corner
        (west, north)    # Close the polygon
    ]
    
    # Create a Shapely Polygon object
    return Polygon(polygon_points)

def _bbox_to_point(bbox):
    east, north = bbox['east'], bbox['north']
    return Point([east, north])

def _is_point(geom):
    tolerance = 0.01
    if abs(geom['east'] - geom['west']) < tolerance and abs(geom['north'] - geom['south']) < tolerance:
        return True
    return False

def _location_to_geom(location):
    geom = shapely.union_all([_bbox_to_point(bbox) if _is_point(bbox) else _bbox_to_polygon(bbox) for bbox in location])
    if not shapely.is_valid(geom):
        geom = shapely.make_valid(geom)

    # Check if any point has a longitude > 180
    if any(coord[0] > 180 for coord in geom.coords if hasattr(geom, 'coords')):
        # Define normalization function
        def normalize_lon(x, y, z=None):
            x = ((x + 180) % 360) - 180
            return (x, y) if z is None else (x, y, z)

        geom = transform(normalize_lon, geom)

    return geom

def _location_to_wkt(location):
    return WKTElement(_location_to_geom(location).wkt, srid=4326)

def _ingest_geom(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    df_location = df[['uuid', 'where']].copy()
    df_location['_where'] = df_location.apply(lambda e: pd.Series(e['where']).drop_duplicates().tolist(), axis=1)
    df_location['size'] = df_location.apply(lambda e: len(e['_where']), axis=1)

    df_location['geometry'] = df_location.apply(lambda e: _location_to_wkt(e['_where']), axis=1)

    dtype_mapping = {
        'record_uuid': UUID(),
        'geometry': Geometry,
    }

    df_location[['uuid', 'geometry']].rename(columns={'uuid': 'record_uuid'}).to_sql('location', con, schema='core', if_exists='append', index=False, method='multi', dtype=dtype_mapping)

def _ingest_embedding(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    df_embedding = df[['uuid', '_embeddings']].rename(columns={'uuid': 'record_uuid', '_embeddings': 'vector'})
    dtype_mapping = {
        'record_uuid': UUID(),
        'vector': Vector,
    }
    df_embedding.to_sql('embedding', con, schema='core', if_exists='append', index=False, method='multi', dtype=dtype_mapping)

if __name__ == '__main__':
    asyncio.run(ingest(sys.argv[1]))

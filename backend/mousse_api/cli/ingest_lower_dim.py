from uuid import uuid4
import pyarrow.parquet as pq
import pandas as pd
import sqlalchemy.ext.asyncio
from sqlalchemy.dialects.postgresql import UUID, TEXT
from pgvector.sqlalchemy import Vector
from mousse_api.db import get_session

CHUNKSIZE = 1000

async def ingest_lower_dim(datapath: str) -> None:
    async for session in get_session():
        parquet_file = pq.ParquetFile(datapath)
        for batch in parquet_file.iter_batches(batch_size=CHUNKSIZE):
            df = batch.to_pandas()

            async with session.begin():
                conn = await session.connection()
                query = sqlalchemy.text("""
                    SELECT geoss_id, uuid 
                    FROM core.record
                    WHERE geoss_id = ANY(:ids)
                """)
                result = await conn.execute(query, {'ids': df['id'].str.strip().tolist()})
                uuid_mapping = {row[0]: str(row[1]) for row in result}

                df['record_uuid'] = df['id'].map(uuid_mapping)
                df.drop(columns=['id'], inplace=True)

                try:
                    await conn.run_sync(
                        lambda sync_conn: _ingest_lower_dim(df, sync_conn)
                    )
                except:
                    pass

def _ingest_lower_dim(df: pd.DataFrame, con: sqlalchemy.ext.asyncio.AsyncConnection) -> None:
    dtype_mapping = {
        'record_uuid': UUID(),
        'title_cleaned': TEXT(),
        'vector': Vector(81),
    }
    df.to_sql('lower_dim', con, schema='core', if_exists='append', index=False, method='multi', dtype=dtype_mapping)

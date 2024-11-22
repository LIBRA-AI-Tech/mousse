import os
from functools import lru_cache
from typing import AsyncIterable
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
metadata = MetaData()

DB_URI = os.getenv("DB_URI")

@lru_cache(maxsize=None)
def get_engine() -> AsyncEngine:
    return create_async_engine(DB_URI, pool_pre_ping=True)

async def get_session() -> AsyncIterable[AsyncSession]:
    async_session = sessionmaker(
        get_engine(), class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

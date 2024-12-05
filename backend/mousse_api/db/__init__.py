import os
from functools import lru_cache
from typing import AsyncGenerator
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
metadata = MetaData()

DB_URI = os.getenv("DB_URI")

@lru_cache(maxsize=None)
def get_engine() -> AsyncEngine:
    """
    Creates and caches an asynchronous SQLAlchemy engine.
    Returns:
        AsyncEngine: SQLAlchemy AsyncEngine instance.
    """
    return create_async_engine(DB_URI, pool_pre_ping=True, pool_size=10, max_overflow=20)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an asynchronous SQLAlchemy session.
    Yields:
        AsyncSession: An instance of SQLAlchemy AsyncSession.
    """
    async_session = sessionmaker(
        get_engine(), class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

from sqlalchemy import Column, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

from mousse_api.db import Base

class LowerDim(Base):
    __tablename__ = "lower_dim"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_uuid = Column(UUID(as_uuid=True), ForeignKey('core.record.uuid', ondelete='CASCADE', onupdate='CASCADE'), nullable=False, unique=True)
    title_cleaned = Column(Text, nullable=False)
    vector = Column(Vector(81), nullable=False)

    __table_args__ = (
        {"schema": 'core'},
    )

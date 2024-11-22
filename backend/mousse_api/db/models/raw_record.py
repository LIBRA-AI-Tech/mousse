from sqlalchemy import Column, ForeignKey, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSON

from mousse_api.db import Base

class RawRecord(Base):
    __tablename__ = "raw_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_uuid = Column(UUID(as_uuid=True), ForeignKey('core.record.uuid', ondelete='CASCADE'), nullable=False)
    metadata_ = Column(JSON, name="metadata", nullable=False)

    __table_args__ = (
        Index('ix_raw_record_record_uuid', 'record_uuid'),
        {"schema": 'core'},
    )

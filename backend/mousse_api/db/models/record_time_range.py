from sqlalchemy import Column, ForeignKey, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, TSTZRANGE
from uuid import uuid4

from mousse_api.db import Base

class RecordTimeRange(Base):
    __tablename__ = "record_time_range"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    record_uuid = Column(UUID(as_uuid=True), ForeignKey('core.record.uuid', ondelete='CASCADE'), nullable=False)
    time_interval = Column(TSTZRANGE, nullable=False)

    __table_args__ = (
        Index('ix_record_time_range_time_interval', 'time_interval', postgresql_using='gist'),
        {"schema": 'core'},
    )

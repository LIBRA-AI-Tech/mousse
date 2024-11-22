from sqlalchemy import Column, ForeignKey, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from mousse_api.db import Base

class RecordTopic(Base):
    __tablename__ = "record_topic"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_uuid = Column(UUID(as_uuid=True), ForeignKey('core.record.uuid', ondelete='CASCADE'), nullable=False)
    topic_id = Column(Integer, ForeignKey('core.topic.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        Index('ix_record_topic_record_uuid_topic_id', 'record_uuid', 'topic_id', unique=True),
        Index('ix_record_topic_record_uuid', 'record_uuid'),
        Index('ix_record_topic_topic_id', 'topic_id'),
        {"schema": 'core'},
    )

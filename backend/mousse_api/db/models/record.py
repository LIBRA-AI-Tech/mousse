from sqlalchemy import Column, Text, Enum, Index
from sqlalchemy.dialects.postgresql import VARCHAR, UUID, ARRAY
from uuid import uuid4

from mousse_api.db import Base

class Record(Base):
    __tablename__ = "record"

    uuid = Column(UUID(as_uuid=True), default=uuid4(), primary_key=True)
    geoss_id = Column(VARCHAR(1023), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    format = Column(ARRAY(VARCHAR(1023)), nullable=True)
    type = Column(Enum("simple", "composed", name="record_type_enum", schema='core'), nullable=True)
    keyword = Column(ARRAY(VARCHAR(1023)), nullable=True)

    __table_args__ = (
        Index('ix_record_geoss_id', 'geoss_id'),
        Index('ix_record_type', 'type'),
        Index('ix_record_format', 'format', postgresql_using='gin'),
        Index('ix_record_keyword', 'keyword', postgresql_using='gin'),
        {"schema": 'core'},
    )

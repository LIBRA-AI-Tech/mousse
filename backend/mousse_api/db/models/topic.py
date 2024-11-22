from sqlalchemy import Column, Integer, Text, Index
from mousse_api.db import Base

class Topic(Base):
    __tablename__ = "topic"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(Text, nullable=False, unique=True)

    __table_args__ = (
        Index('ix_topic_topic', 'topic'),
        {"schema": 'core'},
    )

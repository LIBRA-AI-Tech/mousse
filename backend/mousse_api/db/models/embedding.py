from sqlalchemy import Column, ForeignKey, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

from mousse_api.db import Base

class Embedding(Base):
    __tablename__ = "embedding"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_uuid = Column(UUID(as_uuid=True), ForeignKey('core.record.uuid', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    vector = Column(Vector(768), nullable=False)

    __table_args__ = (
        Index(
            "idx_vector_diskann",
            vector,
            postgresql_using="diskann",
            postgresql_with={'storage_layout': 'plain', 'search_list_size': 200, 'num_neighbors': 20},
        ),
        {"schema": 'core'},
    )

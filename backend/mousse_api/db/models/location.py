from sqlalchemy import Column, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry

from mousse_api.db import Base

class Location(Base):
    __tablename__ = "location"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_uuid = Column(UUID(as_uuid=True), ForeignKey('core.record.uuid', ondelete='CASCADE'), nullable=False)
    geometry = Column(Geometry(geometry_type='GEOMETRY', srid=4326, spatial_index=False), nullable=False)

    __table_args__ = (
        Index('ix_location_geometry', 'geometry', postgresql_using='gist'),
        {"schema": 'core'},
    )

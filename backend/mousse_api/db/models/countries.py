from sqlalchemy import Column, Integer, Text, Index
from sqlalchemy.dialects.postgresql import VARCHAR
from geoalchemy2 import Geometry

from mousse_api.db import Base

class Countries(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(VARCHAR(3), nullable=False)
    label = Column(Text, nullable=False)
    geometry = Column(Geometry(geometry_type='MULTIPOLYGON', srid=4326, spatial_index=True), nullable=False)

    __table_args__ = (
        Index('idx_countries_code', 'code', unique=True),
        {"schema": 'core'}
    )

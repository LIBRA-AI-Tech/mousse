import setuptools
import os
from importlib.machinery import SourceFileLoader

dirname = os.path.dirname(__file__)
path_version = os.path.join(dirname, "mousse_api", "_version.py")
version = SourceFileLoader('version', path_version).load_module()

setuptools.setup(
    name="mousse_api",
    version=version.__version__,
    description="Mousse API",
    packages=setuptools.find_packages(),
    install_requires=[
        "fastapi>=0.89.0,<0.120.0",
        "gunicorn>=22.0.0,<24.0.0",
        "uvicorn[standard]>=0.18.0,<0.33.0",
        "sqlalchemy>=2.0.28,<2.1.0",
        "psycopg2-binary>=2.9.9,<3.0.0",
        "alembic>=1.13.1,<1.14.0",
        "alembic-postgresql-enum>=1.2.0,<1.3.0",
        "pgvector>=0.2.5,<0.4.0",
        "asyncpg>=0.29.0,<0.30.0",
        "GeoAlchemy2>=0.15.2,<0.17.0",
        "shapely>=2.0.6,<2.1.0",
        "pandas>=2.2.2,<2.3.0",
        "pyarrow>=17.0.0,<19.0.0",
        "pydantic-geojson>=0.1.1,<0.2.0",
        "json-repair>=0.30.2,<0.31.0",
        "httpx>=0.28.0,<0.29.0",
        "tritonclient[grpc]>=2.52.0,<2.53.0",
        "tqdm>=4.67.0,<4.68.0",
        "scikit-learn>=1.6.1,<1.7.0",
    ],
    python_requires='>=3.10',
    entry_points = {
        'console_scripts': ['mousse=mousse_api.cli.bulk_ingest:cli']
    },
    zip_safe=False,
)

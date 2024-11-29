import os
from fastapi import FastAPI

from mousse_api.logger import logger
from mousse_api._version import __version__
from .router import search, country, ner

logger.info("Creating FastAPI app")
app = FastAPI(
    title="Mousse API",
    description="Mousse API",
    version=__version__,
    root_path=os.getenv('ROOT_PATH', '') + '/api',
)

app.include_router(search.router)
app.include_router(country.router)
app.include_router(ner.router)

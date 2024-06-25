import logging.config

logging.config.fileConfig('logging.conf', disable_existing_loggers=False)
from .api.app import app

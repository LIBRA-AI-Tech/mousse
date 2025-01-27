import os
import click
from tqdm import tqdm
import asyncio
from .ingest import ingest

@click.group()
def cli() -> None:
    """Ingestion commands"""
    pass

async def async_bulk_ingest(files):
    for file in tqdm(files):
        await ingest(file)

@cli.command()
@click.argument('path', type=click.Path(exists=True))
def bulk_ingest(path: str) -> None:
    """Ingest parquet files found in path

    Args:
        path (str): Path to data file(s)
    """
    files = [os.path.join(path, file) for file in os.listdir(path)] if os.path.isdir(path) else [path]
    asyncio.run(async_bulk_ingest(files))

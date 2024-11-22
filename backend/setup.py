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
        "gunicorn>=21.2.0,<21.3.0",
        "uvicorn[standard]>=0.18.0,<0.27.0",
        "torch>=1.11.0,<1.12.0",
        "sentence_transformers>=2.2.0,<2.3.0",
        "numpy>=1.19.0,<1.23.0",
        "transformers>=4.19.0,<4.20.0",
        "tokenizers>=0.12.1,<0.13.0",
    ],
    python_requires='>=3.10',
    zip_safe=False,
)

#!/bin/sh
#set -x
set -e

python_version="$(python3 -c 'import platform; print(platform.python_version())' | cut -d '.' -f 1,2)"
if [ "${python_version}" != "${PYTHON_VERSION}" ]; then
    echo "PYTHON_VERSION (${PYTHON_VERSION}) different with version reported from python3 executable (${python_version})" 1>&2 && exit 1
fi

export LOGGING_FILE_CONFIG="./logging.conf"
if [ ! -f "${LOGGING_FILE_CONFIG}" ]; then
    echo "LOGGING_FILE_CONFIG (configuration for Python logging) does not exist!" 1>&2 && exit 1
fi

num_workers=${G_WORKERS:-"2"}
server_port=${PORT:-"8000"}
export WORKER_CLASS=${WORKER_CLASS:-"uvicorn.workers.UvicornWorker"}

exec gunicorn --log-config logging.conf --access-logfile - \
    --preload \
    --worker-tmp-dir /dev/shm \
    --workers ${num_workers} \
    -k "$WORKER_CLASS" \
    --bind "0.0.0.0:${server_port}" \
    "mousse_api:app"

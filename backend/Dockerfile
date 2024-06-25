FROM python:3.10-slim-bookworm as build-stage-1

ARG DEBIAN_FRONTEND=noninteractive
ARG DEBCONF_NOWARNINGS="yes"
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && \
    apt-get install -y gcc && \
    apt-get clean

COPY requirements.txt .
RUN pip3 --no-cache-dir install --upgrade pip wheel && \
    pip3 --no-cache-dir install --prefix=/usr/local -r requirements.txt

# BASE Image
FROM python:3.10-slim-bookworm as base

ARG VERSION

ENV VERSION="${VERSION}"
ENV PYTHON_VERSION="3.10"
ENV PYTHONPATH="/usr/local/lib/python${PYTHON_VERSION}/site-packages"

COPY --from=build-stage-1 /usr/local /usr/local

# PRODUCTION Image
FROM base as production

RUN mkdir /usr/local/api/
COPY setup.py requirements.txt /usr/local/api/
COPY mousse_api /usr/local/api/mousse_api

COPY docker-command.sh /usr/local/bin/
RUN chmod a+x /usr/local/bin/docker-command.sh

RUN mkdir /var/local/api
WORKDIR /var/local/api
RUN mkdir ./logs
COPY logging.conf .

RUN pip3 --no-cache-dir install --upgrade pip && \
    (cd /usr/local/api && pip3 --no-cache-dir install --prefix=/usr/local -r requirements.txt && pip3 --no-cache-dir install --prefix=/usr/local . && python3 setup.py clean -a)

CMD ["/usr/local/bin/docker-command.sh"]

EXPOSE 8000

# REDIS setup
FROM base as redis-setup

COPY redis-model-store.py /usr/local/bin/modelstore
RUN chmod +x /usr/local/bin/modelstore

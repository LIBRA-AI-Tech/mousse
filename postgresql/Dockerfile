FROM postgres:16.4-bookworm AS pgvectorscale

RUN apt-get update \
      && apt-get install -y --no-install-recommends curl make ca-certificates gcc pkg-config clang postgresql-server-dev-16 libssl-dev git

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN cargo install cargo-pgrx --version 0.11.4 --locked
RUN cargo pgrx init --pg16 pg_config
RUN cd /tmp && git clone --branch 0.3.0 https://github.com/timescale/pgvectorscale
RUN cd /tmp/pgvectorscale/pgvectorscale && cargo pgrx install --release


FROM postgres:16.4-bookworm

ENV POSTGIS_MAJOR 3
ENV POSTGIS_VERSION 3.4.2+dfsg-1.pgdg110+1

RUN apt-get update \
      && apt-cache showpkg postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR postgresql-$PG_MAJOR-pgvector  \
      && apt-get install -y --no-install-recommends \
           # ca-certificates: for accessing remote raster files;
           #   fix: https://github.com/postgis/docker-postgis/issues/307
           ca-certificates \
           \
           postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR \
           postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR-scripts \
           postgresql-$PG_MAJOR-pgvector \
      && rm -rf /var/lib/apt/lists/*

COPY --from=pgvectorscale  /usr/share/postgresql/16/extension/vectorscale.control /usr/share/postgresql/16/extension/vectorscale.control
COPY --from=pgvectorscale /usr/share/postgresql/16/extension/vectorscale--0.3.0.sql /usr/share/postgresql/16/extension/vectorscale--0.3.0.sql
COPY --from=pgvectorscale /usr/share/postgresql/16/extension/vectorscale--0.2.0--0.3.0.sql /usr/share/postgresql/16/extension/vectorscale--0.2.0--0.3.0.sql
COPY --from=pgvectorscale /usr/share/postgresql/16/extension/vectorscale--0.0.2--0.2.0.sql /usr/share/postgresql/16/extension/vectorscale--0.0.2--0.2.0.sql
COPY --from=pgvectorscale /usr/share/postgresql/16/extension/vectorscale--0.0.2--0.3.0.sql /usr/share/postgresql/16/extension/vectorscale--0.0.2--0.3.0.sql
COPY --from=pgvectorscale /usr/lib/postgresql/16/lib/vectorscale-0.3.0.so /usr/lib/postgresql/16/lib/vectorscale-0.3.0.so

RUN mkdir -p /docker-entrypoint-initdb.d
COPY ./initdb-postgis.sh /docker-entrypoint-initdb.d/10_postgis.sh
COPY ./initdb-pgvector.sh /docker-entrypoint-initdb.d/11_pgvector.sh
COPY ./initdb-app.sh /docker-entrypoint-initdb.d/20_app.sh
COPY ./update-postgis.sh /usr/local/bin

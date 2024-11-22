#!/bin/bash

set -e

echo "Loading pgvector extension into $POSTGRES_DB"
psql --dbname="$POSTGRES_DB" <<-'EOSQL'
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;
EOSQL

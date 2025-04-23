import hashlib
import json
from dataclasses import asdict, is_dataclass
from valkey import Valkey
from mousse_api.api.schemata.records import MinimumSearchBody

def generate_query_hash(query_body: MinimumSearchBody) -> str:
    return hashlib.sha256(query_body.model_dump_json().encode()).hexdigest()

def cache_clustered_results(
    valkey: Valkey,
    query_body: MinimumSearchBody,
    clustered_result: list,
    ttl_seconds: int = 300
):
    query_hash = generate_query_hash(query_body)
    valkey_key = f"semsearch:clusters:{query_hash}"
    valkey.setex(valkey_key, ttl_seconds, json.dumps([asdict(r) if is_dataclass(r) else r for r in clustered_result]))

def get_cached_clusters(
    valkey: Valkey,
    query_body: MinimumSearchBody
) -> list|None:
    query_hash = generate_query_hash(query_body)
    valkey_key = f"semsearch:clusters:{query_hash}"
    cached = valkey.get(valkey_key)
    return json.loads(cached) if cached else None

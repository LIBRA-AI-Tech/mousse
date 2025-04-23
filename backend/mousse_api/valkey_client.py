import valkey

def get_valkey_client():
    return valkey.Valkey(
        host="cache",
        port=6379,
        db=0,
        decode_responses=True  # Makes `get()` return strings instead of bytes
    )

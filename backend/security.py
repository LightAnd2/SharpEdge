import time
import threading
from functools import wraps
from collections import defaultdict
from flask import request, jsonify

# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------
_rate_data = defaultdict(list)
_rate_lock = threading.Lock()


def rate_limit(max_requests: int = 60, window: int = 60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr or "unknown"
            now = time.time()
            with _rate_lock:
                _rate_data[ip] = [t for t in _rate_data[ip] if now - t < window]
                if len(_rate_data[ip]) >= max_requests:
                    return jsonify({"error": "Rate limit exceeded"}), 429
                _rate_data[ip].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Response caching (simple in-process, resets on deploy)
# ---------------------------------------------------------------------------
_cache = {}
_cache_lock = threading.Lock()


def cached(ttl: int = 60):
    """Cache a JSON response by (function name + full request path)."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            key = f"{f.__name__}:{request.full_path}"
            now = time.time()
            with _cache_lock:
                if key in _cache:
                    data, ts = _cache[key]
                    if now - ts < ttl:
                        return jsonify(data)
            result = f(*args, **kwargs)
            try:
                data = result.get_json()
                if data is not None:
                    with _cache_lock:
                        _cache[key] = (data, now)
            except Exception:
                pass
            return result
        return wrapper
    return decorator


def invalidate_cache(prefix=None):
    with _cache_lock:
        if prefix:
            for k in [k for k in _cache if k.startswith(prefix)]:
                del _cache[k]
        else:
            _cache.clear()

from datetime import datetime, timedelta, timezone
from typing import Any, Callable

_CACHE: dict[str, tuple[datetime, Any]] = {}


def get_or_set(key: str, ttl_seconds: int, loader: Callable[[], Any]) -> tuple[Any, bool]:
    now = datetime.now(timezone.utc)
    if key in _CACHE:
        created_at, value = _CACHE[key]
        if now - created_at < timedelta(seconds=ttl_seconds):
            return value, True

    value = loader()
    _CACHE[key] = (now, value)
    return value, False


def clear_cache() -> None:
    _CACHE.clear()

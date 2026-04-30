import time
from typing import Callable, TypeVar

T = TypeVar("T")


def with_retry(loader: Callable[[], T], retries: int = 1, delay_seconds: float = 0.3) -> T:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return loader()
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(delay_seconds)
    assert last_error is not None
    raise last_error

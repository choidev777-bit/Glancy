def classic(high: float, low: float, close: float) -> dict:
    pivot = (high + low + close) / 3
    return {
        "pivot": pivot,
        "r1": 2 * pivot - low,
        "r2": pivot + (high - low),
        "r3": high + 2 * (pivot - low),
        "s1": 2 * pivot - high,
        "s2": pivot - (high - low),
        "s3": low - 2 * (high - pivot),
    }


def fibonacci(high: float, low: float, close: float) -> dict:
    pivot = (high + low + close) / 3
    spread = high - low
    return {
        "pivot": pivot,
        "r1": pivot + 0.382 * spread,
        "r2": pivot + 0.618 * spread,
        "r3": pivot + spread,
        "s1": pivot - 0.382 * spread,
        "s2": pivot - 0.618 * spread,
        "s3": pivot - spread,
    }


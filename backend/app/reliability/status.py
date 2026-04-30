from datetime import datetime, timezone
from typing import Literal

from app.models import MarketData

DataStatus = Literal["live", "cached", "sample"]


def attach_status(
    data: MarketData,
    *,
    data_status: DataStatus,
    source_name: str,
    fallback_reason: str | None = None,
) -> MarketData:
    meta = dict(data.meta or {})
    meta.update(
        {
            "data_status": data_status,
            "source_name": source_name,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "fallback_reason": fallback_reason,
        }
    )
    data.meta = meta
    return data

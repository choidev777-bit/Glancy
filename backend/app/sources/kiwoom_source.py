"""Optional Kiwoom REST API provider for Korean stock quotes and candles."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from app.config import settings
from app.models import Candle, MarketData, StockQuote
from app.reliability.status import attach_status

_TOKEN: dict[str, Any] = {"value": None, "expires_at": None}
_SESSION = requests.Session()
_SESSION.trust_env = False


def is_kiwoom_configured() -> bool:
    return bool(settings.kiwoom_app_key and settings.kiwoom_app_secret and settings.effective_kiwoom_base_url)


def get_kiwoom_status() -> str:
    return "configured" if is_kiwoom_configured() else "missing_env"


def clear_access_token() -> None:
    _TOKEN["value"] = None
    _TOKEN["expires_at"] = None


def _clean_number(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip().replace(",", "")
    if not text or text in {"-", "--"}:
        return None
    sign = -1 if text.startswith("-") else 1
    text = text.lstrip("+-")
    try:
        return sign * float(text)
    except ValueError:
        return None


def _clean_price(value: Any) -> float | None:
    number = _clean_number(value)
    return abs(number) if number is not None else None


def _token_expiry(raw: dict[str, Any]) -> datetime:
    expires_dt = str(raw.get("expires_dt") or "").strip()
    for fmt in ("%Y%m%d%H%M%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(expires_dt, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return datetime.now(timezone.utc) + timedelta(hours=12)


def get_access_token() -> str:
    if not is_kiwoom_configured():
        raise RuntimeError("Kiwoom REST API environment variables are missing")

    now = datetime.now(timezone.utc)
    if _TOKEN["value"] and _TOKEN["expires_at"] and _TOKEN["expires_at"] > now + timedelta(minutes=5):
        return str(_TOKEN["value"])

    response = _SESSION.post(
        f"{settings.effective_kiwoom_base_url}/oauth2/token",
        json={
            "grant_type": "client_credentials",
            "appkey": settings.kiwoom_app_key,
            "secretkey": settings.kiwoom_app_secret,
        },
        headers={"Content-Type": "application/json;charset=UTF-8"},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("token") or payload.get("access_token")
    if not token:
        raise RuntimeError(f"Kiwoom token response did not include token: {payload.get('return_msg') or payload}")

    _TOKEN["value"] = token
    _TOKEN["expires_at"] = _token_expiry(payload)
    return str(token)


def _is_token_invalid(payload: dict[str, Any]) -> bool:
    return_code = str(payload.get("return_code") or "")
    return_msg = str(payload.get("return_msg") or "")
    return return_code == "8005" or "8005" in return_msg or ("Token" in return_msg and "유효" in return_msg)


def _post(api_id: str, endpoint: str, body: dict[str, Any], retry_on_token_error: bool = True) -> dict[str, Any]:
    token = get_access_token()
    response = _SESSION.post(
        f"{settings.effective_kiwoom_base_url}{endpoint}",
        json=body,
        headers={
            "Content-Type": "application/json;charset=UTF-8",
            "authorization": f"Bearer {token}",
            "api-id": api_id,
        },
        timeout=12,
    )
    response.raise_for_status()
    payload = response.json()
    return_code = payload.get("return_code")
    if return_code not in (None, 0, "0"):
        if retry_on_token_error and _is_token_invalid(payload):
            clear_access_token()
            return _post(api_id, endpoint, body, retry_on_token_error=False)
        raise RuntimeError(payload.get("return_msg") or f"Kiwoom API {api_id} failed")
    return payload


def normalize_quote(ticker: str, payload: dict[str, Any]) -> StockQuote:
    symbol = str(payload.get("stk_cd") or payload.get("code") or ticker).strip()
    name = str(payload.get("stk_nm") or payload.get("name") or ticker).strip()
    return StockQuote(
        symbol=symbol,
        name=name,
        price=_clean_price(payload.get("cur_prc") or payload.get("lastPrice")),
        change=_clean_number(payload.get("pred_pre")),
        change_percent=_clean_number(payload.get("flu_rt")),
        volume=_clean_price(payload.get("trde_qty")),
        market_cap=_clean_price(payload.get("mac")),
        high52=_clean_price(payload.get("oyr_hgst") or payload.get("250hgst")),
        low52=_clean_price(payload.get("oyr_lwst") or payload.get("250lwst")),
        currency="KRW",
        meta={
            "data_status": "live",
            "source_name": "kiwoom",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "fallback_reason": None,
        },
    )


def get_kiwoom_quote(ticker: str) -> StockQuote:
    payload = _post("ka10001", "/api/dostk/stkinfo", {"stk_cd": ticker})
    return normalize_quote(ticker, payload)


def _first_list(payload: dict[str, Any]) -> list[dict[str, Any]]:
    for value in payload.values():
        if isinstance(value, list) and value and isinstance(value[0], dict):
            return value
    output = payload.get("output")
    if isinstance(output, dict):
        for value in output.values():
            if isinstance(value, list) and value and isinstance(value[0], dict):
                return value
    if isinstance(output, list):
        return output
    return []


def _row_value(row: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        if key in row:
            return row[key]
    return None


def _time_to_timestamp(value: Any) -> int:
    text = str(value or "").strip()
    for fmt in ("%Y%m%d%H%M%S", "%Y%m%d%H%M", "%Y%m%d"):
        try:
            return int(datetime.strptime(text, fmt).replace(tzinfo=timezone.utc).timestamp())
        except ValueError:
            pass
    raise ValueError(f"Unsupported Kiwoom chart time: {text}")


def _chart_request(interval: str, ticker: str) -> tuple[str, dict[str, Any]]:
    if interval == "1h":
        return "ka10080", {"stk_cd": ticker, "tic_scope": "60", "upd_stkpc_tp": "1"}
    if interval == "1d":
        return "ka10081", {"stk_cd": ticker, "base_dt": datetime.now().strftime("%Y%m%d"), "upd_stkpc_tp": "1"}
    if interval == "1w":
        return "ka10082", {"stk_cd": ticker, "base_dt": datetime.now().strftime("%Y%m%d"), "upd_stkpc_tp": "1"}
    if interval == "1mo":
        return "ka10083", {"stk_cd": ticker, "base_dt": datetime.now().strftime("%Y%m%d"), "upd_stkpc_tp": "1"}
    raise ValueError(f"Unsupported Kiwoom interval: {interval}")


def _candles_from_chart_payload(payload: dict[str, Any], days: int | None = None) -> list[Candle]:
    rows = _first_list(payload)
    if not rows:
        raise RuntimeError("Kiwoom chart response did not include candles")

    cutoff_ts = int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp()) if days else None
    candles: list[Candle] = []
    for row in rows:
        date_value = _row_value(row, ("cntr_tm", "dt", "date", "stck_bsop_date"))
        open_value = _row_value(row, ("open_pric", "open", "stk_oprc"))
        high_value = _row_value(row, ("high_pric", "high", "stk_hgpr"))
        low_value = _row_value(row, ("low_pric", "low", "stk_lwpr"))
        close_value = _row_value(row, ("cur_prc", "close_pric", "close", "stk_clpr"))
        volume_value = _row_value(row, ("trde_qty", "volume", "acml_vol"))
        if not date_value or close_value is None:
            continue
        candle_time = _time_to_timestamp(date_value)
        if cutoff_ts and candle_time < cutoff_ts:
            continue
        close = _clean_price(close_value)
        open_price = _clean_price(open_value) or close
        high = _clean_price(high_value) or close
        low = _clean_price(low_value) or close
        if close is None or open_price is None or high is None or low is None:
            continue
        candles.append(
            Candle(
                time=candle_time,
                open=open_price,
                high=high,
                low=low,
                close=close,
                volume=_clean_price(volume_value) or 0,
            )
        )

    return sorted(candles, key=lambda candle: candle.time)


def get_kiwoom_ohlcv(ticker: str, interval: str = "1d", days: int = 365) -> MarketData:
    api_id, body = _chart_request(interval, ticker)
    payload = _post(api_id, "/api/dostk/chart", body)
    candles = _candles_from_chart_payload(payload, days=days if interval == "1d" else None)
    if not candles:
        raise RuntimeError("Kiwoom chart response had no valid candles")

    data = MarketData(
        source="kr_stocks",
        symbol=ticker,
        name=str(payload.get("stk_nm") or payload.get("name") or ticker),
        type="OHLCV",
        timezone="KST",
        currency="KRW",
        candles=candles,
    )
    return attach_status(data, data_status="live", source_name="kiwoom")


def get_kiwoom_daily_ohlcv(ticker: str, days: int = 365) -> MarketData:
    return get_kiwoom_ohlcv(ticker, interval="1d", days=days)

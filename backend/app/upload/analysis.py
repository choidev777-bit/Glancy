import pandas as pd

from app.indicators.compute import compute_all
from app.insights.compose import compose
from app.upload.adapters import composite_portfolio as composite_portfolio_adapter
from app.upload.adapters import multi_asset as multi_asset_adapter
from app.upload.adapters import ohlcv as ohlcv_adapter
from app.upload.adapters import portfolio as portfolio_adapter
from app.upload.adapters import price_series as price_series_adapter
from app.upload.adapters import returns as returns_adapter
from app.upload.detector import detect_type


def _max_drawdown_from_candles(candles) -> float:
    if not candles:
        return 0.0
    closes = pd.Series([candle.close for candle in candles], dtype="float64")
    drawdown = closes / closes.cummax() - 1
    return float(drawdown.min()) if len(drawdown) else 0.0


def _price_points_from_candles(candles) -> list[dict]:
    return [
        {
            "time": candle.time,
            "open": candle.open,
            "high": candle.high,
            "low": candle.low,
            "close": candle.close,
        }
        for candle in candles
    ]


def dispatch(df: pd.DataFrame, filename: str) -> dict:
    data_type = detect_type(df)

    if data_type == "OHLCV":
        market_data = ohlcv_adapter.adapt(df, filename)
        result = compute_all(market_data)
        result["price_points"] = _price_points_from_candles(market_data.candles)
        if "error" not in result:
            result["insights"] = compose(result, current_price=market_data.candles[-1].close)
        return {
            "type": "OHLCV",
            "market_data_summary": {"name": market_data.name, "n_candles": len(market_data.candles)},
            "analysis": result,
        }

    if data_type == "price_series":
        market_data = price_series_adapter.adapt(df, filename)
        result = compute_all(market_data)
        result["max_drawdown"] = _max_drawdown_from_candles(market_data.candles)
        result["price_points"] = _price_points_from_candles(market_data.candles)
        if "error" not in result:
            result["insights"] = compose(result, current_price=market_data.candles[-1].close)
        return {
            "type": "price_series",
            "market_data_summary": {"name": market_data.name, "n_candles": len(market_data.candles)},
            "analysis": result,
            "note": "거래량 데이터가 없어 일부 지표가 제한됩니다.",
        }

    if data_type == "portfolio":
        return {"type": "portfolio", "analysis": portfolio_adapter.analyze(df)}

    if data_type == "multi_asset":
        return {"type": "multi_asset", "analysis": multi_asset_adapter.analyze(df)}

    if data_type == "returns":
        return {"type": "returns", "analysis": returns_adapter.analyze(df)}

    if data_type == "composite_portfolio":
        return composite_portfolio_adapter.analyze(df)

    return {
        "type": "unknown",
        "message": "데이터 유형을 자동으로 판별할 수 없습니다.",
        "available_types": ["OHLCV", "portfolio", "multi_asset", "returns", "price_series", "composite_portfolio"],
        "columns": df.columns.tolist(),
    }

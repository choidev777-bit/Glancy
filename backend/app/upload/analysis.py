import pandas as pd

from app.indicators.compute import compute_all
from app.insights.compose import compose
from app.upload.adapters import multi_asset as multi_asset_adapter
from app.upload.adapters import ohlcv as ohlcv_adapter
from app.upload.adapters import portfolio as portfolio_adapter
from app.upload.adapters import price_series as price_series_adapter
from app.upload.adapters import returns as returns_adapter
from app.upload.detector import detect_type


def dispatch(df: pd.DataFrame, filename: str) -> dict:
    data_type = detect_type(df)

    if data_type == "OHLCV":
        market_data = ohlcv_adapter.adapt(df, filename)
        result = compute_all(market_data)
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

    return {
        "type": "unknown",
        "message": "데이터 유형을 자동으로 판별할 수 없습니다.",
        "available_types": ["OHLCV", "portfolio", "multi_asset", "returns", "price_series"],
        "columns": df.columns.tolist(),
    }


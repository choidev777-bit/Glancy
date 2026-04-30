import numpy as np
import pandas as pd

from app.indicators.compute import compute_all
from app.indicators.momentum import macd, rsi_signal
from app.indicators.trend import detect_cross, ma_alignment, sma
from app.models import Candle, MarketData


def _series(values):
    return pd.Series(values)


def test_sma_basic():
    result = sma(_series([1, 2, 3, 4, 5]), 3).tolist()
    assert result[2] == 2
    assert result[4] == 4


def test_ma_alignment():
    assert ma_alignment({5: 100, 20: 90, 60: 80}) == "정배열"
    assert ma_alignment({5: 80, 20: 90, 60: 100}) == "역배열"


def test_detect_cross():
    assert detect_cross(_series([10, 10, 10, 11, 12]), _series([11, 11, 11, 11, 11])) == "골든크로스"


def test_rsi_signal_extremes():
    assert rsi_signal(15) == ("강한 매수", 2)
    assert rsi_signal(85) == ("강한 매도", -2)


def test_macd_shape():
    close = _series(np.cumsum(np.random.default_rng(0).normal(size=100)) + 100)
    result = macd(close)
    assert set(result.keys()) == {"macd", "signal", "histogram"}
    assert len(result["macd"]) == 100


def test_compute_all_returns_gauges():
    rng = np.random.default_rng(42)
    base = np.cumsum(rng.normal(size=240)) + 100
    candles = [
        Candle(
            time=1_700_000_000 + idx * 86_400,
            open=float(value),
            high=float(value + 1),
            low=float(value - 1),
            close=float(value + rng.normal() * 0.2),
            volume=1000 + idx,
        )
        for idx, value in enumerate(base)
    ]
    data = MarketData(
        source="user_upload",
        symbol="TEST",
        name="TEST",
        type="OHLCV",
        timezone="UTC",
        currency="UNKNOWN",
        candles=candles,
    )
    result = compute_all(data)
    assert "gauges" in result
    assert len(result["indicators"]) >= 8


def test_compute_all_reflects_runtime_params():
    rng = np.random.default_rng(7)
    base = np.cumsum(rng.normal(size=240)) + 100
    candles = [
        Candle(
            time=1_700_000_000 + idx * 86_400,
            open=float(value),
            high=float(value + 1),
            low=float(value - 1),
            close=float(value + rng.normal() * 0.2),
            volume=1000 + idx,
        )
        for idx, value in enumerate(base)
    ]
    data = MarketData(
        source="user_upload",
        symbol="TEST",
        name="TEST",
        type="OHLCV",
        timezone="UTC",
        currency="UNKNOWN",
        candles=candles,
    )
    result = compute_all(
        data,
        {
            "ma_periods": "3,6,9",
            "ma_cross_short": 3,
            "ma_cross_long": 9,
            "rsi_period": 9,
            "macd_fast": 8,
            "macd_slow": 21,
            "macd_signal": 5,
            "stoch_k_period": 7,
            "stoch_d_period": 4,
            "stoch_overbought": 75,
            "stoch_oversold": 25,
            "bb_period": 18,
            "bb_std": 1.8,
            "wr_period": 10,
            "wr_overbought": -15,
            "wr_oversold": -85,
            "cci_period": 20,
            "cci_strong_buy": -220,
            "cci_buy": -120,
            "cci_sell": 120,
            "cci_strong_sell": 220,
            "atr_period": 7,
            "roc_period": 6,
            "obv_lookback": 3,
        },
    )
    names = [item["name"] for item in result["indicators"]]
    assert "RSI(9)" in names
    assert "MACD(8,21)" in names
    assert "STOCH(7,4)" in names
    assert "Williams %R(10)" in names
    assert "CCI(20)" in names
    assert "ATR(7)" in names
    assert "ROC(6)" in names
    assert "OBV(3)" in names
    assert [item["period"] for item in result["moving_averages"]] == [3, 6, 9]

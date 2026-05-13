import sys
import types

pykrx_module = types.ModuleType("pykrx")
pykrx_module.stock = types.SimpleNamespace()
sys.modules.setdefault("pykrx", pykrx_module)
sys.modules.setdefault("pykrx.stock", pykrx_module.stock)

yfinance_module = types.ModuleType("yfinance")
sys.modules.setdefault("yfinance", yfinance_module)

from app.fundamental.kr import build_kr_report
from app.fundamental.us import build_us_report


def test_us_fundamental_report_includes_interpretive_profile(monkeypatch):
    monkeypatch.setattr(
        "app.fundamental.us.get_yf_fundamentals",
        lambda symbol: {
            "PER": 24.0,
            "ForwardPER": 21.0,
            "PBR": 8.5,
            "PSR": 6.0,
            "EVtoEBITDA": 18.0,
            "ROE": 0.32,
            "ROA": 0.18,
            "ProfitMargin": 0.24,
            "OperatingMargin": 0.31,
            "RevenueGrowth": 0.12,
            "EarningsGrowth": 0.09,
            "DebtToEquity": 45.0,
            "CurrentRatio": 1.7,
            "Beta": 1.1,
            "DividendYield": 0.006,
            "PayoutRatio": 0.18,
            "MarketCap": 2_500_000_000_000,
        },
    )

    report = build_us_report("AAPL", "Apple")
    profile = report.insight_profile

    assert profile is not None
    assert profile.headline
    assert profile.horizon == "long"
    assert {section.id for section in profile.sections} >= {
        "valuation",
        "profitability",
        "growth",
        "financial-health",
        "shareholder-return",
    }
    assert profile.nextChecks


def test_kr_fundamental_report_marks_missing_quality_data(monkeypatch):
    monkeypatch.setattr(
        "app.fundamental.kr.get_kr_stock_fundamental",
        lambda ticker: {"PER": 14.2, "PBR": 1.3, "EPS": 5124, "BPS": 54231, "DIV": 2.1, "DPS": 1400},
    )

    report = build_kr_report("005930", "삼성전자")
    profile = report.insight_profile

    assert profile is not None
    assert profile.dataQuality
    assert any("미제공" in item or "부족" in item for item in profile.dataQuality)

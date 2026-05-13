from datetime import UTC, datetime

from app.fundamental.format import fmt_dollar, fmt_multiple, fmt_percent
from app.fundamental.insights import build_fundamental_profile
from app.fundamental.models import FundamentalItem, FundamentalReport, FundamentalSection
from app.sources.yfinance_source import get_yf_fundamentals


def _pct(value):
    return value if value is None else (value if abs(value) < 5 else value / 100)


def build_us_report(symbol: str, name: str) -> FundamentalReport:
    data = get_yf_fundamentals(symbol)

    valuation = FundamentalSection(
        title="밸류에이션",
        items=[
            FundamentalItem(label="PER", value=fmt_multiple(data.get("PER")), raw=data.get("PER")),
            FundamentalItem(label="Forward PER", value=fmt_multiple(data.get("ForwardPER")), raw=data.get("ForwardPER")),
            FundamentalItem(label="PBR", value=fmt_multiple(data.get("PBR")), raw=data.get("PBR")),
            FundamentalItem(label="PSR", value=fmt_multiple(data.get("PSR")), raw=data.get("PSR")),
            FundamentalItem(label="EV/EBITDA", value=fmt_multiple(data.get("EVtoEBITDA")), raw=data.get("EVtoEBITDA")),
        ],
    )

    profitability = FundamentalSection(
        title="수익성",
        items=[
            FundamentalItem(label="ROE", value=fmt_percent(_pct(data.get("ROE"))), raw=data.get("ROE")),
            FundamentalItem(label="ROA", value=fmt_percent(_pct(data.get("ROA"))), raw=data.get("ROA")),
            FundamentalItem(label="순이익률", value=fmt_percent(_pct(data.get("ProfitMargin"))), raw=data.get("ProfitMargin")),
            FundamentalItem(
                label="영업이익률",
                value=fmt_percent(_pct(data.get("OperatingMargin"))),
                raw=data.get("OperatingMargin"),
            ),
        ],
    )

    growth = FundamentalSection(
        title="성장성",
        items=[
            FundamentalItem(label="매출 성장률 YoY", value=fmt_percent(_pct(data.get("RevenueGrowth"))), raw=data.get("RevenueGrowth")),
            FundamentalItem(label="EPS 성장률", value=fmt_percent(_pct(data.get("EarningsGrowth"))), raw=data.get("EarningsGrowth")),
        ],
    )

    health = FundamentalSection(
        title="재무 건전성",
        items=[
            FundamentalItem(
                label="부채비율(D/E)",
                value=f"{data['DebtToEquity']:.1f}" if data.get("DebtToEquity") else "-",
                raw=data.get("DebtToEquity"),
            ),
            FundamentalItem(
                label="유동비율",
                value=f"{data['CurrentRatio']:.2f}" if data.get("CurrentRatio") else "-",
                raw=data.get("CurrentRatio"),
            ),
            FundamentalItem(label="베타", value=f"{data['Beta']:.2f}" if data.get("Beta") else "-", raw=data.get("Beta")),
        ],
    )

    shareholder = FundamentalSection(
        title="주주환원",
        items=[
            FundamentalItem(label="배당수익률", value=fmt_percent(_pct(data.get("DividendYield"))), raw=data.get("DividendYield")),
            FundamentalItem(label="배당성향", value=fmt_percent(_pct(data.get("PayoutRatio"))), raw=data.get("PayoutRatio")),
            FundamentalItem(label="시가총액", value=fmt_dollar(data.get("MarketCap")), raw=data.get("MarketCap")),
        ],
    )

    sections = [valuation, profitability, growth, health, shareholder]

    return FundamentalReport(
        symbol=symbol,
        market="us",
        name=name,
        sections=sections,
        insight_profile=build_fundamental_profile(symbol, name, "us", sections),
        generated_at=datetime.now(UTC).isoformat(),
    )

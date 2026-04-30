from datetime import UTC, datetime

from app.fundamental.format import fmt_multiple, fmt_percent, fmt_won
from app.fundamental.models import FundamentalItem, FundamentalReport, FundamentalSection
from app.sources.pykrx_source import get_kr_stock_fundamental


def build_kr_report(ticker: str, name: str, dart_data: dict | None = None) -> FundamentalReport:
    pykrx_data = get_kr_stock_fundamental(ticker)
    dart_data = dart_data or {}

    valuation = FundamentalSection(
        title="밸류에이션",
        items=[
            FundamentalItem(label="PER", value=fmt_multiple(pykrx_data.get("PER")), raw=pykrx_data.get("PER")),
            FundamentalItem(label="PBR", value=fmt_multiple(pykrx_data.get("PBR")), raw=pykrx_data.get("PBR")),
            FundamentalItem(label="PSR", value="-", note="국내 기본 데이터 소스에서 미제공"),
            FundamentalItem(label="EV/EBITDA", value="-", note="국내 기본 데이터 소스에서 미제공"),
        ],
    )

    profitability = FundamentalSection(
        title="수익성",
        items=[
            FundamentalItem(label="ROE", value=fmt_percent(dart_data.get("ROE")), raw=dart_data.get("ROE")),
            FundamentalItem(label="ROA", value=fmt_percent(dart_data.get("ROA")), raw=dart_data.get("ROA")),
            FundamentalItem(
                label="영업이익률",
                value=fmt_percent(dart_data.get("operating_margin")),
                raw=dart_data.get("operating_margin"),
            ),
            FundamentalItem(
                label="순이익률",
                value=fmt_percent(dart_data.get("net_margin")),
                raw=dart_data.get("net_margin"),
            ),
        ],
    )

    growth = FundamentalSection(
        title="성장성",
        items=[
            FundamentalItem(label="매출액", value=fmt_won(dart_data.get("revenue"))),
            FundamentalItem(label="영업이익", value=fmt_won(dart_data.get("operating_income"))),
            FundamentalItem(label="순이익", value=fmt_won(dart_data.get("net_income"))),
        ],
    )

    health = FundamentalSection(
        title="재무 건전성",
        items=[
            FundamentalItem(label="부채비율", value=fmt_percent(dart_data.get("debt_ratio")), raw=dart_data.get("debt_ratio")),
            FundamentalItem(label="자산총계", value=fmt_won(dart_data.get("total_assets"))),
            FundamentalItem(label="자본총계", value=fmt_won(dart_data.get("total_equity"))),
        ],
    )

    shareholder = FundamentalSection(
        title="주주환원",
        items=[
            FundamentalItem(label="EPS", value=fmt_won(pykrx_data.get("EPS")), raw=pykrx_data.get("EPS")),
            FundamentalItem(label="BPS", value=fmt_won(pykrx_data.get("BPS")), raw=pykrx_data.get("BPS")),
            FundamentalItem(
                label="배당수익률",
                value=fmt_percent(pykrx_data.get("DIV") / 100 if pykrx_data.get("DIV") else None),
            ),
            FundamentalItem(label="주당배당금", value=fmt_won(pykrx_data.get("DPS")), raw=pykrx_data.get("DPS")),
        ],
    )

    return FundamentalReport(
        symbol=ticker,
        market="kr",
        name=name,
        sections=[valuation, profitability, growth, health, shareholder],
        generated_at=datetime.now(UTC).isoformat(),
    )

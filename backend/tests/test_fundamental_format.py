from app.fundamental.format import fmt_dollar, fmt_multiple, fmt_percent, fmt_won
from app.fundamental.models import FundamentalItem, FundamentalSection


def test_formatters():
    assert fmt_multiple(12.345) == "12.35배"
    assert fmt_percent(0.1234) == "12.34%"
    assert fmt_won(12345) == "12,345원"
    assert fmt_dollar(1_500_000_000) == "$1.50B"


def test_fundamental_models():
    section = FundamentalSection(
        title="밸류에이션",
        items=[FundamentalItem(label="PER", value="12.00배", raw=12)],
    )
    assert section.items[0].label == "PER"


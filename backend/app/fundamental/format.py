def fmt_multiple(value: float | None) -> str:
    if value is None:
        return "-"
    return f"{value:.2f}배"


def fmt_percent(value: float | None) -> str:
    if value is None:
        return "-"
    return f"{value * 100:.2f}%" if abs(value) < 5 else f"{value:.2f}%"


def fmt_won(value: float | None) -> str:
    if value is None:
        return "-"
    return f"{int(value):,}원"


def fmt_dollar(value: float | None) -> str:
    if value is None:
        return "-"
    if value >= 1e12:
        return f"${value / 1e12:.2f}T"
    if value >= 1e9:
        return f"${value / 1e9:.2f}B"
    if value >= 1e6:
        return f"${value / 1e6:.2f}M"
    return f"${value:,.0f}"


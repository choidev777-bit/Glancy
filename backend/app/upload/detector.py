import pandas as pd

OHLCV_COLS = {"open", "high", "low", "close"}
KOREAN_OHLCV = {"시가", "고가", "저가", "종가"}

PORTFOLIO_A = {"ticker", "weight"}
PORTFOLIO_B = {"ticker", "quantity"}
COMPOSITE_COLUMNS = {"section", "asset", "metric", "value"}
COMPOSITE_SECTIONS = {"portfolio_weight", "ohlcv", "price", "return", "fundamental", "fundamental_history", "metadata"}
PORTFOLIO_KR_A = {"종목", "비중"}
PORTFOLIO_KR_B = {"종목", "수량"}

DATE_KEYWORDS = {"date", "time", "datetime", "날짜", "일자", "시간"}
RETURN_KEYWORDS = {"return", "returns", "수익률"}
CLOSE_KEYWORDS = {"close", "price", "종가", "현재가"}


def _normalized_columns(df: pd.DataFrame) -> set[str]:
    return {str(column).strip().lower() for column in df.columns}


def detect_type(df: pd.DataFrame) -> str:
    cols = _normalized_columns(df)
    raw_cols = {str(column).strip() for column in df.columns}

    if COMPOSITE_COLUMNS.issubset(cols):
        section_col = next((column for column in df.columns if str(column).strip().lower() == "section"), None)
        if section_col is not None:
            sections = {str(value).strip().lower() for value in df[section_col].dropna().unique()}
            if "portfolio_weight" in sections and len(sections & COMPOSITE_SECTIONS) >= 3:
                return "composite_portfolio"

    if OHLCV_COLS.issubset(cols) or KOREAN_OHLCV.issubset(raw_cols):
        return "OHLCV"

    if (
        PORTFOLIO_A.issubset(cols)
        or PORTFOLIO_B.issubset(cols)
        or PORTFOLIO_KR_A.issubset(raw_cols)
        or PORTFOLIO_KR_B.issubset(raw_cols)
    ):
        return "portfolio"

    has_date = bool(cols & DATE_KEYWORDS)
    if has_date and (cols & RETURN_KEYWORDS):
        return "returns"

    if has_date:
        non_date = [column for column in df.columns if str(column).strip().lower() not in DATE_KEYWORDS]
        non_special = [
            column
            for column in non_date
            if str(column).strip().lower() not in (CLOSE_KEYWORDS | RETURN_KEYWORDS)
        ]
        if len(non_special) >= 3:
            return "multi_asset"
        if cols & CLOSE_KEYWORDS or len(non_date) == 1:
            return "price_series"

    return "unknown"

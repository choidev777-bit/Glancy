from pydantic import BaseModel


class FundamentalItem(BaseModel):
    label: str
    value: str
    raw: float | None = None
    position: float | None = None
    note: str | None = None


class FundamentalSection(BaseModel):
    title: str
    items: list[FundamentalItem]


class FundamentalReport(BaseModel):
    symbol: str
    market: str
    name: str
    sections: list[FundamentalSection]
    generated_at: str


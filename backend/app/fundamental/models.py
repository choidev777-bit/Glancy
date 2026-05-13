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


class InsightEvidence(BaseModel):
    label: str
    value: str
    interpretation: str


class InsightSection(BaseModel):
    id: str
    title: str
    tone: str
    summary: str
    evidence: list[InsightEvidence]


class InsightProfile(BaseModel):
    headline: str
    stance: str
    confidence: int
    horizon: str
    sections: list[InsightSection]
    conflicts: list[str] = []
    nextChecks: list[str] = []
    dataQuality: list[str] = []


class FundamentalReport(BaseModel):
    symbol: str
    market: str
    name: str
    sections: list[FundamentalSection]
    generated_at: str
    insight_profile: InsightProfile | None = None

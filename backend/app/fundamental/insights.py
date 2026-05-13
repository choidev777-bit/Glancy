from app.fundamental.models import FundamentalItem, FundamentalSection, InsightEvidence, InsightProfile, InsightSection


def _find(sections: list[FundamentalSection], title: str, label: str) -> FundamentalItem | None:
    section = next((item for item in sections if item.title == title), None)
    if not section:
        return None
    return next((item for item in section.items if item.label == label), None)


def _raw(item: FundamentalItem | None) -> float | None:
    return item.raw if item and isinstance(item.raw, (int, float)) else None


def _value(item: FundamentalItem | None) -> str:
    return item.value if item else "-"


def _tone(score: int) -> str:
    if score >= 70:
        return "positive"
    if score <= 40:
        return "warning"
    return "neutral"


def _valuation_score(per: float | None, pbr: float | None) -> int:
    score = 55
    if per is not None:
        score += 12 if per < 18 else -10 if per > 35 else 2
    if pbr is not None:
        score += 10 if pbr < 2 else -8 if pbr > 8 else 0
    return max(0, min(100, score))


def _profitability_score(roe: float | None, margin: float | None) -> int:
    score = 50
    if roe is not None:
        score += 18 if roe >= 0.2 else 8 if roe >= 0.1 else -8
    if margin is not None:
        score += 14 if margin >= 0.2 else 6 if margin >= 0.1 else -6
    return max(0, min(100, score))


def _growth_score(revenue_growth: float | None, earnings_growth: float | None) -> int:
    values = [value for value in (revenue_growth, earnings_growth) if value is not None]
    if not values:
        return 45
    average = sum(values) / len(values)
    return max(0, min(100, round(50 + average * 150)))


def _health_score(debt_to_equity: float | None, current_ratio: float | None) -> int:
    score = 55
    if debt_to_equity is not None:
        score += 14 if debt_to_equity < 80 else -12 if debt_to_equity > 180 else 0
    if current_ratio is not None:
        score += 10 if current_ratio >= 1.5 else -8 if current_ratio < 1 else 0
    return max(0, min(100, score))


def build_fundamental_profile(symbol: str, name: str, market: str, sections: list[FundamentalSection]) -> InsightProfile:
    per = _find(sections, "밸류에이션", "PER")
    pbr = _find(sections, "밸류에이션", "PBR")
    roe = _find(sections, "수익성", "ROE")
    operating_margin = _find(sections, "수익성", "영업이익률")
    revenue_growth = _find(sections, "성장성", "매출 성장률 YoY")
    earnings_growth = _find(sections, "성장성", "EPS 성장률")
    debt_to_equity = _find(sections, "재무 건전성", "부채비율(D/E)") or _find(sections, "재무 건전성", "부채비율")
    current_ratio = _find(sections, "재무 건전성", "유동비율")
    dividend_yield = _find(sections, "주주환원", "배당수익률")
    payout_ratio = _find(sections, "주주환원", "배당성향")

    valuation_score = _valuation_score(_raw(per), _raw(pbr))
    profitability_score = _profitability_score(_raw(roe), _raw(operating_margin))
    growth_score = _growth_score(_raw(revenue_growth), _raw(earnings_growth))
    health_score = _health_score(_raw(debt_to_equity), _raw(current_ratio))
    shareholder_score = 55 + (8 if _raw(dividend_yield) else 0) + (5 if _raw(payout_ratio) else 0)
    confidence = round((valuation_score + profitability_score + growth_score + health_score + shareholder_score) / 5)

    data_quality = []
    for item in [roe, operating_margin, revenue_growth, earnings_growth, debt_to_equity, current_ratio]:
        if item is None or item.value == "-":
            data_quality.append(f"{market.upper()} {symbol} 일부 기본 지표가 미제공 또는 부족합니다.")
            break

    sections_payload = [
        InsightSection(
            id="valuation",
            title="밸류에이션",
            tone=_tone(valuation_score),
            summary="PER/PBR로 현재 가격 부담을 확인합니다.",
            evidence=[
                InsightEvidence(label="PER", value=_value(per), interpretation="낮을수록 이익 대비 가격 부담이 낮습니다."),
                InsightEvidence(label="PBR", value=_value(pbr), interpretation="자본 대비 시장 평가 수준입니다."),
            ],
        ),
        InsightSection(
            id="profitability",
            title="수익성",
            tone=_tone(profitability_score),
            summary="ROE와 영업이익률로 기업이 자본과 매출을 이익으로 바꾸는 힘을 봅니다.",
            evidence=[
                InsightEvidence(label="ROE", value=_value(roe), interpretation="자본 효율성의 핵심 지표입니다."),
                InsightEvidence(label="영업이익률", value=_value(operating_margin), interpretation="본업 수익성의 질을 보여줍니다."),
            ],
        ),
        InsightSection(
            id="growth",
            title="성장성",
            tone=_tone(growth_score),
            summary="매출과 EPS 성장률이 같은 방향인지 확인합니다.",
            evidence=[
                InsightEvidence(label="매출 성장률", value=_value(revenue_growth), interpretation="외형 성장 속도입니다."),
                InsightEvidence(label="EPS 성장률", value=_value(earnings_growth), interpretation="주당 이익 개선 여부입니다."),
            ],
        ),
        InsightSection(
            id="financial-health",
            title="재무 건전성",
            tone=_tone(health_score),
            summary="부채 부담과 유동성으로 하락 국면의 방어력을 봅니다.",
            evidence=[
                InsightEvidence(label="부채비율", value=_value(debt_to_equity), interpretation="재무 레버리지 부담입니다."),
                InsightEvidence(label="유동비율", value=_value(current_ratio), interpretation="단기 지급 여력입니다."),
            ],
        ),
        InsightSection(
            id="shareholder-return",
            title="주주환원",
            tone=_tone(shareholder_score),
            summary="배당수익률과 배당성향으로 현금 환원 성격을 확인합니다.",
            evidence=[
                InsightEvidence(label="배당수익률", value=_value(dividend_yield), interpretation="가격 대비 현금 환원 수준입니다."),
                InsightEvidence(label="배당성향", value=_value(payout_ratio), interpretation="이익 중 배당으로 지급하는 비율입니다."),
            ],
        ),
    ]

    conflicts = []
    if valuation_score <= 45 and profitability_score >= 70:
        conflicts.append("수익성은 우수하지만 밸류에이션 부담이 있어 성장 지속성을 함께 확인해야 합니다.")
    if growth_score <= 45 and profitability_score >= 65:
        conflicts.append("현재 수익성은 양호하지만 성장 지표가 약해 멀티플 확장 여력이 제한될 수 있습니다.")

    stance = "bullish" if confidence >= 70 else "watch" if confidence <= 45 else "neutral"
    return InsightProfile(
        headline=f"{name}의 기본적 분석은 밸류에이션, 수익성, 성장성, 재무 건전성을 함께 봐야 합니다.",
        stance=stance,
        confidence=confidence,
        horizon="long",
        sections=sections_payload,
        conflicts=conflicts,
        nextChecks=[
            "동종 업계 평균과 PER/PBR을 비교합니다.",
            "성장률과 수익성이 같은 방향으로 개선되는지 확인합니다.",
            "부채 부담이 이익 변동성보다 빠르게 커지는지 확인합니다.",
        ],
        dataQuality=data_quality,
    )

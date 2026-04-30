# 해커톤 설계 문서: 투자 데이터 Skills 기반 대시보드

생성일: 2026-04-28
대회: 월간 해커톤 - 투자 데이터를 시각화하라 (DAKER/DACON)
모드: Builder (해커톤/데모)
목표: **압도적 1등**
상태: DRAFT

---

## 1. 대회 정보 요약

- **주최**: DACON
- **대회 페이지**: https://daker.ai/public/hackathons/hackathon-investment-data-skills-dashboard
- **총 상금**: 100만원 (1등 60 / 2등 30 / 3등 10)
- **참가 팀수**: 301팀
- **대회 기간**: 2026/4/6 ~ 5/22
- **현재 시점**: 2026/4/28 (기획서 마감 D-1)

### 핵심 과제
`Skills.md` 문서(투자 분석 규칙 정의서)를 설계하고, 이를 기반으로 **바이브 코딩**으로 금융 투자 대시보드 웹 서비스를 구현.

### 단계별 일정

| 단계 | 마감 | 제출물 |
|------|------|--------|
| 기획서 제출 | 4/30 09:59 | PDF 기획서 |
| Skills.md 제출 | 5/7 09:59 | .md (또는 zip) |
| 최종 웹 링크 제출 | 5/14 09:59 | 배포 URL |
| 1차 대중 투표 | 5/14~5/18 | - |
| 2차 내부 심사 | 5/18~5/22 | - |

### 평가 기준 (총 100점)

| 항목 | 배점 | 핵심 |
|------|------|------|
| 범용성 | 25 | 다양한 투자 데이터 구조 대응, 재사용성 |
| Skills.md 설계 | 25 | 분석 규칙 명확성, 시각화 기준, 인사이트 생성 규칙 |
| 대시보드 자동 생성 | 25 | 자동 분석 동작, 시각화 적절성, UI 완성도 |
| 바이브코딩 활용 | 15 | 문서 기반 생성 구조, 자동 생성 수준, 수동 구현 최소화 |
| 실용성/창의성 | 10 | 실제 활용 가능성, UX 개선 |

### 1차 투표 비율
- 제출팀 60% + 참가팀 20% + 대중 20%
- → **다른 참가팀(기술자)들이 가장 큰 표 비중**. 개발자가 봤을 때 임팩트 있는 작품이 유리.

---

## 2. 제품 비전

### 2-1. 우리가 만드는 것

**Skills.md를 런타임 설정 파일로 사용하는 범용 투자 대시보드.**

기본 해석을 넘어선 고급 구현:
- 일반 해커톤 참가자: Skills.md = 개발 시 AI에게 준 가이드 문서
- 우리: Skills.md = 런타임에 AI가 읽어서 분석을 수행하는 **살아있는 설정 파일**

### 2-2. 핵심 기능 (운영진 답변 기반 업데이트)

**운영진 Q&A 확인 사항 (질문게시판):**
> Q: 제출 대시보드에 여러 데이터를 미리 등록해놓고 카테고리 탭으로 선택하게 해도 되나요?
> A: 네, 그래주시면 더 좋습니다.

→ **사전 연결된 카테고리 탭 + 사용자 업로드** 가 권장 구조.

**기능 1: 카테고리 탭 (사전 연결된 데이터 소스)**

상단 6개 탭으로 즉시 탐색 가능:

| 탭 | 데이터 소스 | 비용 |
|----|------------|------|
| 🇰🇷 한국 주식 | pykrx | 무료 |
| 🇺🇸 미국 주식 | yfinance | 무료 |
| 📊 ETF | yfinance ETF | 무료 |
| ₿ 암호화폐 | CoinGecko API | 무료 |
| 📈 글로벌 지수 | yfinance (^KS11, ^GSPC 등) | 무료 |
| ⬆️ 내 데이터 업로드 | CSV/JSON | 무료 |

전부 무료 + API 키 불필요 → 운영진 규정 "심사자가 별도 키 없이 확인 가능" 만족.

**기능 2: 실시간 자동 업데이트**
- 카테고리 탭 내에서 라이브 데이터 주기적 갱신

**기능 3: CSV/JSON 업로드**
- 마지막 탭에서 사용자 임의 데이터 분석

### 2-3. UI 레이아웃 레퍼런스

**investing.com 기술 분석 페이지 구조를 기반**으로 하되, 차별화 레이어 추가.

**가져오는 것:**
- 반원 게이지 3개 (기술지표 / 종합 / 이동평균) → 한눈에 Strong Buy/Sell 판단
- 멀티 타임프레임 탭 (Hourly / Daily / Weekly / Monthly)
- 지표 테이블 (RSI, MACD, ADX, Williams %R 등 + Value + Action 컬럼)
- 이동평균 테이블 SMA/EMA 이중 표시 (MA5~MA200)
- 피벗 포인트 테이블

**추가하는 것 (차별화):**
- 상단 카테고리 탭 6개 (한국주식 / 미국주식 / ETF / 암호화폐 / 글로벌지수 / 업로드)
- Skills.md 기반 자동 해석 텍스트 패널 (외부 AI API 없음, 아래 참고)

**레이아웃 구조:**
```
[ 한국주식 ][ 미국주식 ][ ETF ][ 암호화폐 ][ 글로벌지수 ][ ⬆️ 업로드 ]
─────────────────────────────────────────────────────────
종목명 / 현재가 / 등락률
─────────────────────────────────────────────────────────
[ 요약 ] [ 기술적 분석 ] [ 기본적 분석 ]   ← 분석 탭 (SPA, 페이지 리로드 없음)
─────────────────────────────────────────────────────────

[요약 탭]
  종합 게이지 (Strong Buy/Sell)
  ┌─────────────────────────────┐
  │ 기술적 분석 요약             │
  │ 게이지 + 핵심 지표 3~4개    │
  │              [자세히 보기 →] │  ← 기술적 분석 탭으로 이동
  └─────────────────────────────┘
  ┌─────────────────────────────┐
  │ 기본적 분석 요약             │
  │ PER / PBR / ROE 핵심값      │
  │              [자세히 보기 →] │  ← 기본적 분석 탭으로 이동
  └─────────────────────────────┘

[기술적 분석 탭]
  [ Hourly ][ Daily ][ Weekly ][ Monthly ]   ← 타임프레임
  [ 기술지표 게이지 ]  [ 종합 게이지 ]  [ 이동평균 게이지 ]
  [ Skills.md 기반 자동 해석 텍스트 ]
  [ 기술 지표 테이블 ]     [ 이동평균 SMA/EMA 테이블 ]
  [ 피벗 포인트 테이블 ]
  [ 사용자 파라미터 설정 패널 ]

[기본적 분석 탭]
  밸류에이션 / 수익성 / 성장성 / 재무건전성 / 주주환원

─────────────────────────────────────────────────────────
탭 활성화 규칙:
  한국주식 / 미국주식  → 요약 ✅  기술적 분석 ✅  기본적 분석 ✅
  ETF / 암호화폐 / 지수 → 요약 ✅  기술적 분석 ✅  기본적 분석 🚫(비활성)
  CSV 업로드           → 감지된 유형에 따라 동적 결정
```

### 2-4. 차별화 포인트 (와우 모먼트)

1. **카테고리 탭 즉시 전환**: 탭 클릭 → 해당 자산 즉시 분석 (30초 안에 5개 카테고리 체험)
2. **실시간 데이터**: 시간이 지나면 수치가 살아서 업데이트
3. **Skills.md 기반 자동 해석**: 숫자만 보여주는 investing.com과 달리, 규칙 기반 텍스트 해석 자동 생성
4. **CSV 업로드 → 즉시 동일 포맷 분석**: 어떤 투자 데이터든 같은 시스템으로 처리

→ 1~4번 모두 동시 만족.

---

## 3. 합의된 전제 (Premises)

1. Skills.md를 단순한 "규칙 문서"가 아닌, AI 프롬프트처럼 설계해야 최고 점수
2. 실시간 API + CSV 업로드 두 가지 모두 데모로 보여줄 수 있어야 압도적 인상
3. UI/UX 완성도가 기술적 완성도만큼 중요 (투표하는 사람들은 "멋있어 보이는 것"에 반응)
4. Skills.md 파일을 교체하면 분석 관점이 실시간으로 바뀌는 "범용성 데모"가 차별화의 핵심

---

## 4. 선택한 접근법

### Approach C: Skills.md-as-Runtime-Engine (확정)

Skills.md 파일 자체가 런타임 설정으로 동작.
브라우저에서 Skills.md 편집 → 대시보드 즉시 변환.
실시간 API + CSV 업로드 모두 지원.

**채택 이유:**
- 평가 기준 50점(범용성+Skills.md)이 직접적으로 "Skills.md가 얼마나 강력하게 시스템을 구동하느냐"를 봄
- 브라우저에서 Skills.md를 편집하면 대시보드가 즉시 바뀌는 장면 하나가 다른 팀 전체를 압도
- 바이브 코딩 15점도 "문서가 시스템을 구동한다"는 구조 자체로 입증

**기술 스택 방향:**
- 바이브 코딩 위주 (Cursor/Claude/Windsurf 활용)
- 구체적 프레임워크는 미확정 (Next.js vs Streamlit)
- **외부 LLM API 미사용** (인사이트는 Skills.md 규칙 기반)
- 데이터: pykrx / DART API / yfinance / Binance / CoinGecko (전부 무료)
- 배포: Vercel 등 무료 플랫폼

**차트 라이브러리: Lightweight Charts (TradingView 오픈소스, MIT)**
- TradingView와 동일한 외관의 캔들/라인 차트
- 우리 데이터(pykrx/Binance/yfinance)를 직접 주입 가능
- charts.md 규칙이 차트 종류/색상 제어 가능
- 실시간 업데이트: `series.update()` 메서드로 WebSocket/폴링 데이터 연결
- TradingView Widget 임베드 방식은 미사용 (우리 데이터 파이프라인 우회 문제)

**실시간 차트 구현 방식:**

| 카테고리 | 실시간 수준 | 방식 |
|---------|:---------:|------|
| 암호화폐 | ✅ 진짜 실시간 | Binance WebSocket → series.update() |
| 미국 주식 | ⚠️ 15분 지연 | yfinance 폴링 (15초 간격) |
| 한국 주식 | ⚠️ 장중 폴링 | pykrx 폴링 (30초 간격) |
| ETF / 지수 | ⚠️ 15분 지연 | yfinance 폴링 |

**차트 구성:**
- 캔들차트 + MA 오버레이 → Lightweight Charts 메인 패널
- RSI, MACD 등 지표 → Lightweight Charts 하단 별도 패널
- 게이지, 테이블 → 직접 HTML/CSS

---

## 5. Skills.md 모듈화 구조 (확정)

해커톤 규정상 "여러 개 제출 가능, 기능별/역할별 분리 권장"되어 있음.

### 확정 구조: 7개 모듈 (구조 C)

```
skills/
├── main.md         # Orchestrator: 실행 흐름, 모듈 간 호출 정의
├── data.md         # Data Layer: CSV/JSON/API 입력 → 표준 MarketData
├── indicators.md   # Computation Layer: 재무/기술/포트폴리오 지표
├── insights.md     # AI Narrative Layer: LLM 프롬프트, 인사이트 생성 규칙
├── charts.md       # Visual Selection Layer: 데이터/지표 → 차트 종류 매핑
├── layout.md       # Composition Layer: 그리드, 카드 배치, 반응형, 상태
└── theme.md        # Design Token Layer: 색/폰트/간격 (라이트/다크/브랜드)
```

### 의존성 그래프

```
main.md
  └─ data.md
       └─ indicators.md
            └─ insights.md
                 └─ charts.md
                      └─ layout.md ← theme.md (횡주입)
                           └─ Final Dashboard
```

### 모듈별 책임/인터페이스

#### main.md (Orchestrator)
- 시스템 개요, 실행 흐름, 모듈 의존성 그래프
- 사용자 입력 시나리오별 라우팅 (CSV 업로드 vs API 조회)
- 에러 처리 정책 (모듈 실패 시 fallback)
- AI가 이 파일만 읽어도 시스템 전체 그림이 잡혀야 함

#### data.md (Data Layer) — Data Source Registry 패턴
- **입력:** 카테고리 탭 선택 또는 사용자 업로드
- **출력:** 표준화된 `MarketData` (모든 소스가 같은 형식)
- **데이터 소스 레지스트리:**
  - `kr_stocks` → pykrx (가격/거래량) + DART API (재무제표)
  - `us_stocks` → yfinance (가격 + 펀더멘털 풀커버)
  - `etfs` → yfinance ETF list
  - `crypto` → Binance API (OHLCV + 실시간, 메인) + CoinGecko (코인 목록/메타, 보조)
  - `global_indices` → yfinance (^KS11, ^GSPC, ^IXIC 등)
  - `user_upload` → CSV/JSON 자동 감지
- 각 소스별 컬럼 매핑 규칙 ("종가"/"Close"/"close_price" → `close`)
- 결측치 처리, 시간 정규화 (KST/UTC, 일/주/월)
- 검증 실패 시 피드백 메시지 포맷
- → **이 모듈이 범용성 25점의 라이브 증거**

#### indicators.md (Computation Layer)
- **입력:** `MarketData`
- **출력:** `MarketData + Indicators`
- 기본 지표: 수익률, 누적수익률, 변동성, 샤프 비율, MDD
- 기술 지표: MA5/20/60, RSI, MACD, 볼린저밴드
- 포트폴리오 지표: 가중 수익률, 상관관계, 베타
- 각 지표 계산식 + 해석 가이드 + 자동 선택 규칙

#### insights.md (Rule-Based Narrative Layer)
- **입력:** `MarketData + Indicators`
- **출력:** `Insights[]` (규칙 기반 텍스트, 외부 AI API 없음)
- **외부 AI API 미사용** — insights.md 규칙 자체가 지능
- 규칙 구조: `IF 조건 → 텍스트 템플릿 {변수 치환}`
  - 예: RSI > 70 → "RSI {value}로 과매수 구간. 단기 조정 가능성 유의."
  - 예: MA5 > MA20 > MA60 → "이동평균 정배열. 상승 추세 유지 중."
- 카테고리: 추세, 위험, 기회, 종합 시그널
- 톤 가이드 (객관적, 단정 금지, "~로 보입니다" 어조)
- 한/영 출력 분기, 인사이트 길이 제한
- **장점**: API 비용 0, 심사자 키 불필요, 응답 즉각, Skills.md 자체가 지능임을 증명

#### charts.md (Visual Selection Layer)
- **입력:** `MarketData + Indicators + Insights`
- **출력:** `ChartSpec[]`
- 차트 매핑 규칙:
  - 시계열 → Line / Candlestick
  - 분포 → Histogram / Box plot
  - 비교 → Bar / Stacked bar
  - 상관관계 → Heatmap / Scatter
  - 비중 → Donut / Treemap
- 차트별 권장 설정, 다운샘플링 규칙, 사용 금지 차트

#### layout.md (Composition Layer)
- **입력:** `ChartSpec[] + Insights[]`
- **출력:** `LayoutSpec`
- 그리드 시스템 (12-col 또는 CSS Grid)
- 카드/섹션 구조 (Hero KPI → 메인 차트 → 보조 차트 → 인사이트)
- 정보 우선순위, 반응형 브레이크포인트
- 빈/로딩/에러 상태 처리
- Skills.md 편집 → 핫 리로드 인터랙션

#### theme.md (Design Token Layer)
- **입력:** 없음 (정적 정의)
- **출력:** CSS 변수 / 디자인 토큰 객체
- 의미 색상 (positive/negative/neutral/warning)
- 차트 시리즈 색상, 배경/전경/보더
- 타이포그래피, 간격(4px 기반), 라운드/그림자
- 모드 (light/dark, brand-A/B)
- 한글 폰트 우선순위 (Pretendard 등)

### 와우 모먼트 매핑 (모듈 교체 시연)

| 시연 | 교체 모듈 | 효과 |
|------|----------|------|
| 다크 ↔ 라이트 즉시 전환 | theme.md | 시각적 임팩트 |
| 보수 ↔ 공격적 투자자 시각 | insights.md | AI 어조 변화 |
| 기본 ↔ 고급 분석 | indicators.md | 데이터 깊이 변화 |
| 미국 ↔ 한국 시장 | data.md | 데이터 소스 변화 |
| 대시보드형 ↔ 리포트형 | layout.md | UX 변화 |

→ 5가지 차원으로 "범용성 25점" 증명.

---

## 6. 워크플로우: "문서 → 프로토타입 → 문서 개선 → 최종 빌드"

### 결정된 순서: Skills.md 설계 우선 → 대시보드 구현 (2번)

**1번(대시보드 먼저)이 위험한 이유:**
- 사후 문서화가 되어 "바이브코딩 활용 15점"에서 거의 0점
- 운영진 일정(Skills.md 제출 5/7 → 웹 링크 5/14)이 이미 "문서 → 코드" 순서 강제

### 단계별 워크플로우

```
[1단계] ~4/30 09:59 — 기획서 + Skills.md v0.1 (스켈레톤)
  ├─ 각 .md 파일의 역할/구조만 잡음
  ├─ 핵심 규칙 1~2개씩 채워봄
  └─ 기획서 PDF 제출

[2단계] 4/30 ~ 5/3 — 빠른 프로토타입
  ├─ Skills.md v0.1을 Cursor/Claude에게 줘서 대시보드 v0.1 생성
  ├─ 뭐가 작동하고 뭐가 안 되는지 학습
  └─ "이 규칙은 너무 모호하다", "이건 더 구체적이어야겠다" 발견

[3단계] 5/3 ~ 5/7 — Skills.md 정식판 작성
  ├─ 프로토타입에서 배운 것 반영
  ├─ 모듈화 구조 확정 (main + ui + indicators + ...)
  ├─ 각 파일 완성도 끌어올림
  └─ Skills.md 제출

[4단계] 5/7 ~ 5/14 — 최종 대시보드 구현
  ├─ 완성된 Skills.md만 가지고 처음부터 다시 바이브 코딩
  ├─ 핵심: "수동 구현 최소화" 증명
  ├─ UI 폴리싱, 배포
  └─ URL 제출
```

**핵심 철학**: 4단계에서 **Skills.md만 가지고 처음부터 다시 빌드**. 이게 "문서가 시스템을 구동한다"의 증명.

---

## 7. 분석 체계 (확정)

### 7-1. 분석 유형 전체 구조

```
분석 유형
├── 기술적 분석 (모든 카테고리 탭 + OHLCV/가격 CSV)
├── 기본적 분석 (주식 탭 전용: 한국/미국 주식)
└── CSV/JSON 업로드 자동 감지 분석
    ├── 포트폴리오 분석
    ├── 다종목 비교 분석
    └── 수익률 통계 분석
```

### 7-2. 기술적 분석 (Technical Analysis)

**적용 대상:** 전 카테고리 (한국주식 / 미국주식 / ETF / 암호화폐 / 글로벌지수 / OHLCV CSV)

```
기술적 분석
├── 추세 지표
│   ├── SMA: MA5, MA10, MA20, MA50, MA100, MA200
│   └── EMA: MA5, MA10, MA20, MA50, MA100, MA200
│
├── 모멘텀 지표
│   ├── RSI(14)
│   ├── MACD(12,26,9)
│   └── 스토캐스틱 STOCH(9,6), STOCHRSI(14)
│
├── 변동성 지표
│   ├── 볼린저밴드(20,2)
│   └── ATR(14)
│
├── 강도 지표
│   ├── ADX(14)
│   ├── Williams %R
│   ├── CCI(14)
│   ├── Bull/Bear Power(13)
│   ├── Ultimate Oscillator
│   └── ROC
│
├── 거래량 지표
│   ├── OBV (On-Balance Volume)
│   └── Volume MA
│
├── 피벗 포인트
│   ├── Classic
│   ├── Fibonacci
│   ├── Camarilla
│   ├── Woodie's
│   └── DeMark's
│
└── 종합 시그널 (게이지)
    ├── 기술 지표 게이지 (매수/매도 카운트)
    ├── 이동평균 게이지
    └── 종합 게이지
```

### 7-2-1. 지표별 시그널 기준 (indicators.md 핵심 규칙)

**RSI(14)**
```
< 20        → Strong Buy  "RSI {v}. 극단적 과매도, 반등 가능성 높음."
20 ~ 30     → Buy         "RSI {v}. 과매도 구간 진입."
30 ~ 50     → Neutral     "RSI {v}. 중립 하단, 하락 우위."
50 ~ 70     → Neutral     "RSI {v}. 중립 상단, 상승 우위."
70 ~ 80     → Sell        "RSI {v}. 과매수 구간. 단기 조정 가능성."
> 80        → Strong Sell "RSI {v}. 극단적 과매수. 조정 경계."
```

**MACD(12,26,9)**
```
MACD > Signal + 히스토그램 증가  → Buy         "MACD 상승 모멘텀 유지."
MACD < Signal + 히스토그램 감소  → Sell        "MACD 하락 모멘텀 유지."
MACD가 Signal 상향 돌파          → Buy         "MACD 골든크로스. 상승 전환 신호."
MACD가 Signal 하향 돌파          → Sell        "MACD 데드크로스. 하락 전환 신호."
MACD > 0                         → +보정       "MACD 양수권. 강세 영역."
MACD < 0                         → -보정       "MACD 음수권. 약세 영역."
```

**Stochastic(9,6)**
```
%K < 20, %K가 %D 상향 돌파  → Strong Buy  "과매도 구간 상향 돌파."
%K < 20                     → Buy         "스토캐스틱 과매도."
%K > 80, %K가 %D 하향 돌파  → Strong Sell "과매수 구간 하향 돌파."
%K > 80                     → Sell        "스토캐스틱 과매수."
```

**볼린저밴드(20,2)**
```
현재가 > 상단밴드  → Sell    "상단밴드 이탈. 과매수 또는 강한 돌파."
현재가 ≈ 상단밴드  → Sell    "상단밴드 근접. 저항 구간."
현재가 ≈ 하단밴드  → Buy     "하단밴드 근접. 지지 구간."
현재가 < 하단밴드  → Buy     "하단밴드 이탈. 과매도."
밴드 수축(squeeze) → Neutral "밴드 수축. 큰 변동성 돌파 임박."
```

**ADX(14)**
```
ADX < 20, +DI > -DI   → Neutral  "ADX {v}. 추세 약함. 방향성 미확인."
ADX < 20, -DI > +DI   → Neutral  "ADX {v}. 추세 약함. 횡보 구간."
ADX 25~50, +DI > -DI  → Buy      "ADX {v}. 강한 상승 추세 확인."
ADX 25~50, -DI > +DI  → Sell     "ADX {v}. 강한 하락 추세 확인."
ADX > 50              → 추세 강화  "ADX {v}. 매우 강한 추세 진행 중."
```

**Williams %R**
```
-80 ~ -100  → Buy     "Williams %R {v}. 과매도 구간."
-0 ~ -20    → Sell    "Williams %R {v}. 과매수 구간."
나머지       → Neutral
```

**CCI(14)**
```
> +200     → Strong Sell  "CCI {v}. 극단적 과매수."
+100~+200  → Sell         "CCI {v}. 과매수 구간."
-100~+100  → Neutral      "CCI {v}. 중립."
-100~-200  → Buy          "CCI {v}. 과매도 구간."
< -200     → Strong Buy   "CCI {v}. 극단적 과매도."
```

**ROC / Bull/Bear Power / Ultimate Oscillator**
```
ROC > 0              → Buy   "ROC 양수. 상승 모멘텀."
ROC < 0              → Sell  "ROC 음수. 하락 모멘텀."
Bull/Bear Power > 0  → Buy   "불파워 우세. 매수 압력 강함."
Bull/Bear Power < 0  → Sell  "베어파워 우세. 매도 압력 강함."
UO < 30              → Buy   "얼티밋 오실레이터 {v}. 과매도."
UO > 70              → Sell  "얼티밋 오실레이터 {v}. 과매수."
```

**OBV (거래량)**
```
OBV 상승 + 가격 상승  → Buy   "OBV 상승. 상승 추세 거래량 확인."
OBV 하락 + 가격 하락  → Sell  "OBV 하락. 하락 추세 거래량 확인."
OBV 상승 + 가격 하락  → Buy   "OBV-가격 강세 다이버전스. 반등 가능성."
OBV 하락 + 가격 상승  → Sell  "OBV-가격 약세 다이버전스. 상승 신뢰 낮음."
```

**ATR(14)** — 방향성 없음, 맥락 정보만
```
ATR > 최근 평균 × 1.5  → "변동성 높음. 손절/목표가 여유 설정 권장."
ATR < 최근 평균 × 0.7  → "변동성 낮음. 돌파 시 큰 움직임 가능."
```

**이동평균 시그널**
```
현재가 > MA → Buy (각각 +1)
현재가 < MA → Sell (각각 -1)
MA5 > MA20 > MA60         → "정배열. 상승 추세 유지 중."
MA5 < MA20 < MA60         → "역배열. 하락 추세 진행 중."
MA5가 MA20 상향 돌파       → "골든크로스 발생. 상승 전환 신호."
MA5가 MA20 하향 돌파       → "데드크로스 발생. 하락 전환 신호."
```

### 7-2-2. 종합 시그널 계산 방식

```
점수화:
  Strong Buy  → +2
  Buy         → +1
  Neutral     →  0
  Sell        → -1
  Strong Sell → -2

게이지 ①: 이동평균 (SMA 6 + EMA 6 = 최대 ±24점)
게이지 ②: 기술지표 (RSI + MACD + Stoch + ADX + CCI + Williams + ROC + Bull/Bear + UO + OBV = 최대 ±20점)
게이지 ③: 종합 = ① + ② 가중 합산

레벨 (정규화 %):
  80~100% → Strong Buy
  60~80%  → Buy
  40~60%  → Neutral
  20~40%  → Sell
  0~20%   → Strong Sell
```

### 7-2-3. 종합 인사이트 텍스트 생성 (insights.md 규칙)

**외부 AI API 없음. 패턴 매칭 + 템플릿 치환.**

```
Step 1: 핵심 상태값 계산
  rsi_zone      = 과매수 / 과매도 / 중립
  macd_signal   = 골든크로스 / 데드크로스 / 상승유지 / 하락유지
  ma_align      = 정배열 / 역배열 / 혼재
  trend_str     = 강함(ADX>25) / 약함(ADX<20) / 보통

Step 2: 케이스별 템플릿 선택
  [Strong Buy]  buy_count > sell_count × 2:
    → "전반적으로 강한 매수 신호입니다. {ma_align} 상태에서
       RSI {rsi}로 {rsi_zone}이며, {macd_signal} 신호가 확인됩니다."

  [Strong Sell] sell_count > buy_count × 2:
    → "전반적으로 매도 압력이 우세합니다. RSI {rsi}로 {rsi_zone}이며,
       {ma_align} 상태입니다. 단기 조정 가능성에 유의하세요."

  [Mixed]       |buy_count - sell_count| ≤ 2:
    → "지표가 혼재되어 있습니다. {strongest_indicator}가 {signal}을
       나타내나 {conflicting_indicator}는 반대 방향을 가리킵니다.
       추가 확인 후 판단을 권장합니다."

Step 3: 멀티 타임프레임 요약 (선택)
  일봉 매수 + 주봉 중립 + 월봉 매수:
    → "단기(일봉) 매수 우위이나 중기(주봉) 혼재.
       월봉 상승 추세는 유지 중입니다."
```

### 7-2-4. 사용자 파라미터 변경 기능

**기본값은 indicators.md에 정의. 사용자가 UI에서 변경 가능.**

| 지표 | 변경 가능 항목 | 기본값 | 허용 범위 |
|------|--------------|--------|----------|
| RSI | 기간, 과매수/과매도 기준선 | 14 / 70 / 30 | [5,50] / [50,90] / [10,50] |
| MACD | 단기/장기/시그널 기간 | 12 / 26 / 9 | [5,50] / [10,100] / [3,20] |
| 볼린저밴드 | 기간, 표준편차 배수 | 20 / 2.0 | [5,50] / [1.0,3.0] |
| Stochastic | %K, %D 기간 | 9 / 6 | [3,30] / [3,15] |
| ADX | 기간 | 14 | [5,50] |
| CCI | 기간 | 14 | [5,50] |
| ATR | 기간 | 14 | [5,50] |
| 이동평균 | 표시할 기간 선택 | 5/20/60/200 | 5/10/20/50/60/100/120/200 |

**UI 구성:**
```
[RSI]  기간: [14]  과매수: [70]  과매도: [30]  [적용]
[MACD] 단기: [12]  장기: [26]  시그널: [9]    [적용]
[BB]   기간: [20]  표준편차: [2.0]             [적용]
[MA]   ☑5  ☑20  ☑60  ☐10  ☑200              [적용]
                                    [전체 초기화]
```

**Skills.md 연결 포인트:**
파라미터 변경 = indicators.md의 기본값을 런타임에 오버라이드.
사용자가 RSI 14→7 변경 시 → 시그널/게이지/인사이트 텍스트 전체 즉시 재생성.
"Skills.md가 런타임 설정 파일"임을 사용자가 직접 체험.

### 7-3. 기본적 분석 (Fundamental Analysis)

**적용 대상:** 주식 탭만 (한국주식 / 미국주식)
**비고:** ETF/암호화폐/지수 탭에서는 섹션 자체 숨김

```
기본적 분석
├── 밸류에이션
│   ├── PER, Forward PER
│   ├── PBR
│   ├── PSR (주가매출비율)         ← 미국만
│   └── EV/EBITDA                 ← 미국만
│
├── 수익성
│   ├── ROE, ROA                  ← 미국만
│   ├── 영업이익률                 ← 미국만
│   ├── 순이익률                   ← 미국만
│   └── 매출총이익률               ← 미국만
│
├── 성장성
│   ├── 매출 성장률 YoY            ← 미국만
│   ├── 영업이익 성장률            ← 미국만
│   └── EPS 성장률                ← 미국만
│
├── 재무건전성
│   ├── 부채비율                   ← 미국만
│   ├── 유동비율                   ← 미국만
│   └── 이자보상배율               ← 미국만
│
└── 주주환원
    ├── EPS, BPS                  ← 한국+미국
    ├── 배당수익률                 ← 한국+미국
    └── 배당성향                  ← 미국만
```

**데이터 소스 커버리지:**

| 섹션 | 한국 (pykrx + DART API) | 미국 (yfinance) |
|------|:-----------------------:|:---------------:|
| 밸류에이션 기본 (PER/PBR/EPS) | ✅ pykrx | ✅ |
| 배당 | ✅ pykrx | ✅ |
| 수익성 (ROE/ROA/마진) | ✅ DART | ✅ |
| 성장성 (매출/이익 성장률) | ✅ DART | ✅ |
| 재무건전성 (부채비율/유동비율) | ✅ DART | ✅ |
| 고급 밸류에이션 (PSR/EV/EBITDA) | ❌ | ✅ |

**키움 Open API 미사용 사유:**
- Windows 전용 COM/OCX — 클라우드 배포 불가
- 심사자 접근 불가 (키움 계정 + HTS 설치 필요)
- 운영진 규정 위반: "외부 API 사용 시 심사자가 별도 키 없이 확인 가능해야 함"

### 7-4. CSV/JSON 업로드 자동 감지 분석

**data.md 감지 규칙 (우선순위 순):**

```
1. Open + High + Low + Close + Volume 컬럼 존재
   → type: OHLCV → 기술적 분석 풀세트

2. Ticker + Weight(비중) or Quantity(수량) 컬럼 존재
   → type: portfolio → 포트폴리오 분석

3. Date + 종목 컬럼 3개 이상
   → type: multi_asset → 다종목 비교 분석

4. Date + Return(수익률) 컬럼
   → type: returns → 수익률 통계 분석

5. Date + Close(or Price) 컬럼만
   → type: price_series → 부분 기술적 분석 (거래량 제외)

6. 감지 실패
   → type: unknown → 사용자 선택 UI 표시
```

**유형별 분석 내용:**

| 유형 | 분석 내용 |
|------|----------|
| OHLCV | 기술적 분석 풀세트 + 게이지 |
| portfolio | 비중 파이차트, 수익률, MDD, 샤프, 종목 간 상관관계 히트맵 |
| multi_asset | 정규화 수익률 비교 라인차트, 상관관계 매트릭스, 변동성 비교 |
| returns | 누적수익률, 연율화 수익률/변동성, 샤프, MDD, 월별 수익률 히트맵 |
| price_series | MA, RSI, 볼린저밴드, 수익률, 변동성 |

### 7-5. indicators.md 분기 구조

```markdown
## 유형별 적용 지표 (indicators.md 핵심 로직)

OHLCV         → 기술적 분석 전체 + 기본적(주식 소스일 경우)
price_series  → MA, RSI, 볼린저밴드, 수익률, 변동성
portfolio     → 샤프, MDD, 상관관계, 비중 분석
multi_asset   → 정규화 수익률, 상관관계 매트릭스
returns       → 통계 분석 풀세트
```

---

## 8. 확정된 기술 제약사항

- **외부 AI API 미사용** (Claude / GPT / OpenAI 등 LLM API 호출 없음)
  - 인사이트 텍스트는 insights.md 규칙 + 계산된 지표값 치환으로 생성
  - `IF RSI > 70 → "RSI {value}로 과매수 구간..."` 형태의 규칙 기반
  - Skills.md 자체가 지능 역할 → 바이브코딩 15점 + Skills.md 25점에 직접 기여
- **데이터 소스 전부 무료**
  - pykrx (한국 주식 가격 + 기본 펀더멘털: PER/PBR/EPS/배당)
  - DART API (한국 주식 재무제표 → ROE/ROA/마진/성장률/부채비율 계산)
  - yfinance (미국 주식, ETF, 글로벌 지수, 펀더멘털 풀커버)
  - Binance API (암호화폐 OHLCV + 실시간, 키 불필요) — 메인
  - CoinGecko API 무료 플랜 (시총 상위 코인 목록 + 메타데이터) — 보조
- **심사자 별도 설정 불필요**: DART API 키는 개발자가 발급받아 서버에 내장. 심사자는 URL 접속만 하면 됨 (운영진 규정 준수)

## 8. 미해결 / 다음 세션에서 결정할 것

- [ ] 기술 스택 최종 확정 (Streamlit vs Next.js vs 하이브리드)
- [ ] Skills.md 파일별 구체적 내용 작성
- [ ] UI 디자인 컨셉 (다크모드? 라이트? 색상 팔레트)
- [ ] 배포 플랫폼 (Vercel / Streamlit Cloud / Railway)

---

## 8. 다음 액션 (즉시)

**1단계 작업 시작:**
1. 기획서 PDF 작성 (4/30 09:59 마감, 약 24시간 남음)
   - 서비스 개요
   - 분석 흐름 설계
   - 대시보드 구성
   - Skills.md 설계 방향 (모듈화 구조)
   - 확장 기능 아이디어

2. 기획서 작성과 병행하여 Skills.md v0.1 스켈레톤 잡기

---

## 부록: 채점 최적화 체크리스트

### 범용성 (25점)
- [ ] 다양한 CSV 컬럼 구조 자동 인식
- [ ] 한국/미국 시장 모두 지원
- [ ] Skills.md 교체로 다른 도메인 적용 가능 시연

### Skills.md 설계 (25점)
- [ ] 모듈화된 명확한 구조
- [ ] main.md orchestrator 잘 짜여 있음
- [ ] 각 파일이 한 가지 역할만 명확히

### 대시보드 자동 생성 (25점)
- [ ] CSV 업로드만으로 분석 자동 실행
- [ ] 차트/시각화 적절성
- [ ] UI 완성도 (상용 서비스 수준)

### 바이브코딩 활용 (15점)
- [ ] "Skills.md만으로 빌드" 증명 가능
- [ ] 수동 코드 최소화 명시
- [ ] 문서 → 코드 흐름 README에 기록

### 실용성/창의성 (10점)
- [ ] 실제 투자자가 쓰고 싶은 수준
- [ ] 확장 기능 아이디어
- [ ] UX 디테일 (로딩, 에러 처리 등)

---

# Codex Working Memory

업데이트: 2026-04-30

이 섹션은 Codex와 긴 작업을 이어갈 때 context 손실을 줄이기 위한 최신 작업 메모다. 위쪽 기존 문서는 Claude Code와 작업하던 초기 설계 맥락이며, 일부 인코딩이 깨져 있으므로 원문은 보존하고 이 섹션을 최신 기준으로 사용한다.

## 프로젝트 정체성

- 프로젝트명: Glancy
- 목적: DAKER/DACON 투자 데이터 Skills 기반 대시보드 해커톤 제출작
- 핵심 전략: `Skills.md`를 단순 설명 문서가 아니라 dashboard/runtime/visualization을 구동하는 규칙 레이어로 증명한다.
- 프론트엔드: Vite + React + TypeScript
- 백엔드: FastAPI
- 배포 목표: Frontend는 Vercel, Backend는 Railway
- 핵심 평가 대응: 범용성, Skills.md 설계, 자동 대시보드 생성, Vibe Coding Evidence, 실용성/창의성

## 구현 완료 상태

Plan 01-14까지 로컬 구현 완료.

- Plan 01: Proposal/PDF
- Plan 02: Skills.md modules and skills.zip
- Plan 03: Backend data layer
- Plan 04: Indicators engine
- Plan 05: Insights engine
- Plan 06: Fundamental data
- Plan 07: CSV upload
- Plan 08: Chart integration
- Plan 09: UI polish
- Plan 10: Deployment QA docs
- Plan 11: Skills Runtime Demo
- Plan 12: Vibe Coding Evidence
- Plan 13: Demo Reliability Layer
- Plan 14: Visualization Intelligence

## 현재 중요한 구현 포인트

- `src/App.tsx`: `TechnicalView`는 `React.lazy` + `Suspense`로 분리했다. 초기 JS bundle을 줄이기 위해 technical chart code를 별도 chunk로 뺐다.
- `src/components/upload/UploadView.tsx`: CSV/JSON upload flow. 최신 upload id guard가 있어 느린 이전 응답이 최신 결과를 덮어쓰지 못한다. Upload 결과는 raw JSON보다 `VisualizationDashboard`가 먼저 보인다.
- `src/components/visualization/*`: Plan 14 Visualization Intelligence 구현 영역. Portfolio, multi-asset, returns, price series 등 업로드 데이터 유형별 시각화를 담당한다.
- `src/lib/visualizer.ts`: data type별 `ChartSpec[]` bundle 생성. 각 chart는 `reason`과 `skillsRule`을 포함해야 한다.
- `src/components/charts/CandleChart.tsx`: `DEFAULT_ENABLED_MAS`는 module-level constant.
- `src/index.css`: `transition-all` 제거 완료. tab classes는 `transition-colors` 사용.

## 검증 상태

최근 확인한 검증:

- `npm run build` 통과
- `node tests\plan09-ui-polish.test.mjs` 통과
- `node tests\plan14-visualization-intelligence.test.mjs` 통과
- Plan 08-14 관련 정적 테스트 통과 이력 있음
- Backend tests: `23 passed, 1 warning` 이력 있음

주의:

- sandbox 안에서 `npm run build`는 종종 `esbuild spawn EPERM`으로 실패한다.
- 이 경우 코드 실패가 아니라 권한 문제였고, escalated 실행으로 `npm run build`를 다시 돌리면 통과했다.

## 최근 리뷰와 남은 UI 개선 후보

Vercel React Best Practices 리뷰에서 반영 완료:

- Upload race condition 방지
- Heavy chart code lazy loading
- CandleChart default array hoist

Web Interface Guidelines 리뷰에서 반영 완료:

- `src/index.css`의 `transition-all` 제거

아직 남은 접근성 개선 후보:

- `CategoryTabs`: `div onClick`을 semantic `button`으로 바꾸기
- `Header`: icon-only buttons에 `aria-label` 추가
- `Header`: search inputs에 accessible label/name/autocomplete 추가
- `App` footer: `href="#"` placeholder links를 실제 링크나 button으로 정리
- `SkillsEditor`: textarea label/name/autocomplete 추가
- `TechnicalView`: indicator parameter inputs에 label/name/inputMode 추가
- Upload/loading async states에 `role="status"`와 `aria-live="polite"` 추가

## 문서/제출 관련 남은 일

구현 자체는 Plan 14까지 완료됐고, 남은 것은 제출/운영 준비다.

- Vercel frontend 배포
- Railway backend 배포
- Vercel `VITE_API_BASE_URL` 환경변수 설정
- Railway health endpoint 확인
- fallback/sample/cached 상태가 실제 배포 화면에서 보이는지 확인
- judge demo script로 3분 플로우 리허설
- proposal PDF, skills.zip, evidence docs, demo URL 제출물 최종 확인

## 작업 원칙

- 기존 변경을 되돌리지 않는다.
- 리뷰 수정은 지적된 범위만 surgical하게 고친다.
- 완료라고 말하기 전에는 반드시 fresh verification을 실행한다.
- 수동 코드 편집은 `apply_patch`로 한다.
- 인터넷 최신 정보가 필요한 해커톤/배포/문서 확인은 browse를 사용한다.

---

# Fact Audit Note

Updated: 2026-04-30

This note audits the `Codex Working Memory` section above.

## Confirmed From Local Files

- `Plan 01-14 local implementation complete` is supported by local plan files and implementation artifacts.
- `docs/proposal/proposal.pdf` exists.
- `skills.zip` exists.
- `src/App.tsx` uses `React.lazy` and `Suspense` for `TechnicalView`.
- `src/components/upload/UploadView.tsx` has a latest-upload id guard and renders `VisualizationDashboard` before raw JSON.
- `src/lib/visualizer.ts` and `src/components/visualization/*` exist for Visualization Intelligence.
- `src/components/charts/CandleChart.tsx` has module-level `DEFAULT_ENABLED_MAS`.
- `transition-all` is no longer present in `src/index.css` or `src/**/*.tsx`.
- Backend verification was freshly run on 2026-04-30: `23 passed, 1 warning`.

## Should Be Treated As Plan/Target, Not Completed Deployment

- `Frontend on Vercel, Backend on Railway` is a deployment target, not evidence that deployment is already complete.
- `VITE_API_BASE_URL`, Railway health check, fallback behavior on deployed URLs, and final demo URL still need real deployment verification.

## Official Hackathon Facts

- The official DAKER/DACON page URL is recorded above.
- During this audit, the public page loaded as a JS/HTML page and did not expose enough text for reliable automated verification.
- Therefore, schedule/prize/evaluation numbers in the older top section should be treated as historical notes from the earlier Claude Code context unless rechecked manually or with a browser screenshot.

## Encoding Warning

- The older document and the Korean `Codex Working Memory` text display mojibake in this terminal.
- For future machine-readable memory, prefer ASCII/English notes or rewrite this file as clean UTF-8 in one controlled pass.

# Codex Latest Working Context

Updated: 2026-04-30

This section is the current machine-readable memory for Codex. Older Korean sections in this file may display mojibake, so prefer this section when restoring context.

## Current Product Direction

- Project name: Glancy.
- Team name in proposal: weekend.
- Core hackathon message: Skills.md should work as an executable/operational specification that guides AI code generation, dashboard behavior, fallback policy, and user setup instructions.
- Keep the core demo usable without paid or account-bound APIs whenever possible.
- Optional real brokerage integrations are allowed, but they must not become mandatory for the judge demo.

## Data/Search Decisions

- The dashboard search bar must search across Korean stocks, US stocks, ETFs, crypto, and global indices.
- For Korean stocks, the requirement is not "major sample stocks"; it is full KOSPI/KOSDAQ search.
- Current implementation now loads the KOSPI/KOSDAQ universe from KRX KIND corporation list in `backend/app/sources/search_source.py`.
- Evidence: `_kind_kr_assets()` reads `https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13`, parses the EUC-KR HTML table, and keeps KOSPI/KOSDAQ rows.
- Verified examples: Hanwha Ocean -> `042660`; Bukuk Steel -> `026940`.
- Latest backend tests after this change: `26 passed`.
- Latest frontend build after this change: `npm run build` succeeded.

## Korean Price Freshness

- Korean stock prices are not true real-time ticks right now.
- Current Korean market data route is `/kr-stocks/{ticker}` in `backend/app/routers/kr_stocks.py`.
- Current Korean OHLCV source is `pykrx.stock.get_market_ohlcv(start, end, ticker)` in `backend/app/sources/pykrx_source.py`.
- The frontend fetches market data once when category/symbol changes in `src/hooks/useIndicatorsData.ts`; there is no polling for Korean stocks.
- Backend uses cache TTL from `settings.cache_ttl_seconds`, currently default 300 seconds.
- True streaming/near-real-time behavior currently exists only for crypto through Binance WebSocket in `src/hooks/useBinanceWebSocket.ts`.

## Kiwoom REST API Decision

- Kiwoom REST API can be used for Korean stock quote/current price and real-time market data.
- Kiwoom should be treated as an optional advanced provider, not a mandatory dependency for the main judge demo.
- Recommended provider split:
- Korean real-time/current quote: optional Kiwoom REST/WebSocket provider.
- Korean historical OHLCV/search fallback: KRX KIND + pykrx.
- Korean fundamentals/financial statements: DART, not Kiwoom as the primary financial statement source.
- US stocks/ETFs/global indices: Yahoo Finance style lookup/data.
- Crypto: Binance.

## Human Steps For Kiwoom

AI cannot fully automate these steps:

- User must have or create a Kiwoom account.
- User must apply for Kiwoom REST API access.
- User must issue App Key/App Secret.
- User must register the backend outbound IP in the Kiwoom API portal.
- User must put secrets into backend environment variables, not into frontend code or chat messages.
- If deploying to a platform without fixed outbound IP, Kiwoom calls may fail; a fixed-IP backend may be needed.

## Skills.md Strategy For Kiwoom

This is a good fit for the hackathon if framed correctly:

- A Kiwoom skill document should guide AI on what to implement and guide the user on required manual setup.
- The skill should explicitly separate `AI can implement` from `User must configure`.
- The skill should tell AI not to ask the user to paste secrets in chat.
- The skill should define env vars such as `KIWOOM_APP_KEY`, `KIWOOM_APP_SECRET`, `KIWOOM_ACCOUNT_NO`, `KIWOOM_API_BASE_URL`, and optional mode flags.
- The skill should define fallback behavior: if Kiwoom credentials are missing or API fails, keep the app working with KRX KIND/pykrx cached or delayed data.
- This turns human setup into a documented operational workflow rather than a weakness.

## Risk/Positioning

- Do not claim Korean stock prices are currently real-time unless Kiwoom or another real-time provider is actually integrated and verified.
- Do not make Kiwoom mandatory for judging unless deployment/IP/key issues are solved.
- It is acceptable and strategically strong to present Kiwoom as an optional provider that Skills.md can activate when credentials are present.
- The core judge demo should remain reliable with account-free data sources and fallback data.

## Recent Verification Notes

- `backend/app/sources/search_source.py` has been updated for full KOSPI/KOSDAQ search via KRX KIND.
- `backend/tests/test_search.py` includes tests for mixed assets, fallback behavior, and KRX KIND universe examples.
- Backend server was restarted after the search update.
- Frontend dev server previously ran on `http://127.0.0.1:5175/`; backend CORS now includes localhost/127.0.0.1 ports 5173, 5174, and 5175.

---

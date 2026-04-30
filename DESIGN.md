# Design System — Skills 기반 투자 대시보드

본 문서는 Skills.md 7개 모듈 중 `theme.md`의 직접적 기반이 됩니다.
Spotify Design System(다크 몰입형)을 참고하되, 금융 대시보드의 시맨틱 색상과
데이터 표시 요구사항을 반영하여 재구성했습니다.

---

## 1. Visual Theme & Atmosphere

본 대시보드는 **데이터 우선의 어두운 극장(Dark Theater)** 철학을 따릅니다.
Bloomberg Terminal, TradingView, investing.com 같은 전문 금융 도구가 다크 모드를
기본으로 채택하는 이유는 단 하나입니다 — **숫자와 차트가 빛나야 하기 때문**.

UI 자체는 짙은 그레이/블랙으로 후퇴하고(`#0a0a0a`, `#121212`, `#1a1a1a`),
색은 오직 **데이터의 의미**(상승/하락, 매수/매도 신호, 차트 시리즈)에서만 나타납니다.
Spotify가 앨범아트에 색을 양보했다면, 우리는 차트와 시그널에 색을 양보합니다.

타이포그래피는 두 축을 가집니다.
- **UI/본문**: Pretendard (한글) / Inter (영문) — 깔끔한 산세리프
- **숫자**: JetBrains Mono 또는 Inter의 tabular figures — 자릿수가 정렬되는 고정폭

`87.234`와 `123.567`이 한 줄에 나열되었을 때 소수점이 정확히 일치해야 금융 데이터는 읽힙니다. 이는 일반 디자인 시스템에는 없는 금융 전용 요건입니다.

기하 형태는 **둥근 모서리(8px–16px) + 풀 핍 탭(9999px)**의 조합. 차트 컨테이너는 6px,
일반 카드는 8px, 다이얼로그는 16px, 탭/뱃지는 핍 형태. 두꺼운 그림자
(`rgba(0,0,0,0.5) 0px 8px 24px`)로 다크 배경 위에서도 카드가 떠 있게 표현합니다.

라이트 모드는 같은 철학의 반전 — 흰 배경, 짙은 텍스트, 그림자 약화. 시맨틱 색상
(빨강/초록)은 모드와 무관하게 의미를 유지하되, 채도와 명도를 조정해 가독성을 확보합니다.

**Key Characteristics:**
- 다크 우선, 라이트 옵션 (`theme.md`에서 토글)
- 무채색 UI + 시맨틱 색상 (상승/하락/중립/경고/정보)
- 차트 시리즈 색상 팔레트 (다수 종목 비교용 8색)
- Pretendard/Inter 본문 + JetBrains Mono/tabular figures 숫자
- 핍 탭(9999px) + 카드(8px) + 다이얼로그(16px) 기하
- 무거운 그림자로 다크 배경 위 깊이감 표현

---

## 2. Color Palette & Roles

### 2-1. 다크 모드 (기본)

#### 배경 / 표면
- **Page Background** (`#0a0a0a`): 가장 깊은 배경
- **Surface 1** (`#121212`): 메인 콘텐츠 영역
- **Surface 2** (`#1a1a1a`): 카드, 패널
- **Surface 3** (`#222222`): 입력창, 탭 비활성, 호버
- **Surface 4** (`#2a2a2a`): 활성 탭, 강조 카드

#### 텍스트
- **Text Primary** (`#fafafa`): 본문, 종목명, 핵심 숫자
- **Text Secondary** (`#a3a3a3`): 보조 텍스트, 라벨
- **Text Tertiary** (`#737373`): 캡션, 메타데이터, 비활성 라벨
- **Text Disabled** (`#525252`): 비활성 항목

#### 시맨틱 (금융 의미 색상)
- **Positive** (`#22c55e`): 상승, 매수 신호, 수익
- **Positive Bright** (`#4ade80`): 강한 상승, Strong Buy
- **Negative** (`#ef4444`): 하락, 매도 신호, 손실
- **Negative Bright** (`#f87171`): 강한 하락, Strong Sell
- **Neutral** (`#a3a3a3`): 중립, Hold
- **Warning** (`#f59e0b`): 경고, 과매수/과매도 경계
- **Info** (`#3b82f6`): 정보, 안내

#### 브랜드 / 액센트
- **Brand Primary** (`#06b6d4`): 시안 — 우리 브랜드 액센트, 활성 탭, 포커스
- **Brand Secondary** (`#0891b2`): 호버, 진한 액센트

> **왜 시안?** 빨강(매도)/초록(매수)이 시맨틱으로 예약되어 있어 브랜드 색은
> 충돌하지 않는 시안/블루 계열을 채택. 신뢰감 + 디지털 + 투자 도구 분위기.

#### 차트 시리즈 (다종목 비교용)
- **Chart 1**: `#06b6d4` (시안)
- **Chart 2**: `#a855f7` (퍼플)
- **Chart 3**: `#f59e0b` (앰버)
- **Chart 4**: `#ec4899` (핑크)
- **Chart 5**: `#10b981` (에메랄드)
- **Chart 6**: `#8b5cf6` (바이올렛)
- **Chart 7**: `#f97316` (오렌지)
- **Chart 8**: `#14b8a6` (틸)

> **차트 시리즈에 빨강/초록 미사용**. 빨강/초록은 상승/하락 시맨틱 색상으로 예약.
> 다종목 비교 시 빨강 라인을 보면 "이 종목이 손실"로 오인할 수 있음.

#### 캔들차트 색상
- **Candle Up** (`#22c55e`): 양봉, 시가 < 종가
- **Candle Down** (`#ef4444`): 음봉, 시가 > 종가
- **Candle Wick Up** (`#16a34a`): 양봉 꼬리
- **Candle Wick Down** (`#dc2626`): 음봉 꼬리

#### 그라데이션 (영역 차트용)
- **Area Positive Top** (`rgba(34, 197, 94, 0.4)`)
- **Area Positive Bottom** (`rgba(34, 197, 94, 0.0)`)
- **Area Negative Top** (`rgba(239, 68, 68, 0.4)`)
- **Area Negative Bottom** (`rgba(239, 68, 68, 0.0)`)

#### 보더 / 구분선
- **Border Default** (`#262626`): 기본 카드 보더
- **Border Subtle** (`#1f1f1f`): 미세한 구분선
- **Border Strong** (`#404040`): 강조 보더, 활성 입력창
- **Divider** (`#262626`): 섹션 구분

#### 그림자
- **Heavy** (`rgba(0,0,0,0.6) 0px 8px 24px`): 다이얼로그, 메뉴
- **Medium** (`rgba(0,0,0,0.4) 0px 4px 12px`): 카드 호버
- **Subtle** (`rgba(0,0,0,0.3) 0px 2px 4px`): 기본 카드
- **Inset** (`inset 0 0 0 1px #404040`): 입력창 보더 인셋

---

### 2-2. 라이트 모드

#### 배경 / 표면
- **Page Background** (`#fafafa`)
- **Surface 1** (`#ffffff`): 메인 콘텐츠
- **Surface 2** (`#f5f5f5`): 카드
- **Surface 3** (`#e5e5e5`): 입력창, 탭 비활성
- **Surface 4** (`#d4d4d4`): 활성 탭

#### 텍스트
- **Text Primary** (`#0a0a0a`)
- **Text Secondary** (`#525252`)
- **Text Tertiary** (`#737373`)
- **Text Disabled** (`#a3a3a3`)

#### 시맨틱
- **Positive** (`#16a34a`): 라이트 모드에서 채도 약간 낮춤 (가독성)
- **Positive Bright** (`#15803d`): Strong Buy
- **Negative** (`#dc2626`)
- **Negative Bright** (`#b91c1c`): Strong Sell
- **Neutral** (`#737373`)
- **Warning** (`#d97706`)
- **Info** (`#2563eb`)

#### 브랜드
- **Brand Primary** (`#0891b2`): 라이트에서는 좀 더 진한 시안
- **Brand Secondary** (`#0e7490`)

#### 차트 시리즈 (라이트용 채도 조정)
- Chart 1: `#0891b2`
- Chart 2: `#9333ea`
- Chart 3: `#d97706`
- Chart 4: `#db2777`
- Chart 5: `#059669`
- Chart 6: `#7c3aed`
- Chart 7: `#ea580c`
- Chart 8: `#0d9488`

#### 캔들차트
- **Candle Up** (`#16a34a`)
- **Candle Down** (`#dc2626`)

#### 보더
- **Border Default** (`#e5e5e5`)
- **Border Subtle** (`#f0f0f0`)
- **Border Strong** (`#a3a3a3`)
- **Divider** (`#e5e5e5`)

#### 그림자
- **Heavy** (`rgba(0,0,0,0.15) 0px 8px 24px`)
- **Medium** (`rgba(0,0,0,0.08) 0px 4px 12px`)
- **Subtle** (`rgba(0,0,0,0.04) 0px 2px 4px`)

---

## 3. Typography Rules

### Font Families
- **UI / Body**: `Pretendard, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Numbers / Tabular**: `"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace`
  - 또는 Inter의 `font-feature-settings: 'tnum' 1` (tabular figures) 사용

> **숫자 폰트가 핵심**. `1,234.56`과 `987.32`가 한 줄에 나열될 때
> 소수점이 정확히 일치해야 금융 데이터는 비교 가능.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Page Title | Pretendard | 24px (1.5rem) | 700 | 1.25 | -0.01em |
| Section Title | Pretendard | 20px (1.25rem) | 700 | 1.30 | -0.01em |
| Card Title | Pretendard | 16px (1rem) | 600 | 1.40 | normal |
| Body | Pretendard | 14px (0.875rem) | 400 | 1.50 | normal |
| Body Bold | Pretendard | 14px (0.875rem) | 600 | 1.50 | normal |
| Caption | Pretendard | 12px (0.75rem) | 400 | 1.40 | normal |
| Caption Bold | Pretendard | 12px (0.75rem) | 600 | 1.40 | normal |
| Label / Tag | Pretendard | 11px (0.6875rem) | 600 | 1.30 | 0.02em |
| Tab Label | Pretendard | 14px (0.875rem) | 600 | 1.0 | normal |
| Button | Pretendard | 14px (0.875rem) | 600 | 1.0 | normal |
| Number Large | JetBrains Mono | 32px (2rem) | 700 | 1.20 | -0.02em |
| Number Medium | JetBrains Mono | 20px (1.25rem) | 600 | 1.30 | -0.01em |
| Number Body | JetBrains Mono | 14px (0.875rem) | 400 | 1.50 | normal |
| Number Small | JetBrains Mono | 12px (0.75rem) | 400 | 1.40 | normal |

### Principles
- **숫자는 항상 tabular**: 가격, 등락률, 지표값 모두 고정폭 폰트
- **본문은 Pretendard**: 한글 가독성 최우선
- **버튼/탭은 600 weight**: 700은 너무 강함, 400은 약함
- **uppercase 미사용**: Spotify와 달리 영문/한글 혼용 환경에서는 부자연스러움
- **letter-spacing 최소화**: 숫자에 letter-spacing은 가독성 저해

---

## 4. Component Stylings

### 카테고리 탭 (대시보드 최상단)
- 배경: `Surface 2` (`#1a1a1a`)
- 활성 탭: `Brand Primary` (`#06b6d4`) 텍스트 + 하단 2px 보더
- 비활성 탭: `Text Secondary` 텍스트
- 패딩: 12px 20px
- 라디우스: 0 (탭 컨테이너 내부)
- 호버: 배경 `Surface 3` 전환

### 분석 탭 (요약/기술적/기본적)
- 핍 형태: 9999px
- 활성: `Surface 4` 배경 + `Text Primary` 텍스트
- 비활성: 투명 배경 + `Text Secondary`
- 비활성화(disabled): `Text Disabled` 색 + `cursor: not-allowed`
- 패딩: 8px 20px

### 카드 / 컨테이너
- 배경: `Surface 2`
- 라디우스: 8px
- 보더: `Border Default` 1px (또는 보더 없이 그림자만)
- 그림자: `Subtle`
- 호버 시: 그림자 `Medium`으로 강화

### 게이지 (반원형 미터)
- 배경 호: `Border Default`
- 채워진 호:
  - Strong Buy → `Positive Bright`
  - Buy → `Positive`
  - Neutral → `Neutral`
  - Sell → `Negative`
  - Strong Sell → `Negative Bright`
- 라벨: 게이지 하단 핍 형태 뱃지

### 시그널 뱃지 (Buy/Sell/Neutral)
- Strong Buy: `Positive Bright` 배경 + 흰색 텍스트
- Buy: `Positive` 배경 (다크 모드는 0.15 알파 + 텍스트는 진한 초록)
- Neutral: `Surface 3` 배경 + `Text Secondary`
- Sell: `Negative` 배경 (다크는 알파 처리)
- Strong Sell: `Negative Bright` 배경 + 흰색
- 라디우스: 4px
- 패딩: 4px 8px
- 폰트: 11px weight 600

### 가격 / 등락률 표시
- 상승: `Positive` 색 + 위쪽 화살표 (▲)
- 하락: `Negative` 색 + 아래쪽 화살표 (▼)
- 보합: `Neutral` 색
- 숫자는 tabular 폰트 필수

### 입력창 (검색, 종목 선택)
- 배경: `Surface 3`
- 텍스트: `Text Primary`
- 보더: `Inset` shadow
- 포커스: 보더 `Brand Primary` 1px 강조
- 라디우스: 8px (검색은 9999px 핍 옵션)
- 패딩: 10px 16px

### 버튼

**Primary**
- 배경: `Brand Primary` (`#06b6d4`)
- 텍스트: 다크 텍스트 (`#0a0a0a`)
- 라디우스: 8px (또는 9999px)
- 패딩: 10px 20px
- 호버: `Brand Secondary`

**Secondary (Outlined)**
- 배경: 투명
- 텍스트: `Text Primary`
- 보더: `Border Strong` 1px
- 호버: 배경 `Surface 3`

**Ghost**
- 배경: 투명
- 텍스트: `Text Secondary`
- 호버: 배경 `Surface 3`

### 테이블 (지표/이동평균)
- 배경: 투명 또는 `Surface 2`
- 헤더: `Text Tertiary` 색 + 11px weight 600 + uppercase 옵션
- 행 구분선: `Divider` 1px
- 호버 행: `Surface 3` 배경
- 숫자 셀: tabular 폰트, 우측 정렬
- Action 셀: 시그널 뱃지 사용

### 파라미터 입력 패널
- 배경: `Surface 2` 카드 안에
- 입력 그리드: label 좌측 + input 우측
- "적용" 버튼: Primary
- "초기화" 버튼: Ghost

---

## 5. Layout Principles

### Spacing System
- 베이스: 4px
- 스케일: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64

### Grid
- 카테고리 탭(상단 고정) + 분석 탭(2번째 줄) + 메인 콘텐츠
- 데스크톱: 12-column grid, gap 24px
- 태블릿: 6-column, gap 16px
- 모바일: 1-column, gap 12px

### Density
- **금융 대시보드는 정보 밀도 우선**
- 큰 여백보다 정보 그리드 구성에 집중
- 단, 시각적 휴식 영역 1~2곳 확보 (예: 종합 게이지 영역)

### Border Radius Scale
- **Pill** (9999px): 분석 탭, 시그널 뱃지
- **Card Large** (16px): 다이얼로그, 모달
- **Card** (8px): 일반 카드, 버튼, 입력창
- **Card Small** (6px): 차트 컨테이너, 작은 카드
- **Tag** (4px): 라벨, 메타 뱃지
- **Square** (0): 데이터 테이블 셀

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base (0) | `Page Background` | 페이지 배경 |
| Surface (1) | `Surface 1` background | 메인 영역 |
| Card (2) | `Surface 2` + `Subtle` shadow | 카드, 패널 |
| Hover (3) | `Surface 3` + `Medium` shadow | 호버 카드 |
| Elevated (4) | `Surface 2` + `Heavy` shadow | 드롭다운, 툴팁 |
| Modal (5) | `Surface 2` + `Heavy` shadow + backdrop blur | 다이얼로그 |

---

## 7. Do's and Don'ts

### Do
- 빨강(`Negative`)/초록(`Positive`)은 **상승/하락/매수/매도 시맨틱**으로만 사용
- 차트 다종목 비교 시 시안/퍼플/앰버 등 **무시맨틱 색상** 사용
- 숫자는 반드시 **tabular 폰트** (자릿수 정렬)
- 다크 모드 우선 설계, 라이트는 토큰만 매핑
- 시그널 뱃지는 강도에 따라 명도 차이 (Strong vs 일반)
- 분석 탭은 **SPA 전환** (페이지 리로드 금지)

### Don't
- 차트 시리즈 색상에 빨강/초록 사용 금지 (시맨틱 충돌)
- 브랜드 색을 매수/매도 시그널로 사용 금지
- 숫자에 letter-spacing 적용 금지
- 카드 보더와 그림자 동시 강조 금지 (택일)
- 작은 글자(<12px)에 weight 400 이하 사용 금지 (가독성)
- 라이트 모드에서 다크 모드 채도 그대로 사용 금지 (눈부심)

---

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | 1-column, 카테고리 탭 가로 스크롤 |
| Tablet | 640~1024px | 2-column, 사이드바 접힘 |
| Desktop | 1024~1440px | 표준 레이아웃 |
| Wide | >1440px | 카드 그리드 확장, 차트 영역 확대 |

### Collapsing
- 카테고리 탭: 6개 → 모바일에서 가로 스크롤 / 드롭다운
- 분석 탭(요약/기술적/기본적): 모든 화면 유지
- 게이지 3개: 데스크톱 횡 배치 → 모바일 종 배치
- 지표 테이블: 데스크톱 2열 → 모바일 1열

---

## 9. theme.md 모듈 매핑

본 DESIGN.md는 Skills.md의 `theme.md` 모듈에서 다음과 같이 토큰화되어 사용됩니다.

```
theme.md
├── 모드 토글 (dark / light)
├── 색상 토큰 (위 2-1, 2-2 전체)
├── 타이포 토큰 (폰트 패밀리, 사이즈, 웨이트)
├── 간격 토큰 (4px 베이스 스케일)
├── 라디우스 토큰 (Pill / Card / Tag / Square)
└── 그림자 토큰 (Subtle / Medium / Heavy / Inset)
```

`theme.md` 파일 하나만 교체하면:
- 다크 ↔ 라이트 즉시 전환
- 브랜드 색상 변경
- 차트 팔레트 변경
- 폰트 변경

→ **모든 시각적 변화가 `theme.md`로 격리**. 와우 모먼트 시연의 핵심.

---

## 10. Quick Reference (개발 시 참고)

### CSS Custom Properties 예시 (다크 모드)

```css
:root[data-theme="dark"] {
  --bg-page: #0a0a0a;
  --surface-1: #121212;
  --surface-2: #1a1a1a;
  --surface-3: #222222;
  --surface-4: #2a2a2a;

  --text-primary: #fafafa;
  --text-secondary: #a3a3a3;
  --text-tertiary: #737373;

  --positive: #22c55e;
  --positive-bright: #4ade80;
  --negative: #ef4444;
  --negative-bright: #f87171;
  --warning: #f59e0b;
  --info: #3b82f6;

  --brand-primary: #06b6d4;
  --brand-secondary: #0891b2;

  --border-default: #262626;
  --border-strong: #404040;

  --shadow-subtle: rgba(0,0,0,0.3) 0px 2px 4px;
  --shadow-medium: rgba(0,0,0,0.4) 0px 4px 12px;
  --shadow-heavy: rgba(0,0,0,0.6) 0px 8px 24px;
}

:root[data-theme="light"] {
  --bg-page: #fafafa;
  --surface-1: #ffffff;
  --surface-2: #f5f5f5;
  --surface-3: #e5e5e5;
  --surface-4: #d4d4d4;

  --text-primary: #0a0a0a;
  --text-secondary: #525252;
  --text-tertiary: #737373;

  --positive: #16a34a;
  --positive-bright: #15803d;
  --negative: #dc2626;
  --negative-bright: #b91c1c;

  --brand-primary: #0891b2;
  --brand-secondary: #0e7490;

  --border-default: #e5e5e5;
  --border-strong: #a3a3a3;

  --shadow-subtle: rgba(0,0,0,0.04) 0px 2px 4px;
  --shadow-medium: rgba(0,0,0,0.08) 0px 4px 12px;
  --shadow-heavy: rgba(0,0,0,0.15) 0px 8px 24px;
}
```

### 자주 쓰는 컴포넌트 프롬프트 예시

- **카드**: "background var(--surface-2), padding 20px, radius 8px, shadow var(--shadow-subtle), hover shadow var(--shadow-medium)"
- **시그널 뱃지 (Buy)**: "background rgba(34,197,94,0.15), text var(--positive), padding 4px 8px, radius 4px, font Pretendard 11px weight 600"
- **분석 탭 (활성)**: "background var(--surface-4), text var(--text-primary), padding 8px 20px, radius 9999px, font Pretendard 14px weight 600"
- **숫자 셀**: "font JetBrains Mono 14px, text-align right, color var(--text-primary)"
- **상승 가격**: "color var(--positive), prefix '▲', font tabular"

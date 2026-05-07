# dashboard-spec.md - Exact Dashboard Reproduction Spec

## 목적

AI가 현재 Glancy 대시보드와 같은 결과물을 만들도록 화면 구조, 섹션 순서, 카드 이름, 제거해야 할 요소를 고정한다. 이 문서는 `layout.md`보다 더 낮은 자유도를 가진 재현 명세다.

## App Shell

- 전체 배경은 dark financial workstation 스타일이다.
- 최대 콘텐츠 폭은 1440px다.
- 상단 header는 왼쪽 로고 `Glancy`, 중앙 검색창, 오른쪽 테마 토글과 새로고침 아이콘을 가진다.
- 최상위 탭은 `대시보드`, `자산검색`, `CSV 업로드` 순서다.
- 첫 진입 화면은 항상 `대시보드`다.

## Composite Portfolio Header

위에서 아래 순서:

1. 제목: `종합 포트폴리오 분석`
2. 부제: `삼성전자 · AAPL · MSFT · SPY · BTC · GLD`
3. 분석 기간: `분석 기간 2025-01-01 ~ 2025-03-31`
4. 우측 KPI: `128,450,000원`, `$92,400`
5. 우측 보조 KPI: `총 수익률 +11.8%`, `변동성 16.4%`, `최대 낙폭 -8.2%`

## Composite Portfolio Tabs

탭 순서는 반드시 다음과 같다.

1. `요약`
2. `성과/리스크`
3. `자산 배분`
4. `개별 자산 분석`

탭은 rounded pill segmented control로 렌더링한다.

## Component Contract

이 문서는 React 소스코드를 그대로 복사하지 않는다. 대신 아래 컴포넌트 계약을 기준으로 같은 구조를 구현한다. 다른 이름을 써도 되지만 화면 구조와 데이터 책임은 동일해야 한다.

### App Shell Components

- `AppShell`: 전체 배경, 최대 1440px 콘텐츠 폭, 상단 header, 최상위 nav를 담당한다.
- `TopHeader`: `Glancy` 로고, 중앙 검색창, 테마 토글, 새로고침 아이콘을 담당한다.
- `PrimaryNav`: `대시보드`, `자산검색`, `CSV 업로드` 탭을 담당한다.

### Composite Portfolio Components

- `CompositePortfolioDashboard`: 종합 포트폴리오 화면 전체를 담당한다.
- `CompositePortfolioHeader`: 제목, 자산 목록 subtitle, 분석 기간, 우측 총액/KPI를 담당한다.
- `CompositeTabs`: `요약`, `성과/리스크`, `자산 배분`, `개별 자산 분석` 탭 전환을 담당한다.
- `SummaryTab`: `SignalGauge`, `PortfolioDonut`, `MetricCard` 4개, `PerformanceSnapshot`, `CompactHoldingsList`를 이 순서로 렌더링한다.
- `PerformanceRiskTab`: `PerformanceLineChart`, `NormalizedAssetBars`, `DrawdownLineChart`, `MonthlyReturnHeatmap`을 2x2 grid로 렌더링한다.
- `AllocationTab`: `PortfolioDonut`과 `HoldingsTable`만 렌더링한다. 집중도/상위 3개 비중 컴포넌트는 렌더링하지 않는다.
- `IndividualAssetTab`: `TickerSelector`, `SelectedAssetCard`, 내부 `AssetSubTabs`를 렌더링한다.
- `SelectedAssetCard`: 선택 자산 이름, ticker/market/type/data basis, `비중`, `수익률`, `변동성` KPI만 렌더링한다. `OHLCV` KPI와 colored border accent는 렌더링하지 않는다.

### Asset Search Components

- `AssetSearchDashboard`: 시장 선택, `AssetHeader`, `AssetAnalysisTabs`를 담당한다.
- `AssetHeader`: API quote name이 ticker와 같으면 기존 로컬 자산명 또는 매핑된 종목명을 우선 사용한다.
- `AssetSummaryTab`: `SignalGauge`, 동적 `InsightText`, `TechnicalSummaryCard`, `FundamentalSummaryCard`를 렌더링한다.
- `TechnicalAnalysisTab`: timeframe control, 3개 gauge, candle chart, 기술 지표 table, 이동평균 table을 렌더링한다.
- `FundamentalAnalysisTab`: PER/PBR/ROE/배당수익률 등 기본 지표와 기본 분석 문구를 렌더링한다.

### Upload Components

- `UploadView`: `UploadModeToggle`, `SampleDashboardPanel`, `FileDropzone`, `SupportedTypesGrid`, `DetectedTypeCard`, `AutomaticDashboard`, `RawJsonDetails`를 담당한다.
- `AutomaticDashboard`: `composite_portfolio` 결과에는 `CompositePortfolioDashboard`를 쓰고, 그 외 지원 유형에는 `VisualizationDashboard`를 쓴다.
- `RawJsonDetails`: 원본 JSON은 자동 대시보드보다 먼저 보이지 않는다.

### Layout Contract

- `SummaryTab` desktop row 1은 좌측 종합 시그널 gauge, 우측 포트폴리오 비중 donut/legend의 2-column layout이다.
- `SummaryTab` KPI row는 4개 동일 폭 card이다.
- `PerformanceRiskTab` desktop은 2-column x 2-row layout이고, mobile은 1-column으로 접힌다.
- `AllocationTab`에는 portfolio donut 이후 바로 holdings table이 온다.
- `IndividualAssetTab`의 선택 자산 카드 우측 KPI는 3개 card만 같은 스타일로 배치한다.

## Summary Tab

섹션 순서:

1. `종합 시그널` gauge
   - 값: 72
   - 라벨: `균형`
2. `포트폴리오 비중`
   - donut chart
   - legend는 donut 색상과 항상 일치
3. 4개 KPI 카드
   - `총 수익률 +11.8%`
   - `연율 변동성 16.4%`
   - `최대 낙폭 -8.2%`
   - `Sharpe 비율 1.18`
4. `포트폴리오 누적 성과`
   - 시작값 100.0
   - 현재값 111.8
   - 변화율 +11.8%
   - sparkline 안에 100.0, 111.8, 01-01, 02-15, 03-31 표시
5. `보유 자산 요약`
   - compact cards
   - 각 카드에는 ticker, name, weight, return, volatility 표시

요약 탭에는 `집중도` 카드를 넣지 않는다.

## Performance/Risk Tab

2열 grid를 기본으로 하고 모바일에서는 1열이다.

1. `포트폴리오 누적 성과`
   - sparkline
   - 시작/현재 숫자와 날짜 앵커 표시
2. `자산별 정규화 가격 비교`
   - 100 기준 정규화 라인/바 비교
   - 마지막 값: 005930 109.2, AAPL 113.4, MSFT 112.6, SPY 108.1, BTC 124.8, GLD 106.4
3. `최대 낙폭 흐름`
   - red/negative line
   - 시작 -1.0%, 최저 -8.2%, 종료 -0.8%
   - 날짜 앵커 01-01, 02-15, 03-31 표시
4. `월별 수익률`
   - 2025년 월별 heatmap
   - 01 +3.2%, 02 +4.1%, 03 +3.9%
   - 데이터 없는 월은 `-`

## Asset Allocation Tab

섹션 순서:

1. `포트폴리오 비중` donut + legend
2. `보유 자산 요약` table

Table columns:

- 자산
- 유형
- 비중
- 수익률
- 기여도
- 변동성

## Individual Asset Analysis Tab

상단:

- ticker selector buttons: `005930`, `AAPL`, `MSFT`, `SPY`, `BTC`, `GLD`
- 기본 선택은 `005930`
- 선택 자산 카드에는 `선택 자산`, 이름, ticker/market/type/data basis, 그리고 `비중`, `수익률`, `변동성` 3개 카드만 표시
- `OHLCV` 또는 `OHLCV count` 카드는 표시하지 않는다.
- 카드 왼쪽 colored border accent를 쓰지 않는다.

내부 탭 순서:

1. `요약`
2. `기술적 분석`
3. `기본적 분석`

기술적 분석:

- timeframe은 포트폴리오에서는 `1D`, `1W`, `1M`만 제공한다.
- 자산검색의 기술 지표 표와 같은 지표 세트를 사용한다.
- API나 업로드에 OHLCV가 없으면 샘플로 속이지 말고 empty message를 표시한다.

## Asset Search Dashboard

상단:

- 시장 선택 dropdown
- 자산명, ticker, market
- 현재가, 등락률, 거래량, 시가총액, 52주 고가/저가
- 데이터 상태 badge

요약 탭:

- `종합 시그널`
- `종합 인사이트`
- `기술적 분석 요약`
- `기본적 분석 요약`
- 문구와 점수는 지표와 quote 상태에서 생성한다.

기술적 분석 탭:

- timeframe: `1H`, `1D`, `1W`, `1M`
- gauge: `기술 지표 점수`, `종합 시그널`, `이동평균 점수`
- 캔들 차트
- 기술 지표 표
- 이동평균 표

## Forbidden UI

- `Skills Runtime Demo` 패널
- `charts.md driven`
- `Markdown -> parser -> dashboard state`
- 개발자용 규칙 출처 배지
- generic footer
- 집중도 카드
- OHLCV count KPI
- 상위 3개 비중 단색 bar
- 샘플/fallback 값을 실시간 분석처럼 보이게 하는 문구

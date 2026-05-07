# layout.md - Dashboard Composition Layer

## 목적

분석 결과를 현재 Glancy와 같은 정보 구조로 배치한다. 화면은 마케팅 페이지가 아니라 전문 투자 대시보드여야 한다.

## 공통 구조

```text
Header: 로고, 통합 검색, 테마 토글, 새로고침
Top Navigation: 대시보드, 자산검색, CSV 업로드
Main Content: 선택된 흐름에 맞는 대시보드
```

## 첫 화면: 종합 포트폴리오

상단:

- 제목 `종합 포트폴리오 분석`
- 자산 목록
- 분석 기간
- 총 평가금액, 기준 통화 환산값
- 총 수익률, 변동성, 최대 낙폭

탭:

- `요약`
- `성과/리스크`
- `자산 배분`
- `개별 자산 분석`

## 요약 탭

포함:

- 종합 시그널 gauge
- 포트폴리오 비중 donut과 동일 색상 legend
- 총 수익률, 연율 변동성, 최대 낙폭, Sharpe 비율 카드
- 포트폴리오 누적 성과 sparkline
- 보유 자산 요약

삭제:

- 집중도 카드는 삭제한다.
- OHLCV 개수 또는 OHLCV count는 주요 KPI로 표시하지 않는다.
- 내부 설명, 샘플 경고 칩, footer성 설명 문구는 표시하지 않는다.

## 성과/리스크 탭

- 포트폴리오 누적 성과 그래프에는 날짜와 숫자를 함께 표시한다.
- 최대 낙폭 흐름 그래프에는 퍼센트 값과 날짜를 함께 표시한다.
- 월별 수익률은 월 레이블과 수익률 값을 표시한다.
- 자산별 정규화 가격 비교는 자산 색상과 legend를 일치시킨다.

## 자산검색

요약 탭:

- 종합 시그널과 종합 인사이트는 지표 상태에서 생성한다.
- 기술적 분석 요약 점수와 기본적 분석 요약 점수에는 근거 지표를 함께 둔다.
- 데이터 수신 실패 시 샘플 기준 또는 지표 데이터 부족을 표시한다.

기술적 분석 탭:

- timeframe은 `1H`, `1D`, `1W`, `1M`이다.
- 세 gauge는 기술 지표 점수, 종합 시그널, 이동평균 점수다.
- 캔들 차트, 기술 지표 표, 이동평균 표를 보여준다.
- Skills Runtime Demo 패널은 렌더링하지 않는다.

기본적 분석 탭:

- 지원 자산은 valuation, profitability, growth, financial health, shareholder return을 보여준다.
- 미지원 자산은 disabled tab 또는 empty state로 처리한다.

## CSV 업로드

- 상단 탭과 업로드 영역 사이에 충분한 여백을 둔다.
- 업로드 성공 시 raw JSON보다 감지 유형, 요약, 자동 대시보드를 먼저 보여준다.
- 지원 데이터 유형 안내는 실제 구현과 맞아야 한다.

## Upload Dashboard Contract

CSV 업로드 화면은 다음 컴포넌트 책임을 가진다.

- `UploadView`: CSV 업로드 전체 흐름을 담당한다.
- `UploadModeToggle`: `샘플 대시보드`, `파일 업로드` 전환 버튼을 담당한다.
- `SampleDashboardPanel`: 제공 샘플 목록을 카드 grid로 보여주고 선택한 샘플을 backend sample 분석 경로로 실행한다.
- `FileDropzone`: CSV/JSON drag and drop, 파일 선택 버튼, 선택 파일명을 보여준다.
- `SupportedTypesGrid`: `OHLCV`, `portfolio`, `multi_asset`, `returns`, `price_series`, `composite_portfolio` 여섯 유형을 실제 감지 규칙과 같은 이름으로 보여준다.
- `DetectedTypeCard`: 업로드 성공 후 감지된 데이터 유형을 먼저 보여준다.
- `AutomaticDashboard`: 감지 결과가 `composite_portfolio`이면 `CompositePortfolioDashboard`, 그 외 지원 유형이면 `VisualizationDashboard`를 렌더링한다.
- `RawJsonDetails`: 원본 JSON은 자동 대시보드 아래의 접힌 details 영역에만 둔다.

업로드 결과 화면은 내부 규칙 출처, runtime demo, `charts.md driven` 배지를 보여주지 않는다. `portfolio` 단일 업로드는 자산 배분 donut과 보유 자산 중심으로 보여주며 집중도 전용 차트는 만들지 않는다.

## 반응형

- 모바일은 단일 컬럼이다.
- 데스크톱은 dense grid를 사용한다.
- 카드 안에 카드를 중첩하지 않는다.
- 텍스트가 버튼이나 카드 밖으로 넘치지 않게 한다.

# acceptance.md - Reproduction Checklist

## 목적

AI가 `skills/`를 읽고 만든 결과물이 현재 Glancy와 같은지 검수한다. 하나라도 실패하면 “똑같이 구현” 목표를 만족하지 못한다.

## Must Pass

- 첫 화면이 종합 포트폴리오 대시보드다.
- 최상위 탭은 `대시보드`, `자산검색`, `CSV 업로드`다.
- 종합 포트폴리오 탭은 `요약`, `성과/리스크`, `자산 배분`, `개별 자산 분석` 순서다.
- header 값은 `128,450,000원`, `$92,400`, `+11.8%`, `16.4%`, `-8.2%`다.
- 샘플 자산은 `005930`, `AAPL`, `MSFT`, `SPY`, `BTC`, `GLD` 여섯 개다.
- 포트폴리오 비중은 25.0%, 20.0%, 18.0%, 22.0%, 7.0%, 8.0%다.
- 성과/리스크 그래프에는 날짜 앵커가 표시된다.
- `포트폴리오 누적 성과`는 100.0과 111.8을 표시한다.
- `최대 낙폭 흐름`은 -1.0%, -8.2%, -0.8%를 표시한다.
- `월별 수익률`은 01, 02, 03의 값과 나머지 월의 `-`를 표시한다.
- 개별 자산 metric은 `비중`, `수익률`, `변동성`만 표시한다.
- 기술 지표 표는 자산검색과 개별 자산 분석에서 같은 지표 세트를 사용한다.
- 데이터 실패 시 `데이터 수신 실패`, `샘플 기준`, `지표 데이터 부족` 중 해당 상태를 명시한다.

## Must Not Render

- `집중도`
- `상위 3개 비중` 전용 카드
- `OHLCV 244개` 같은 OHLCV count KPI
- `Skills Runtime Demo`
- `charts.md driven`
- `Markdown -> parser -> dashboard state`
- footer의 generic 서비스 설명
- 개발자용 rule/source badge

## Visual Acceptance

- 카드 radius는 8px 이하가 기본이다.
- 배경은 어두운 전문 투자 대시보드 톤이다.
- 카드 안에 카드가 중첩된 것처럼 보이지 않아야 한다.
- donut 색상과 legend 색상은 일치한다.
- financial direction 색상은 positive/negative 의미로만 쓴다.
- 텍스트는 모바일과 데스크톱 모두 카드 밖으로 넘치지 않는다.

## Data Acceptance

- `sample-data.md`의 숫자와 화면 숫자가 일치한다.
- 업로드가 `composite_portfolio`로 감지되면 종합 포트폴리오 화면을 재사용한다.
- `OHLCV`, `portfolio`, `multi_asset`, `returns`, `price_series` 업로드는 각 유형에 맞는 자동 대시보드를 렌더링한다.
- `portfolio` 단일 업로드는 비중 donut과 보유 자산 table 중심이며 집중도 전용 chart card를 렌더링하지 않는다.
- fallback 데이터는 분석을 유지할 수 있지만 실시간 또는 최신 데이터처럼 표현하지 않는다.

## Implementation Acceptance

- 하드코딩 인사이트 문구를 자산별로 직접 박아 넣지 않는다.
- 지표 점수는 indicator signal 또는 데이터 상태에서 계산한다.
- `72`, `85`, `78` 같은 설명 없는 fallback gauge 값은 쓰지 않는다.
- `composite_portfolio`의 `signal_score`와 insight는 총 수익률, 변동성, 최대 낙폭, Sharpe, 자산별 기여도에서 계산 또는 생성한다.
- 한국 주식 quote name이 ticker와 같으면 기존 종목명을 유지한다.

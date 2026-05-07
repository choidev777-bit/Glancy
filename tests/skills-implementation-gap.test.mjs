import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const skills = {
  readme: read('skills/README.md'),
  main: read('skills/main.md'),
  dashboardSpec: read('skills/dashboard-spec.md'),
  sampleData: read('skills/sample-data.md'),
  acceptance: read('skills/acceptance.md'),
  data: read('skills/data.md'),
  indicators: read('skills/indicators.md'),
  insights: read('skills/insights.md'),
  charts: read('skills/charts.md'),
  layout: read('skills/layout.md'),
  theme: read('skills/theme.md'),
};

const allSkills = Object.values(skills).join('\n');
const mojibakeTokens = ['??', '?쒓', '?먯', '怨⑤', '醫낇', '遺꾩', '留ㅼ', '留ㅻ', '蹂', '媛', '?곗'];

for (const [name, text] of Object.entries(skills)) {
  for (const token of mojibakeTokens) {
    assert.ok(!text.includes(token), `${name} should not contain mojibake token ${token}`);
  }
}

assert.match(skills.readme, /AI에게 이 폴더를 주면 현재 Glancy 대시보드를 재현/);
assert.match(skills.readme, /dashboard-spec\.md/);
assert.match(skills.readme, /sample-data\.md/);
assert.match(skills.readme, /acceptance\.md/);

assert.match(skills.main, /첫 화면은 종합 포트폴리오 대시보드/);
assert.match(skills.main, /재현 모드/);
assert.match(skills.data, /composite_portfolio/);
assert.match(skills.data, /Ticker.*Weight.*Quantity/s);

assert.match(skills.indicators, /MA5.*MA10.*MA20.*MA50.*MA100.*MA200/s);
assert.match(
  skills.indicators,
  /RSI\(14\).*STOCH\(9,6\).*STOCHRSI\(14\).*MACD\(12,26\).*ADX\(14\).*Ultimate Oscillator.*Bull\/Bear Power/s,
);
assert.match(skills.insights, /하드코딩.*금지/s);
assert.match(skills.insights, /데이터 수신 실패|샘플 기준|지표 데이터 부족/);
assert.match(skills.charts, /developer-facing|charts\.md driven|내부 설명.*렌더링하지 않는다/s);
assert.match(skills.charts, /correlation/);
assert.match(skills.charts, /metrics/);
assert.match(skills.charts, /table/);
assert.match(skills.charts, /portfolio.*donut.*table/s);
assert.match(skills.charts, /집중 위험.*인사이트 문장/s);
assert.match(skills.layout, /집중도.*삭제/s);
assert.match(skills.layout, /OHLCV count|OHLCV 개수/);
assert.match(skills.layout, /Upload Dashboard Contract/);
assert.match(skills.layout, /UploadModeToggle/);
assert.match(skills.layout, /FileDropzone/);
assert.match(skills.layout, /SupportedTypesGrid/);
assert.match(skills.layout, /DetectedTypeCard/);
assert.match(skills.layout, /AutomaticDashboard[\s\S]*CompositePortfolioDashboard[\s\S]*VisualizationDashboard/);
assert.match(skills.layout, /RawJsonDetails/);
assert.match(skills.theme, /financial workstation|전문 투자 대시보드/);

assert.match(skills.dashboardSpec, /Composite Portfolio Header/);
assert.match(skills.dashboardSpec, /128,450,000원/);
assert.match(skills.dashboardSpec, /요약.*성과\/리스크.*자산 배분.*개별 자산 분석/s);
assert.match(skills.dashboardSpec, /Skills Runtime Demo/);
assert.match(skills.dashboardSpec, /Must Not|Forbidden UI|금지/s);
assert.match(skills.dashboardSpec, /Component Contract/);
assert.match(skills.dashboardSpec, /SummaryTab[\s\S]*SignalGauge[\s\S]*PortfolioDonut[\s\S]*MetricCard/);
assert.match(skills.dashboardSpec, /PerformanceRiskTab[\s\S]*PerformanceLineChart[\s\S]*NormalizedAssetBars[\s\S]*DrawdownLineChart[\s\S]*MonthlyReturnHeatmap/);
assert.match(skills.dashboardSpec, /AllocationTab[\s\S]*PortfolioDonut[\s\S]*HoldingsTable/);
assert.match(skills.dashboardSpec, /IndividualAssetTab[\s\S]*TickerSelector[\s\S]*SelectedAssetCard[\s\S]*AssetSubTabs/);
assert.match(skills.dashboardSpec, /AssetHeader[\s\S]*quote name[\s\S]*ticker/);
assert.match(skills.dashboardSpec, /Upload Components/);
assert.match(skills.dashboardSpec, /AutomaticDashboard[\s\S]*CompositePortfolioDashboard[\s\S]*VisualizationDashboard/);
assert.match(skills.dashboardSpec, /RawJsonDetails/);

assert.match(skills.sampleData, /005930.*삼성전자.*25\.0%.*\+9\.2%/s);
assert.match(skills.sampleData, /AAPL.*20\.0%.*\+13\.4%/s);
assert.match(skills.sampleData, /100\.0, 101\.8, 103\.5/);
assert.match(skills.sampleData, /-1\.0%, -2\.5%, -1\.8%, -4\.1%, -8\.2%/);
assert.match(skills.sampleData, /2025-01.*\+3\.2%/s);

assert.match(skills.acceptance, /Must Pass/);
assert.match(skills.acceptance, /Must Not Render/);
assert.match(skills.acceptance, /72.*85.*78|72`, `85`, `78`|72.*fallback/s);
assert.match(skills.acceptance, /portfolio.*donut.*table/s);
assert.match(skills.acceptance, /signal_score.*총 수익률.*변동성.*최대 낙폭.*Sharpe/s);
assert.match(skills.acceptance, /한국 주식 quote name이 ticker와 같으면 기존 종목명을 유지/);

assert.match(allSkills, /포트폴리오 누적 성과/);
assert.match(allSkills, /최대 낙폭 흐름/);
assert.match(allSkills, /월별 수익률/);

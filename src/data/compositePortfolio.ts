export type CompositeAssetKind = 'stock' | 'etf' | 'crypto';

export interface CompositeHolding {
  ticker: string;
  name: string;
  market: string;
  kind: CompositeAssetKind;
  weight: number;
  returnRate: number;
  contribution: number;
  volatility: number;
  technicalScore: number;
  foundationScore: number;
  technicalSignal: string;
  foundationSignal: string;
  fundamentals: Array<{ label: string; value: string }>;
}

export const compositeSummary = {
  title: '종합 포트폴리오 분석',
  subtitle: '삼성전자 · AAPL · MSFT · SPY · BTC · GLD',
  period: '2025-01-01 ~ 2025-03-31',
  status: '심사용 종합 샘플 데이터',
  krwValue: '128,450,000원',
  usdValue: '$92,400',
  totalReturn: 0.118,
  volatility: 0.164,
  maxDrawdown: -0.082,
  sharpe: 1.18,
  signalScore: 72,
  signalLabel: '균형',
};

export const compositeHoldings: CompositeHolding[] = [
  {
    ticker: '005930',
    name: '삼성전자',
    market: '한국 주식',
    kind: 'stock',
    weight: 0.25,
    returnRate: 0.092,
    contribution: 0.023,
    volatility: 0.185,
    technicalScore: 68,
    foundationScore: 74,
    technicalSignal: '중립 이상',
    foundationSignal: '견조',
    fundamentals: [
      { label: 'PER', value: '14.2x' },
      { label: 'PBR', value: '1.32x' },
      { label: 'ROE', value: '12.5%' },
      { label: '배당수익률', value: '2.1%' },
    ],
  },
  {
    ticker: 'AAPL',
    name: 'Apple',
    market: '미국 주식',
    kind: 'stock',
    weight: 0.2,
    returnRate: 0.134,
    contribution: 0.027,
    volatility: 0.201,
    technicalScore: 75,
    foundationScore: 79,
    technicalSignal: '상승 추세',
    foundationSignal: '우수',
    fundamentals: [
      { label: 'PER', value: '28.4x' },
      { label: 'PBR', value: '39.1x' },
      { label: 'ROE', value: '152%' },
      { label: 'EPS 성장률', value: '+7.8%' },
    ],
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft',
    market: '미국 주식',
    kind: 'stock',
    weight: 0.18,
    returnRate: 0.126,
    contribution: 0.023,
    volatility: 0.176,
    technicalScore: 78,
    foundationScore: 83,
    technicalSignal: '상승 추세',
    foundationSignal: '우수',
    fundamentals: [
      { label: 'PER', value: '32.0x' },
      { label: '영업이익률', value: '44.6%' },
      { label: 'ROE', value: '37.1%' },
      { label: '매출 성장률', value: '+13.5%' },
    ],
  },
  {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF',
    market: 'ETF',
    kind: 'etf',
    weight: 0.22,
    returnRate: 0.081,
    contribution: 0.018,
    volatility: 0.132,
    technicalScore: 66,
    foundationScore: 71,
    technicalSignal: '완만한 상승',
    foundationSignal: '시장 대표',
    fundamentals: [
      { label: '운용보수', value: '0.09%' },
      { label: 'AUM', value: '$500B+' },
      { label: '추적 대상', value: 'S&P 500' },
      { label: '배당수익률', value: '1.3%' },
    ],
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    market: '암호화폐',
    kind: 'crypto',
    weight: 0.07,
    returnRate: 0.248,
    contribution: 0.017,
    volatility: 0.512,
    technicalScore: 64,
    foundationScore: 58,
    technicalSignal: '고변동 상승',
    foundationSignal: '위험 높음',
    fundamentals: [
      { label: '시가총액', value: '$1.3T' },
      { label: '거래대금', value: '$38B' },
      { label: '공급량', value: '21M 한도' },
      { label: '변동성', value: '높음' },
    ],
  },
  {
    ticker: 'GLD',
    name: 'SPDR Gold Shares',
    market: 'ETF',
    kind: 'etf',
    weight: 0.08,
    returnRate: 0.064,
    contribution: 0.005,
    volatility: 0.118,
    technicalScore: 61,
    foundationScore: 69,
    technicalSignal: '방어적 상승',
    foundationSignal: '대체자산',
    fundamentals: [
      { label: '운용보수', value: '0.40%' },
      { label: 'AUM', value: '$60B+' },
      { label: '추적 대상', value: '금 현물' },
      { label: '자산 성격', value: '방어/헤지' },
    ],
  },
];

export const normalizedSeries = [
  { date: '01-01', '005930': 100, AAPL: 100, MSFT: 100, SPY: 100, BTC: 100, GLD: 100 },
  { date: '01-15', '005930': 104, AAPL: 105, MSFT: 106, SPY: 102, BTC: 112, GLD: 101 },
  { date: '02-01', '005930': 108, AAPL: 111, MSFT: 110, SPY: 105, BTC: 125, GLD: 103 },
  { date: '02-15', '005930': 103, AAPL: 109, MSFT: 114, SPY: 107, BTC: 118, GLD: 106 },
  { date: '03-01', '005930': 111, AAPL: 116, MSFT: 118, SPY: 110, BTC: 133, GLD: 108 },
  { date: '03-31', '005930': 109.2, AAPL: 113.4, MSFT: 112.6, SPY: 108.1, BTC: 124.8, GLD: 106.4 },
];

export const cumulativePortfolioSeries = [100, 101.8, 103.5, 105.9, 104.7, 108.4, 110.2, 109.6, 113.1, 111.8];

export const drawdownSeries = [-0.01, -0.025, -0.018, -0.041, -0.082, -0.052, -0.036, -0.021, -0.015, -0.008];

export const monthlyReturns = [
  { period: '2025-01', return: 0.032 },
  { period: '2025-02', return: 0.041 },
  { period: '2025-03', return: 0.039 },
];

export const evidenceRows = [
  { section: 'portfolio_weight', rows: 6, description: '자산별 보유 비중' },
  { section: 'ohlcv', rows: 384, description: '6개 자산의 일별 시가/고가/저가/종가/거래량' },
  { section: 'return', rows: 384, description: '자산별 일별 수익률과 포트폴리오 누적 수익률' },
  { section: 'fundamental', rows: 24, description: '주식/ETF/암호자산 유형별 기초 지표' },
  { section: 'metadata', rows: 8, description: '기간, 통화, 환산 기준, 데이터 출처' },
];

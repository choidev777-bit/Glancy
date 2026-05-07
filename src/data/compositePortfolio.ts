import type { Candle, IndicatorsResponse } from '../lib/api';
import type { FundamentalViewData } from '../components/analysis/FundamentalView';
import type { SummaryViewData } from '../components/analysis/SummaryView';
import ohlcvSnapshot from './compositePortfolioOhlcvSnapshot.json';

export type CompositeAssetKind = 'stock' | 'etf' | 'crypto';

export interface CompositeAssetHeader {
  dataBasis: string;
}

export interface CompositeTechnicalData {
  candles: Candle[];
  indicators: IndicatorsResponse;
  hasOhlcv: boolean;
}

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
  assetHeader?: CompositeAssetHeader;
  summary?: SummaryViewData;
  technical?: CompositeTechnicalData;
  fundamental?: FundamentalViewData;
}

const compositeOhlcvSnapshot = ohlcvSnapshot as Record<string, Candle[]>;

export function getCompositeOhlcvSnapshot(ticker: string): Candle[] {
  return (compositeOhlcvSnapshot[ticker] ?? [])
    .map((candle) => ({
      time: Number(candle.time),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume),
    }))
    .filter((candle) => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
    .sort((a, b) => a.time - b.time);
}

export const compositeSummary = {
  title: '종합 포트폴리오 분석',
  subtitle: '삼성전자 · AAPL · MSFT · SPY · BTC · GLD',
  period: '2025-01-01 ~ 2025-03-31',
  status: '',
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

const fundamentalHistoryValues: Record<string, Record<string, number[]>> = {
  '005930': {
    PER: [18.2, 16.7, 15.4, 14.6, 13.9],
    PBR: [1.55, 1.46, 1.38, 1.32, 1.28],
    ROE: [10.2, 10.9, 11.7, 12.3, 12.8],
    '매출 성장률': [2.8, 3.6, 4.2, 5.1, 5.8],
    '영업이익률': [11.5, 12.3, 13.1, 14.2, 14.9],
    '부채비율': [42.0, 39.8, 37.1, 35.6, 34.7],
    '배당수익률': [1.7, 1.8, 2.0, 2.2, 2.3],
  },
  AAPL: {
    PER: [32.5, 30.8, 29.7, 29.0, 28.4],
    PBR: [35.2, 36.4, 37.8, 38.5, 39.1],
    ROE: [124, 133, 141, 148, 152],
    '매출 성장률': [3.1, 4.2, 5.3, 5.9, 6.4],
    '영업이익률': [29.4, 30.1, 30.6, 31.0, 31.5],
    '부채비율': [168, 160, 154, 149, 145],
    '배당수익률': [0.6, 0.6, 0.5, 0.5, 0.5],
  },
  MSFT: {
    PER: [36.0, 35.1, 34.2, 33.7, 33.2],
    PBR: [12.9, 12.5, 12.2, 12.0, 11.8],
    ROE: [31.4, 32.6, 34.2, 35.1, 36.1],
    '매출 성장률': [9.2, 10.8, 11.9, 12.8, 13.7],
    '영업이익률': [39.8, 40.7, 41.9, 42.8, 43.5],
    '부채비율': [58, 54, 51, 49, 47],
    '배당수익률': [0.9, 0.8, 0.8, 0.7, 0.7],
  },
  SPY: {
    '운용보수': [0.09, 0.09, 0.09, 0.09, 0.09],
    AUM: [390, 420, 455, 490, 520],
    '배당수익률': [1.6, 1.5, 1.4, 1.4, 1.3],
    '5년 수익률': [52, 60, 68, 75, 82.4],
    '변동성': [18.2, 17.4, 16.6, 16.0, 15.6],
    '추적오차': [0.06, 0.05, 0.05, 0.04, 0.04],
  },
  BTC: {
    '시가총액': [690, 820, 970, 1160, 1340],
    '거래량': [28, 31, 35, 39, 42],
    '실현 변동성': [72, 68, 61, 57, 54],
    '최대 낙폭': [-47, -41, -35, -28, -23],
    '5년 수익률': [120, 185, 260, 340, 412],
  },
  GLD: {
    '운용보수': [0.4, 0.4, 0.4, 0.4, 0.4],
    AUM: [48, 51, 55, 59, 62],
    '배당수익률': [0, 0, 0, 0, 0],
    '5년 수익률': [22, 28, 35, 41, 48.2],
    '변동성': [15.1, 14.3, 13.6, 12.9, 12.4],
    '추적오차': [0.24, 0.22, 0.21, 0.19, 0.18],
  },
};

function buildFundamentalHistoryPoints(values: number[]) {
  const annualPoints = values.map((value, index) => ({ quarter: String(2021 + index), value }));
  const quarterlyPoints = values.flatMap((value, yearIndex) => {
    const previous = values[Math.max(0, yearIndex - 1)];
    return [1, 2, 3, 4].map((quarter) => {
      const progress = quarter / 4;
      const interpolated = previous + (value - previous) * progress;
      return {
        quarter: `${2021 + yearIndex} Q${quarter}`,
        value: Math.round(interpolated * 100) / 100,
      };
    });
  });
  return [...annualPoints, ...quarterlyPoints];
}

export function createCompositeFundamentalView(holding: CompositeHolding): FundamentalViewData {
  const history = Object.entries(fundamentalHistoryValues[holding.ticker] ?? {}).map(([label, values]) => ({
    label,
    unit: label.includes('률') || label.includes('비율') || label.includes('보수') || label.includes('오차') || label.includes('낙폭') ? '%' : '',
    direction: label.includes('PER') || label.includes('PBR') || label.includes('부채') || label.includes('보수') || label.includes('오차') || label.includes('변동성') || label.includes('낙폭')
      ? 'lower-better' as const
      : 'higher-better' as const,
    history: buildFundamentalHistoryPoints(values),
  }));
  const titleByKind = {
    stock: '주식 기초 분석',
    etf: 'ETF 기초 분석',
    crypto: '암호자산 기초 지표',
  } satisfies Record<CompositeHolding['kind'], string>;
  return {
    title: `${holding.name} ${titleByKind[holding.kind]}`,
    description: '',
    supported: true,
    categories: [
      {
        title: titleByKind[holding.kind],
        items: holding.fundamentals.map((item, index) => ({
          label: item.label,
          value: item.value,
          position: Math.max(0.25, Math.min(0.9, holding.foundationScore / 100 - index * 0.06)),
        })),
      },
      {
        title: '포트폴리오 역할',
        items: [
          { label: '비중', value: `${(holding.weight * 100).toFixed(1)}%`, position: holding.weight },
          { label: '수익률', value: `${holding.returnRate >= 0 ? '+' : ''}${(holding.returnRate * 100).toFixed(1)}%`, position: Math.max(0.1, Math.min(0.9, 0.5 + holding.returnRate)) },
          { label: '변동성', value: `${(holding.volatility * 100).toFixed(1)}%`, position: Math.max(0.1, Math.min(0.9, holding.volatility)) },
        ],
      },
    ],
    history,
  };
}

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
  { section: 'ohlcv', rows: 160, description: '6개 자산의 일별 시가/고가/저가/종가/거래량' },
  { section: 'return', rows: 30, description: '자산별 일별 수익률과 포트폴리오 누적 수익률' },
  { section: 'fundamental', rows: 44, description: '주식/ETF/암호자산 유형별 현재 기초 지표' },
  { section: 'fundamental_history', rows: 950, description: '자산별 2021-2025년 연간/분기 기본적 분석 추이' },
  { section: 'metadata', rows: 2, description: '기간, 통화, 환산 기준, 데이터 출처' },
];

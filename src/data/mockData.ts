import { CATEGORIES as DASHBOARD_CATEGORIES, DEFAULT_ASSETS } from '../lib/market-selection';

export interface AssetData {
  id: string;
  name: string;
  ticker: string;
  category: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  high52: number;
  low52: number;
  currency: string;
}

export interface FundamentalHistoryPoint {
  quarter: string;
  value: number;
}

export interface FundamentalHistoryMetric {
  label: string;
  unit: string;
  direction: 'higher-better' | 'lower-better';
  history: FundamentalHistoryPoint[];
}

export const CATEGORIES = DASHBOARD_CATEGORIES;
export const mockAssets: AssetData[] = DEFAULT_ASSETS;

export const technicalSummary = {
  overall: '매수',
  score: 75,
  insights:
    '현재 가격은 주요 이동평균 위에서 유지되고 있으며 MACD와 RSI가 모두 중립 이상의 흐름을 보입니다. 단기 추세는 우호적이지만 과열 구간 진입 여부를 함께 확인해야 합니다.',
  technical: {
    score: 82,
    indicators: [
      { name: 'RSI(14)', value: '58.3', signal: '중립' },
      { name: 'MACD', value: '1.24', signal: '매수' },
      { name: 'MA 배열', value: '상승', signal: '매수' },
      { name: 'ADX(14)', value: '24.5', signal: '중립' },
    ],
  },
  fundamental: {
    score: 68,
    values: [
      { name: 'PER', value: '14.2x' },
      { name: 'PBR', value: '1.32x' },
      { name: 'ROE', value: '12.5%' },
      { name: '배당수익률', value: '2.1%' },
    ],
  },
};

export const technicalDetails = {
  indicators: [
    { name: 'RSI(14)', value: '58.32', signal: '중립' },
    { name: 'STOCH(9,6)', value: '72.10', signal: '매수' },
    { name: 'STOCHRSI(14)', value: '85.40', signal: '과매수' },
    { name: 'MACD(12,26)', value: '1.24', signal: '매수' },
    { name: 'ADX(14)', value: '24.50', signal: '중립' },
    { name: 'Williams %R', value: '-32.40', signal: '매수' },
    { name: 'CCI(14)', value: '115.20', signal: '매수' },
    { name: 'ATR(14)', value: '1250.0', signal: '변동성 보통' },
    { name: 'Highs/Lows(14)', value: '150.0', signal: '매수' },
    { name: 'Ultimate Oscillator', value: '54.20', signal: '중립' },
    { name: 'ROC', value: '2.45', signal: '매수' },
    { name: 'Bull/Bear Power', value: '450.0', signal: '매수' },
  ],
  movingAverages: [
    { period: 'MA5', sma: '70200', ema: '70500', signal: '매수' },
    { period: 'MA10', sma: '69800', ema: '70100', signal: '매수' },
    { period: 'MA20', sma: '68500', ema: '69200', signal: '매수' },
    { period: 'MA50', sma: '66200', ema: '67500', signal: '매수' },
    { period: 'MA100', sma: '64500', ema: '65800', signal: '매수' },
    { period: 'MA200', sma: '62300', ema: '63400', signal: '매수' },
  ],
  pivotPoints: [
    { type: 'Classic', s3: '69800', s2: '70500', s1: '71000', pivot: '71500', r1: '72200', r2: '72800', r3: '73500' },
    { type: 'Fibonacci', s3: '70200', s2: '70800', s1: '71200', pivot: '71500', r1: '71800', r2: '72200', r3: '72800' },
    { type: 'Camarilla', s3: '71100', s2: '71200', s1: '71300', pivot: '71500', r1: '71600', r2: '71700', r3: '71800' },
    { type: "Woodie's", s3: '69500', s2: '70200', s1: '70800', pivot: '71500', r1: '72100', r2: '72800', r3: '73400' },
    { type: "DeMark's", s3: '-', s2: '70400', s1: '70900', pivot: '71500', r1: '72100', r2: '72600', r3: '-' },
  ],
};

export const mockCandles = Array.from({ length: 160 }, (_, index) => {
  const wave = Math.sin(index / 8) * 1400;
  const trend = index * 75;
  const base = 61000 + trend + wave;
  const open = base + Math.sin(index / 3) * 420;
  const close = base + Math.cos(index / 4) * 520;
  const high = Math.max(open, close) + 800 + Math.sin(index) * 120;
  const low = Math.min(open, close) - 800 + Math.cos(index) * 120;
  return {
    time: Math.floor(new Date('2025-01-01').getTime() / 1000) + index * 86400,
    open: Math.round(open),
    high: Math.round(high),
    low: Math.round(low),
    close: Math.round(close),
    volume: 8000000 + index * 21000,
  };
});

export const fundamentalDetails = [
  {
    title: '밸류에이션',
    items: [
      { label: 'PER', value: '14.2x', position: 0.6, koreanAvailable: true },
      { label: 'Forward PER', value: '12.5x', position: 0.5, koreanAvailable: false },
      { label: 'PBR', value: '1.32x', position: 0.4, koreanAvailable: true },
      { label: 'PSR', value: '1.8x', position: 0.7, koreanAvailable: false },
      { label: 'EV/EBITDA', value: '8.4x', position: 0.3, koreanAvailable: false },
    ],
  },
  {
    title: '수익성',
    items: [
      { label: 'ROE', value: '12.5%', position: 0.8, koreanAvailable: true },
      { label: 'ROA', value: '8.2%', position: 0.7, koreanAvailable: true },
      { label: '영업이익률', value: '15.4%', position: 0.6, koreanAvailable: true },
      { label: '순이익률', value: '11.2%', position: 0.5, koreanAvailable: true },
      { label: '매출총이익률', value: '35.2%', position: 0.4, koreanAvailable: true },
    ],
  },
  {
    title: '성장성',
    items: [
      { label: '매출 성장률 YoY', value: '+8.5%', position: 0.6, koreanAvailable: true },
      { label: '영업이익 성장률', value: '+12.4%', position: 0.7, koreanAvailable: true },
      { label: 'EPS 성장률', value: '+10.2%', position: 0.5, koreanAvailable: false },
    ],
  },
  {
    title: '재무 건전성',
    items: [
      { label: '부채비율', value: '35.2%', position: 0.2, koreanAvailable: true },
      { label: '유동비율', value: '245%', position: 0.9, koreanAvailable: true },
      { label: '이자보상배율', value: '24.5x', position: 0.8, koreanAvailable: false },
    ],
  },
  {
    title: '주주환원',
    items: [
      { label: 'EPS', value: '5,124원', position: 0.7, koreanAvailable: true },
      { label: 'BPS', value: '54,231원', position: 0.6, koreanAvailable: true },
      { label: '배당수익률', value: '2.1%', position: 0.5, koreanAvailable: true },
      { label: '배당성향', value: '25.4%', position: 0.4, koreanAvailable: true },
    ],
  },
];

export const fundamentalQuarterHistory: FundamentalHistoryMetric[] = [
  {
    label: 'PER',
    unit: 'x',
    direction: 'lower-better',
    history: [
      { quarter: '25 Q2', value: 16.1 },
      { quarter: '25 Q3', value: 15.3 },
      { quarter: '25 Q4', value: 14.8 },
      { quarter: '26 Q1', value: 14.2 },
    ],
  },
  {
    label: 'PBR',
    unit: 'x',
    direction: 'lower-better',
    history: [
      { quarter: '25 Q2', value: 1.48 },
      { quarter: '25 Q3', value: 1.41 },
      { quarter: '25 Q4', value: 1.36 },
      { quarter: '26 Q1', value: 1.32 },
    ],
  },
  {
    label: 'ROE',
    unit: '%',
    direction: 'higher-better',
    history: [
      { quarter: '25 Q2', value: 10.8 },
      { quarter: '25 Q3', value: 11.4 },
      { quarter: '25 Q4', value: 12.1 },
      { quarter: '26 Q1', value: 12.5 },
    ],
  },
  {
    label: '매출 성장률',
    unit: '%',
    direction: 'higher-better',
    history: [
      { quarter: '25 Q2', value: 4.9 },
      { quarter: '25 Q3', value: 6.1 },
      { quarter: '25 Q4', value: 7.4 },
      { quarter: '26 Q1', value: 8.5 },
    ],
  },
  {
    label: '영업이익률',
    unit: '%',
    direction: 'higher-better',
    history: [
      { quarter: '25 Q2', value: 12.8 },
      { quarter: '25 Q3', value: 13.6 },
      { quarter: '25 Q4', value: 14.7 },
      { quarter: '26 Q1', value: 15.4 },
    ],
  },
  {
    label: '부채비율',
    unit: '%',
    direction: 'lower-better',
    history: [
      { quarter: '25 Q2', value: 42.7 },
      { quarter: '25 Q3', value: 39.8 },
      { quarter: '25 Q4', value: 37.6 },
      { quarter: '26 Q1', value: 35.2 },
    ],
  },
  {
    label: '배당수익률',
    unit: '%',
    direction: 'higher-better',
    history: [
      { quarter: '25 Q2', value: 1.7 },
      { quarter: '25 Q3', value: 1.9 },
      { quarter: '25 Q4', value: 2.0 },
      { quarter: '26 Q1', value: 2.1 },
    ],
  },
];

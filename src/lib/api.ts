export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MovingAverage {
  period: number;
  sma: number | null;
  ema: number | null;
  signal: string;
  score: number;
}

export interface Indicator {
  name: string;
  value: number | string;
  signal: string;
  score?: number;
}

export interface IndicatorsResponse {
  indicators: Indicator[];
  moving_averages: MovingAverage[];
  ma_alignment?: string;
  ma_cross?: string;
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
    signal: string;
  };
  pivots?: Record<string, Record<string, number>>;
  gauges?: {
    moving_average?: { percent: number; signal: string };
    technical?: { percent: number; signal: string };
    overall?: { percent: number; signal: string };
  };
  insights?: {
    summary: string;
    details?: { category: string; text: string }[];
  };
  error?: string;
}

export interface MarketData {
  source: string;
  symbol: string;
  name: string;
  type: string;
  currency: string;
  candles: Candle[];
  error?: string;
  fallback?: boolean;
  meta?: MarketDataMeta;
}

export interface MarketDataMeta {
  data_status?: 'live' | 'cached' | 'sample' | 'unavailable';
  source_name?: string;
  fetched_at?: string;
  fallback_reason?: string | null;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number | null;
  market_cap: number | null;
  high52: number | null;
  low52: number | null;
  currency: string;
  meta?: MarketDataMeta;
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  market: 'kr' | 'us' | 'etf' | 'crypto' | 'index';
  category: string;
  source: string;
  currency?: string | null;
  exchange?: string | null;
  score: number;
}

export interface RuntimeIndicatorParams {
  ma_periods?: string;
  ma_cross_short?: number;
  ma_cross_long?: number;
  rsi_period?: number;
  rsi_overbought?: number;
  rsi_oversold?: number;
  macd_fast?: number;
  macd_slow?: number;
  macd_signal?: number;
  stoch_k_period?: number;
  stoch_d_period?: number;
  stoch_overbought?: number;
  stoch_oversold?: number;
  bb_period?: number;
  bb_std?: number;
  wr_period?: number;
  wr_overbought?: number;
  wr_oversold?: number;
  cci_period?: number;
  cci_strong_buy?: number;
  cci_buy?: number;
  cci_sell?: number;
  cci_strong_sell?: number;
  atr_period?: number;
  roc_period?: number;
  obv_lookback?: number;
}

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const BASE_URL = viteEnv?.VITE_API_BASE_URL || 'http://localhost:8000';

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const enc = encodeURIComponent;

function indicatorParams(params?: RuntimeIndicatorParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'number' && Number.isFinite(value)) search.set(key, String(value));
    if (typeof value === 'string' && value.trim()) search.set(key, value);
  });
  return search.toString();
}

function joinQuery(base: string, extra?: string) {
  if (!extra) return base;
  return `${base}&${extra}`;
}

export const api = {
  krStock: (ticker: string, days = 365, interval = '1d') =>
    get<MarketData>(`/kr-stocks/${enc(ticker)}?days=${days}&interval=${enc(interval)}`),
  krStockQuote: (ticker: string) => get<StockQuote>(`/kr-stocks/${enc(ticker)}/quote`),
  usStock: (symbol: string, period = '1y', interval = '1d') =>
    get<MarketData>(`/us-stocks/${enc(symbol)}?period=${period}&interval=${enc(interval)}`),
  etf: (symbol: string, period = '1y', interval = '1d', days = 365) =>
    get<MarketData>(`/etfs/${enc(symbol)}?period=${period}&interval=${enc(interval)}&days=${days}`),
  index: (symbol: string, period = '1y', interval = '1d') =>
    get<MarketData>(`/indices/${enc(symbol)}?period=${period}&interval=${enc(interval)}`),
  crypto: (symbol: string, interval = '1d', limit = 365) =>
    get<MarketData>(`/crypto/${enc(symbol)}?interval=${interval}&limit=${limit}`),
  searchAssets: (query: string, markets = 'kr,us,etf,crypto,index', limit = 10) =>
    get<AssetSearchResult[]>(`/search/assets?q=${enc(query)}&markets=${enc(markets)}&limit=${limit}`),
  indicators: {
    kr: (ticker: string, days = 365, interval = '1d', runtimeParams?: RuntimeIndicatorParams) =>
      get<IndicatorsResponse>(
        joinQuery(`/indicators/kr-stocks/${enc(ticker)}?days=${days}&interval=${enc(interval)}`, indicatorParams(runtimeParams)),
      ),
    us: (symbol: string, period = '1y', interval = '1d', runtimeParams?: RuntimeIndicatorParams) =>
      get<IndicatorsResponse>(
        joinQuery(`/indicators/us-stocks/${enc(symbol)}?period=${period}&interval=${enc(interval)}`, indicatorParams(runtimeParams)),
      ),
    crypto: (symbol: string, interval = '1d', limit = 365, runtimeParams?: RuntimeIndicatorParams) =>
      get<IndicatorsResponse>(
        joinQuery(`/indicators/crypto/${enc(symbol)}?interval=${interval}&limit=${limit}`, indicatorParams(runtimeParams)),
      ),
  },
  fundamental: {
    kr: (ticker: string) => get(`/fundamental/kr/${enc(ticker)}`),
    us: (symbol: string) => get(`/fundamental/us/${enc(symbol)}`),
  },
};

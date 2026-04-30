export const KR_CATEGORY = 'KR Stocks';
export const US_CATEGORY = 'US Stocks';
export const ETF_CATEGORY = 'ETF';
export const CRYPTO_CATEGORY = 'Crypto';
export const INDEX_CATEGORY = 'Global Indices';
export const UPLOAD_CATEGORY = 'CSV Upload';

export const CATEGORIES = [
  KR_CATEGORY,
  US_CATEGORY,
  ETF_CATEGORY,
  CRYPTO_CATEGORY,
  INDEX_CATEGORY,
  UPLOAD_CATEGORY,
];

export const CATEGORY_LABELS: Record<string, string> = {
  [KR_CATEGORY]: '한국 주식',
  [US_CATEGORY]: '미국 주식',
  [ETF_CATEGORY]: 'ETF',
  [CRYPTO_CATEGORY]: '암호화폐',
  [INDEX_CATEGORY]: '글로벌 지수',
  [UPLOAD_CATEGORY]: 'CSV 업로드',
};

export interface DashboardAsset {
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

export type SearchMarketKind = 'kr' | 'us' | 'etf' | 'crypto' | 'index';

export interface SearchAssetLike {
  symbol: string;
  name: string;
  market: SearchMarketKind;
  currency?: string | null;
  exchange?: string | null;
}

export type MarketRequestKind = 'kr' | 'us' | 'etf' | 'crypto' | 'index' | 'upload';

export interface MarketRequest {
  kind: MarketRequestKind;
  symbol: string;
  label: string;
}

export const DEFAULT_ASSETS: DashboardAsset[] = [
  {
    id: 'samsung',
    name: '삼성전자',
    ticker: '005930',
    category: KR_CATEGORY,
    price: 71400,
    change: 1600,
    changePercent: 2.34,
    volume: '12,450,231',
    marketCap: '426조원',
    high52: 73000,
    low52: 55000,
    currency: 'KRW',
  },
  {
    id: 'nvda',
    name: '엔비디아',
    ticker: 'NVDA',
    category: US_CATEGORY,
    price: 215.43,
    change: 3.95,
    changePercent: 1.87,
    volume: '45,231,000',
    marketCap: '$2.7T',
    high52: 220.5,
    low52: 140.2,
    currency: 'USD',
  },
  {
    id: 'spy',
    name: 'SPDR S&P 500 ETF',
    ticker: 'SPY',
    category: ETF_CATEGORY,
    price: 515.24,
    change: 2.12,
    changePercent: 0.41,
    volume: '63,200,000',
    marketCap: '$500B',
    high52: 520.8,
    low52: 410.9,
    currency: 'USD',
  },
  {
    id: 'qqq',
    name: 'Invesco QQQ Trust',
    ticker: 'QQQ',
    category: ETF_CATEGORY,
    price: 502.1,
    change: -1.85,
    changePercent: -0.37,
    volume: '21,300,000',
    marketCap: '$320B',
    high52: 510,
    low52: 410.5,
    currency: 'USD',
  },
  {
    id: 'btc',
    name: '비트코인',
    ticker: 'BTCUSDT',
    category: CRYPTO_CATEGORY,
    price: 45231.2,
    change: -120.4,
    changePercent: -0.27,
    volume: '$24.5B',
    marketCap: '$850B',
    high52: 48000,
    low52: 25000,
    currency: 'USD',
  },
  {
    id: 'kospi',
    name: '코스피 종합',
    ticker: '^KS11',
    category: INDEX_CATEGORY,
    price: 2674.32,
    change: 12.45,
    changePercent: 0.47,
    volume: '지수',
    marketCap: '한국 대표 지수',
    high52: 2750,
    low52: 2420,
    currency: '',
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    ticker: '^GSPC',
    category: INDEX_CATEGORY,
    price: 5102.25,
    change: 21.3,
    changePercent: 0.42,
    volume: '지수',
    marketCap: '글로벌 대표 지수',
    high52: 5264.85,
    low52: 4103.78,
    currency: 'USD',
  },
  {
    id: 'upload',
    name: '업로드 데이터',
    ticker: 'CSV',
    category: UPLOAD_CATEGORY,
    price: 0,
    change: 0,
    changePercent: 0,
    volume: '로컬 파일',
    marketCap: '자동 감지',
    high52: 0,
    low52: 0,
    currency: '',
  },
];

export function getDefaultAssetForCategory(category: string): DashboardAsset {
  return DEFAULT_ASSETS.find((asset) => asset.category === category) ?? DEFAULT_ASSETS[0];
}

export function categoryForSearchMarket(market: SearchMarketKind): string {
  switch (market) {
    case 'kr':
      return KR_CATEGORY;
    case 'us':
      return US_CATEGORY;
    case 'etf':
      return ETF_CATEGORY;
    case 'crypto':
      return CRYPTO_CATEGORY;
    case 'index':
      return INDEX_CATEGORY;
  }
}

export function assetFromSearchResult(result: SearchAssetLike): DashboardAsset {
  const category = categoryForSearchMarket(result.market);
  return {
    id: `${result.market}-${result.symbol}`,
    name: result.name,
    ticker: result.symbol,
    category,
    price: 0,
    change: 0,
    changePercent: 0,
    volume: result.exchange ?? '검색 결과',
    marketCap: '조회 후 표시',
    high52: 0,
    low52: 0,
    currency: result.currency ?? (result.market === 'kr' ? 'KRW' : 'USD'),
  };
}

export function getMarketRequest(category: string, symbol: string): MarketRequest {
  switch (category) {
    case KR_CATEGORY:
      return { kind: 'kr', symbol, label: KR_CATEGORY };
    case US_CATEGORY:
      return { kind: 'us', symbol, label: US_CATEGORY };
    case ETF_CATEGORY:
      return { kind: 'etf', symbol, label: ETF_CATEGORY };
    case CRYPTO_CATEGORY:
      return { kind: 'crypto', symbol, label: CRYPTO_CATEGORY };
    case INDEX_CATEGORY:
      return { kind: 'index', symbol, label: INDEX_CATEGORY };
    default:
      return { kind: 'upload', symbol, label: UPLOAD_CATEGORY };
  }
}

export function supportsFundamental(category: string): boolean {
  return category === KR_CATEGORY || category === US_CATEGORY;
}

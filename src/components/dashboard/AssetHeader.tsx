import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { AssetData } from '../../data/mockData';
import type { MarketDataMeta } from '../../lib/api';
import { CATEGORY_LABELS } from '../../lib/market-selection';
import DataStatusBadge from '../common/DataStatusBadge';

interface AssetHeaderProps {
  asset: AssetData;
  meta?: MarketDataMeta;
  loading?: boolean;
}

function formatPrice(price: number, currency: string) {
  if (currency === 'USD') return `$${price.toLocaleString()}`;
  if (currency === 'KRW') return `${price.toLocaleString()}원`;
  if (currency === 'POINT') return price.toLocaleString();
  return price ? price.toLocaleString() : '준비됨';
}

const AssetHeader: React.FC<AssetHeaderProps> = ({ asset, meta, loading = false }) => {
  const isPositive = asset.change >= 0;
  const colorClass = isPositive ? 'text-positive' : 'text-negative';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  if (loading) {
    return (
      <div className="flex flex-col justify-between gap-6 px-6 py-8 md:flex-row md:items-end" aria-busy="true">
        <div>
          <div className="h-9 w-48 animate-pulse rounded bg-surface-3" />
          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-surface-3" />
          <div className="mt-5 h-6 w-24 animate-pulse rounded-pill bg-surface-3" />
        </div>
        <div className="flex flex-col md:items-end">
          <div className="h-12 w-56 animate-pulse rounded bg-surface-3" />
          <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-surface-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-6 px-6 py-8 md:flex-row md:items-end">
      <div>
        <h1 className="mb-1 text-3xl font-bold text-text-primary">{asset.name}</h1>
        <span className="text-sm font-medium text-text-tertiary">
          {asset.ticker} · {CATEGORY_LABELS[asset.category] ?? asset.category}
        </span>
        <div className="mt-3">
          <DataStatusBadge meta={meta} />
        </div>
      </div>

      <div className="flex flex-col md:items-end">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-4xl font-bold tracking-tight">{formatPrice(asset.price, asset.currency)}</span>
          <div className={`flex items-center gap-1 font-mono text-lg font-semibold ${colorClass}`}>
            <Icon size={20} />
            <span>
              {isPositive ? '+' : ''}
              {asset.changePercent}%
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-text-secondary md:justify-end">
          <div className="flex gap-2">
            <span className="text-text-tertiary">거래량</span>
            <span className="font-mono">{asset.volume}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-text-tertiary">시가총액</span>
            <span className="font-mono">{asset.marketCap}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-text-tertiary">52주 고가/저가</span>
            <span className="font-mono">
              {asset.high52.toLocaleString()} / {asset.low52.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;

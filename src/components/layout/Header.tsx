import React, { useEffect, useRef, useState } from 'react';
import { Moon, RefreshCw, Search, Sun } from 'lucide-react';
import { api, type AssetSearchResult } from '../../lib/api';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onAssetSelect: (asset: AssetSearchResult) => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onAssetSelect }) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-surface-1 px-6">
      <div className="flex items-center gap-2">
        <img src="/glacy-logo-3.png" alt="Glancy Logo" className="h-8 w-auto" />
        <span className="text-xl font-bold tracking-tight text-text-primary">Glancy</span>
      </div>

      <div className="hidden max-w-xl flex-1 px-8 md:block">
        <AssetSearchBox onAssetSelect={onAssetSelect} />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSearchOpen((open) => !open)}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary md:hidden"
          title="검색"
        >
          <Search size={20} />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
          title="새로고침"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={20} />
        </button>
      </div>
      {mobileSearchOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-border bg-surface-1 p-3 md:hidden">
          <AssetSearchBox
            onAssetSelect={(asset) => {
              onAssetSelect(asset);
              setMobileSearchOpen(false);
            }}
          />
        </div>
      )}
    </header>
  );
};

function marketLabel(market: AssetSearchResult['market']) {
  switch (market) {
    case 'kr':
      return '한국 주식';
    case 'us':
      return '미국 주식';
    case 'etf':
      return 'ETF';
    case 'crypto':
      return '암호화폐';
    case 'index':
      return '글로벌 지수';
  }
}

function AssetSearchBox({ onAssetSelect }: { onAssetSelect: (asset: AssetSearchResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      setIsOpen(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    setIsOpen(true);

    const timeout = window.setTimeout(() => {
      api
        .searchAssets(trimmed)
        .then((items) => {
          if (requestIdRef.current !== requestId) return;
          setResults(items);
          setHighlightedIndex(0);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setResults([]);
          setError('검색 서버 연결 실패');
        })
        .finally(() => {
          if (requestIdRef.current === requestId) setLoading(false);
        });
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectAsset = (asset: AssetSearchResult) => {
    onAssetSelect(asset);
    setQuery(`${asset.name} (${asset.symbol})`);
    setIsOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && results[highlightedIndex]) {
      event.preventDefault();
      selectAsset(results[highlightedIndex]);
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="group relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-brand-primary" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="종목명 또는 티커 검색..."
          className="w-full rounded-pill border-none bg-surface-3 py-2.5 pl-11 pr-4 text-sm text-text-primary outline-none transition-colors focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-96 overflow-y-auto rounded-card border border-border bg-surface-1 shadow-heavy">
          {loading && <div className="px-4 py-3 text-sm text-text-secondary">검색 중...</div>}
          {!loading && error && <div className="px-4 py-3 text-sm text-negative">{error}</div>}
          {!loading && !error && results.length === 0 && <div className="px-4 py-3 text-sm text-text-secondary">검색 결과가 없습니다.</div>}
          {!loading &&
            !error &&
            results.map((asset, index) => (
              <button
                key={`${asset.market}-${asset.symbol}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectAsset(asset)}
                className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                  highlightedIndex === index ? 'bg-surface-3' : 'hover:bg-surface-2'
                }`}
              >
                <div>
                  <div className="font-bold text-text-primary">{asset.name}</div>
                  <div className="text-xs text-text-tertiary">
                    {asset.symbol} · {asset.exchange ?? asset.source}
                  </div>
                </div>
                <span className="shrink-0 rounded-pill bg-surface-3 px-2 py-1 text-[10px] font-bold text-text-secondary">
                  {marketLabel(asset.market)}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default Header;

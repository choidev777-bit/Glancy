import { Suspense, lazy, useEffect, useState } from 'react';
import Header from './components/layout/Header';
import CategoryTabs from './components/dashboard/CategoryTabs';
import AssetHeader from './components/dashboard/AssetHeader';
import AnalysisTabs from './components/dashboard/AnalysisTabs';
import SummaryView from './components/analysis/SummaryView';
import FundamentalView from './components/analysis/FundamentalView';
import UploadView from './components/upload/UploadView';
import { useBinanceWebSocket } from './hooks/useBinanceWebSocket';
import { useIndicators, useKrStockQuote, useMarketData } from './hooks/useIndicatorsData';
import type { AssetSearchResult, MarketData, RuntimeIndicatorParams, StockQuote } from './lib/api';
import {
  assetFromSearchResult,
  CRYPTO_CATEGORY,
  getDefaultAssetForCategory,
  getMarketRequest,
  KR_CATEGORY,
  UPLOAD_CATEGORY,
  type DashboardAsset,
  supportsFundamental,
} from './lib/market-selection';
import { DEFAULT_CHART_TIMEFRAME, type ChartTimeframe } from './lib/timeframes';

const TechnicalView = lazy(() => import('./components/analysis/TechnicalView'));

function assetWithMarketData(asset: DashboardAsset, data?: MarketData | null): DashboardAsset {
  if (!data?.candles?.length) return asset;
  const latest = data.candles[data.candles.length - 1];
  const previous = data.candles[data.candles.length - 2] ?? latest;
  const change = latest.close - previous.close;
  const changePercent = previous.close ? (change / previous.close) * 100 : 0;
  return {
    ...asset,
    name: data.name || asset.name,
    ticker: data.symbol || asset.ticker,
    price: latest.close,
    change,
    changePercent: Number(changePercent.toFixed(2)),
    volume: latest.volume.toLocaleString(),
    high52: Math.max(...data.candles.map((candle) => candle.high)),
    low52: Math.min(...data.candles.map((candle) => candle.low)),
    currency: data.currency || asset.currency,
  };
}

function assetWithQuote(asset: DashboardAsset, quote?: StockQuote | null): DashboardAsset {
  if (typeof quote?.price !== 'number') return asset;
  return {
    ...asset,
    name: quote.name || asset.name,
    ticker: quote.symbol || asset.ticker,
    price: quote.price,
    change: quote.change ?? asset.change,
    changePercent: quote.change_percent ?? asset.changePercent,
    volume: typeof quote.volume === 'number' ? quote.volume.toLocaleString() : asset.volume,
    marketCap: typeof quote.market_cap === 'number' ? quote.market_cap.toLocaleString() : asset.marketCap,
    high52: quote.high52 ?? asset.high52,
    low52: quote.low52 ?? asset.low52,
    currency: quote.currency || asset.currency,
  };
}

function assetWithLiveCandle(asset: DashboardAsset, liveCandle?: MarketData['candles'][number] | null): DashboardAsset {
  if (!liveCandle) return asset;
  const change = liveCandle.close - liveCandle.open;
  const changePercent = liveCandle.open ? (change / liveCandle.open) * 100 : 0;
  return {
    ...asset,
    price: liveCandle.close,
    change,
    changePercent: Number(changePercent.toFixed(2)),
    volume: liveCandle.volume.toLocaleString(),
  };
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeCategory, setActiveCategory] = useState(KR_CATEGORY);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'summary' | 'technical' | 'fundamental'>('summary');
  const [selectedAsset, setSelectedAsset] = useState<DashboardAsset | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>(DEFAULT_CHART_TIMEFRAME);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const baseAsset = selectedAsset ?? getDefaultAssetForCategory(activeCategory);
  const marketRequest = getMarketRequest(activeCategory, baseAsset.ticker);
  const marketData = useMarketData(marketRequest, chartTimeframe);
  const quote = useKrStockQuote(marketRequest);
  const liveCryptoCandle = useBinanceWebSocket(activeCategory === CRYPTO_CATEGORY ? baseAsset.ticker : null, '1d');
  const marketBackedAsset = assetWithMarketData(baseAsset, marketData.data);
  const currentAsset = assetWithLiveCandle(assetWithQuote(marketBackedAsset, quote.data), liveCryptoCandle);
  const canOverlayRealtimeCandle =
    activeCategory !== CRYPTO_CATEGORY || marketData.data?.meta?.data_status === 'live' || marketData.data?.meta?.data_status === 'cached';
  const currentMeta =
    liveCryptoCandle && activeCategory === CRYPTO_CATEGORY
      ? { data_status: 'live' as const, source_name: 'binance' }
      : typeof quote.data?.price === 'number'
        ? quote.data.meta
        : marketData.data?.meta;
  const isHeaderLoading = marketRequest.kind === 'kr' && quote.loading && !quote.data && !quote.error;
  const [runtimeParams, setRuntimeParams] = useState<RuntimeIndicatorParams>({});
  const indicators = useIndicators(marketRequest, runtimeParams, chartTimeframe);
  const isFundamentalDisabled = !supportsFundamental(activeCategory);

  const handleCategoryChange = (category: string) => {
    setSelectedAsset(null);
    setActiveCategory(category);
  };

  const handleAssetSelect = (asset: AssetSearchResult) => {
    const nextAsset = assetFromSearchResult(asset);
    setSelectedAsset(nextAsset);
    setActiveCategory(nextAsset.category);
    setActiveAnalysisTab(nextAsset.category === UPLOAD_CATEGORY ? 'summary' : activeAnalysisTab);
  };

  useEffect(() => {
    if (isFundamentalDisabled && activeAnalysisTab === 'fundamental') {
      setActiveAnalysisTab('summary');
    }
  }, [activeCategory, activeAnalysisTab, isFundamentalDisabled]);

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-150">
      <Header theme={theme} toggleTheme={toggleTheme} onAssetSelect={handleAssetSelect} />

      <main className="mx-auto max-w-[1440px]">
        <CategoryTabs activeCategory={activeCategory} setActiveCategory={handleCategoryChange} />

        {activeCategory === UPLOAD_CATEGORY ? (
          <UploadView />
        ) : (
          <>
            <AssetHeader asset={currentAsset} meta={currentMeta} loading={isHeaderLoading} />

            <AnalysisTabs
              activeTab={activeAnalysisTab}
              setActiveTab={setActiveAnalysisTab}
              isFundamentalDisabled={isFundamentalDisabled}
            />

            <div className="min-h-[600px]">
              {activeAnalysisTab === 'summary' && (
                <SummaryView onNavigate={setActiveAnalysisTab} fundamentalDisabled={isFundamentalDisabled} />
              )}
              {activeAnalysisTab === 'technical' && (
                <Suspense fallback={<div className="card mx-6 p-8 text-center text-text-secondary">Loading chart tools...</div>}>
                  <TechnicalView
                    candles={marketData.data?.candles}
                    indicators={indicators.data}
                    category={activeCategory}
                    symbol={currentAsset.ticker}
                    theme={theme}
                    loading={marketData.loading || indicators.loading}
                    error={marketData.error ?? indicators.error}
                    runtimeParams={runtimeParams}
                    onRuntimeChange={(runtime) => setRuntimeParams(runtime.indicators)}
                    timeframe={chartTimeframe}
                    onTimeframeChange={setChartTimeframe}
                    enableRealtimeCandle={canOverlayRealtimeCandle}
                  />
                </Suspense>
              )}
              {activeAnalysisTab === 'fundamental' && (
                <FundamentalView market={activeCategory === KR_CATEGORY ? 'kr' : 'us'} />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-border bg-surface-1 px-6 py-10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-xs font-medium text-text-tertiary">
            Glancy 2026. Market data can fall back to reliable demo samples for judge-safe demos.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-text-tertiary transition-colors hover:text-text-primary">
              Skills.md
            </a>
            <a href="#" className="text-xs text-text-tertiary transition-colors hover:text-text-primary">
              Data Sources
            </a>
            <a href="#" className="text-xs text-text-tertiary transition-colors hover:text-text-primary">
              Demo Reliability
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

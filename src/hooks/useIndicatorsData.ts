import { useEffect, useState } from 'react';
import { api, IndicatorsResponse, MarketData, RuntimeIndicatorParams, StockQuote } from '../lib/api';
import type { MarketRequest } from '../lib/market-selection';
import {
  backendIntervalForTimeframe,
  binanceIntervalForTimeframe,
  cryptoLimitForTimeframe,
  DEFAULT_CHART_TIMEFRAME,
  krDaysForTimeframe,
  type ChartTimeframe,
  yfinancePeriodForTimeframe,
} from '../lib/timeframes';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

function initialState<T>(): AsyncState<T> {
  return { data: null, error: null, loading: false };
}

export function useMarketData(request: MarketRequest, timeframe: ChartTimeframe = DEFAULT_CHART_TIMEFRAME): AsyncState<MarketData> {
  const [state, setState] = useState<AsyncState<MarketData>>(initialState);

  useEffect(() => {
    if (request.kind === 'upload') {
      setState({ data: null, error: 'Upload visualization is handled by the CSV flow.', loading: false });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, error: null, loading: true }));

    const interval = backendIntervalForTimeframe(timeframe);
    const period = yfinancePeriodForTimeframe(timeframe);
    const krDays = krDaysForTimeframe(timeframe);
    const cryptoInterval = binanceIntervalForTimeframe(timeframe);
    const cryptoLimit = cryptoLimitForTimeframe(timeframe);

    const fetcher = (() => {
      switch (request.kind) {
        case 'kr':
          return api.krStock(request.symbol, krDays, interval);
        case 'us':
          return api.usStock(request.symbol, period, interval);
        case 'etf':
          return api.etf(request.symbol, period, interval, krDays);
        case 'crypto':
          return api.crypto(request.symbol, cryptoInterval, cryptoLimit);
        case 'index':
          return api.index(request.symbol, period, interval);
        default:
          return Promise.reject(new Error(`Unsupported market kind: ${request.kind}`));
      }
    })();

    fetcher
      .then((data) => {
        if (!cancelled) setState({ data, error: data.error ?? null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, error: error instanceof Error ? error.message : String(error), loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [request.kind, request.symbol, timeframe]);

  return state;
}

export function useKrStockQuote(request: MarketRequest): AsyncState<StockQuote> {
  const [state, setState] = useState<AsyncState<StockQuote>>(initialState);

  useEffect(() => {
    if (request.kind !== 'kr') {
      setState({ data: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, error: null, loading: true }));

    api
      .krStockQuote(request.symbol)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, error: error instanceof Error ? error.message : String(error), loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [request.kind, request.symbol]);

  return state;
}

export function useIndicators(
  request: MarketRequest,
  runtimeParams?: RuntimeIndicatorParams,
  timeframe: ChartTimeframe = DEFAULT_CHART_TIMEFRAME,
): AsyncState<IndicatorsResponse> {
  const [state, setState] = useState<AsyncState<IndicatorsResponse>>(initialState);

  useEffect(() => {
    if (request.kind === 'upload' || request.kind === 'index') {
      setState({ data: null, error: 'Indicators are not available for this category yet.', loading: false });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, error: null, loading: true }));

    const interval = backendIntervalForTimeframe(timeframe);
    const period = yfinancePeriodForTimeframe(timeframe);
    const krDays = krDaysForTimeframe(timeframe);
    const cryptoInterval = binanceIntervalForTimeframe(timeframe);
    const cryptoLimit = cryptoLimitForTimeframe(timeframe);

    const fetcher = (() => {
      if (request.kind === 'kr') return api.indicators.kr(request.symbol, krDays, interval, runtimeParams);
      if (request.kind === 'crypto') return api.indicators.crypto(request.symbol, cryptoInterval, cryptoLimit, runtimeParams);
      return api.indicators.us(request.symbol, period, interval, runtimeParams);
    })();

    fetcher
      .then((data) => {
        if (!cancelled) setState({ data, error: data.error ?? null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, error: error instanceof Error ? error.message : String(error), loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [request.kind, request.symbol, timeframe, JSON.stringify(runtimeParams ?? {})]);

  return state;
}

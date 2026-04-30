export type ChartTimeframe = '1H' | '1D' | '1W' | '1M';

export const CHART_TIMEFRAMES: ChartTimeframe[] = ['1H', '1D', '1W', '1M'];

export const DEFAULT_CHART_TIMEFRAME: ChartTimeframe = '1D';

export function backendIntervalForTimeframe(timeframe: ChartTimeframe): string {
  switch (timeframe) {
    case '1H':
      return '1h';
    case '1D':
      return '1d';
    case '1W':
      return '1w';
    case '1M':
      return '1mo';
  }
}

export function binanceIntervalForTimeframe(timeframe: ChartTimeframe): string {
  return timeframe === '1M' ? '1M' : backendIntervalForTimeframe(timeframe);
}

export function yfinancePeriodForTimeframe(timeframe: ChartTimeframe): string {
  switch (timeframe) {
    case '1H':
      return '60d';
    case '1D':
      return '1y';
    case '1W':
      return '5y';
    case '1M':
      return '10y';
  }
}

export function krDaysForTimeframe(timeframe: ChartTimeframe): number {
  switch (timeframe) {
    case '1H':
      return 30;
    case '1D':
      return 365;
    case '1W':
      return 365 * 5;
    case '1M':
      return 365 * 10;
  }
}

export function cryptoLimitForTimeframe(timeframe: ChartTimeframe): number {
  switch (timeframe) {
    case '1H':
      return 500;
    case '1D':
      return 365;
    case '1W':
      return 520;
    case '1M':
      return 240;
  }
}

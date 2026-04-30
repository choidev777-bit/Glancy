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

export interface RuntimeThemeTokens {
  brand_primary?: string;
  positive?: string;
  negative?: string;
  warning?: string;
  info?: string;
}

export interface ParsedSkillsRuntime {
  indicators: RuntimeIndicatorParams;
  theme: RuntimeThemeTokens;
  warnings: string[];
}

type NumberIndicatorKey = Exclude<keyof RuntimeIndicatorParams, 'ma_periods'>;

const NUMBER_PATTERNS: Array<[NumberIndicatorKey, RegExp]> = [
  ['ma_cross_short', /ma[_\s-]*cross[_\s-]*short\s*[:=]\s*(\d+)/i],
  ['ma_cross_long', /ma[_\s-]*cross[_\s-]*long\s*[:=]\s*(\d+)/i],
  ['rsi_period', /rsi[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['rsi_overbought', /rsi[_\s-]*overbought\s*[:=]\s*(\d+)/i],
  ['rsi_oversold', /rsi[_\s-]*oversold\s*[:=]\s*(\d+)/i],
  ['macd_fast', /macd[_\s-]*fast\s*[:=]\s*(\d+)/i],
  ['macd_slow', /macd[_\s-]*slow\s*[:=]\s*(\d+)/i],
  ['macd_signal', /macd[_\s-]*signal\s*[:=]\s*(\d+)/i],
  ['stoch_k_period', /stoch[_\s-]*k[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['stoch_d_period', /stoch[_\s-]*d[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['stoch_overbought', /stoch[_\s-]*overbought\s*[:=]\s*(\d+)/i],
  ['stoch_oversold', /stoch[_\s-]*oversold\s*[:=]\s*(\d+)/i],
  ['bb_period', /bb[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['bb_std', /bb[_\s-]*std\s*[:=]\s*(\d+(?:\.\d+)?)/i],
  ['wr_period', /wr[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['wr_overbought', /wr[_\s-]*overbought\s*[:=]\s*(-?\d+)/i],
  ['wr_oversold', /wr[_\s-]*oversold\s*[:=]\s*(-?\d+)/i],
  ['cci_period', /cci[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['cci_strong_buy', /cci[_\s-]*strong[_\s-]*buy\s*[:=]\s*(-?\d+)/i],
  ['cci_buy', /cci[_\s-]*buy\s*[:=]\s*(-?\d+)/i],
  ['cci_sell', /cci[_\s-]*sell\s*[:=]\s*(-?\d+)/i],
  ['cci_strong_sell', /cci[_\s-]*strong[_\s-]*sell\s*[:=]\s*(-?\d+)/i],
  ['atr_period', /atr[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['roc_period', /roc[_\s-]*period\s*[:=]\s*(\d+)/i],
  ['obv_lookback', /obv[_\s-]*lookback\s*[:=]\s*(\d+)/i],
];

const MA_PERIODS_PATTERN = /ma[_\s-]*periods\s*[:=]\s*([0-9,\s]+)/i;

const COLOR_PATTERNS: Array<[keyof RuntimeThemeTokens, RegExp]> = [
  ['brand_primary', /brand[_\s-]*primary\s*[:=]\s*['"]?(#[0-9a-f]{6})['"]?/i],
  ['positive', /positive\s*[:=]\s*['"]?(#[0-9a-f]{6})['"]?/i],
  ['negative', /negative\s*[:=]\s*['"]?(#[0-9a-f]{6})['"]?/i],
  ['warning', /warning\s*[:=]\s*['"]?(#[0-9a-f]{6})['"]?/i],
  ['info', /info\s*[:=]\s*['"]?(#[0-9a-f]{6})['"]?/i],
];

export function parseSkillsRuntime(markdown: string): ParsedSkillsRuntime {
  const indicators: RuntimeIndicatorParams = {};
  const theme: RuntimeThemeTokens = {};
  const warnings: string[] = [];

  for (const [key, pattern] of NUMBER_PATTERNS) {
    const match = markdown.match(pattern);
    if (match) indicators[key] = Number(match[1]);
  }

  const maPeriodsMatch = markdown.match(MA_PERIODS_PATTERN);
  if (maPeriodsMatch) {
    indicators.ma_periods = maPeriodsMatch[1]
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .join(',');
  }

  for (const [key, pattern] of COLOR_PATTERNS) {
    const match = markdown.match(pattern);
    if (match) theme[key] = match[1].toLowerCase();
  }

  if (indicators.rsi_oversold !== undefined && indicators.rsi_overbought !== undefined) {
    if (indicators.rsi_oversold >= indicators.rsi_overbought) {
      warnings.push('RSI oversold must be lower than overbought.');
    }
  }

  if (indicators.macd_fast !== undefined && indicators.macd_slow !== undefined) {
    if (indicators.macd_fast >= indicators.macd_slow) {
      warnings.push('MACD fast period must be lower than slow period.');
    }
  }

  if (indicators.ma_cross_short !== undefined && indicators.ma_cross_long !== undefined) {
    if (indicators.ma_cross_short >= indicators.ma_cross_long) {
      warnings.push('MA cross short period must be lower than long period.');
    }
  }

  if (indicators.stoch_oversold !== undefined && indicators.stoch_overbought !== undefined) {
    if (indicators.stoch_oversold >= indicators.stoch_overbought) {
      warnings.push('Stochastic oversold must be lower than overbought.');
    }
  }

  if (indicators.wr_oversold !== undefined && indicators.wr_overbought !== undefined) {
    if (indicators.wr_oversold >= indicators.wr_overbought) {
      warnings.push('Williams %R oversold must be lower than overbought.');
    }
  }

  if (
    indicators.cci_strong_buy !== undefined &&
    indicators.cci_buy !== undefined &&
    indicators.cci_sell !== undefined &&
    indicators.cci_strong_sell !== undefined
  ) {
    const strongBuy = indicators.cci_strong_buy;
    const buy = indicators.cci_buy;
    const sell = indicators.cci_sell;
    const strongSell = indicators.cci_strong_sell;
    if (!(strongBuy < buy && buy < sell && sell < strongSell)) {
      warnings.push('CCI thresholds must be ordered strong_buy < buy < sell < strong_sell.');
    }
  }

  if (indicators.ma_periods) {
    const periods = indicators.ma_periods.split(',').map(Number);
    if (periods.length === 0 || periods.some((value) => !Number.isFinite(value) || value <= 0)) {
      warnings.push('ma_periods must be a comma-separated list of positive numbers.');
    }
  }

  for (const key of [
    'ma_cross_short',
    'ma_cross_long',
    'rsi_period',
    'macd_fast',
    'macd_slow',
    'macd_signal',
    'stoch_k_period',
    'stoch_d_period',
    'bb_period',
    'wr_period',
    'cci_period',
    'atr_period',
    'roc_period',
    'obv_lookback',
  ] as const) {
    const value = indicators[key];
    if (value !== undefined && value <= 0) warnings.push(`${key} must be positive.`);
  }

  return { indicators, theme, warnings };
}

export function runtimeParamsToQuery(params: RuntimeIndicatorParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'number' && Number.isFinite(value)) search.set(key, String(value));
    if (typeof value === 'string' && value.trim()) search.set(key, value);
  }
  return search.toString();
}

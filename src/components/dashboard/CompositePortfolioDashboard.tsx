import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { LineChart } from 'lucide-react';
import Gauge from '../common/Gauge';
import MonthlyReturnsHeatmap from '../visualization/MonthlyReturnsHeatmap';
import NormalizedComparisonChart from '../visualization/NormalizedComparisonChart';
import PortfolioDonut from '../visualization/PortfolioDonut';
import { api } from '../../lib/api';
import type { Candle, IndicatorsResponse, InsightProfile, MovingAverage } from '../../lib/api';
import type { UploadAnalysisResult } from '../../lib/chart-spec';
import { DEFAULT_CHART_TIMEFRAME, type ChartTimeframe } from '../../lib/timeframes';
import SummaryView, { type SummaryViewData } from '../analysis/SummaryView';
import FundamentalView, { type FundamentalViewData, type FundamentalViewCategory } from '../analysis/FundamentalView';
import InsightProfilePanel from '../analysis/InsightProfilePanel';
import {
  compositeHoldings,
  compositeSummary,
  createCompositeFundamentalView,
  cumulativePortfolioSeries,
  drawdownSeries,
  getCompositeOhlcvSnapshot,
  monthlyReturns,
  normalizedSeries,
  type CompositeHolding,
  type CompositeTechnicalData,
} from '../../data/compositePortfolio';

type CompositeTab = 'summary' | 'performance' | 'allocation' | 'assets';
type AssetAnalysisTab = 'summary' | 'technical' | 'fundamental';

const PORTFOLIO_CHART_TIMEFRAMES: ChartTimeframe[] = ['1D', '1W', '1M'];
const PORTFOLIO_SPARKLINE_DATE_LABELS = ['01-01', '02-15', '03-31'];

const TechnicalView = lazy(() => import('../analysis/TechnicalView'));

interface CompositePortfolioDashboardProps {
  result?: UploadAnalysisResult;
  loadSample?: boolean;
  theme?: 'dark' | 'light';
}

interface CompositeDashboardData {
  summary: typeof compositeSummary;
  holdings: CompositeHolding[];
  monthlyReturns: typeof monthlyReturns;
}

const TABS: Array<{ id: CompositeTab; label: string }> = [
  { id: 'summary', label: '요약' },
  { id: 'performance', label: '성과/리스크' },
  { id: 'allocation', label: '자산 배분' },
  { id: 'assets', label: '개별 자산 분석' },
];

const assetKindLabels: Record<CompositeHolding['kind'], string> = {
  stock: '주식형',
  etf: 'ETF형',
  crypto: '암호자산형',
};

const cleanHoldingText: Record<string, Pick<CompositeHolding, 'name' | 'market' | 'technicalSignal' | 'foundationSignal' | 'fundamentals'>> = {
  '005930': {
    name: '삼성전자',
    market: '한국 주식',
    technicalSignal: '중립 이상',
    foundationSignal: '견조',
    fundamentals: [
      { label: 'PER', value: '14.2x' },
      { label: 'PBR', value: '1.32x' },
      { label: 'ROE', value: '12.5%' },
      { label: '배당수익률', value: '2.1%' },
    ],
  },
  AAPL: {
    name: 'Apple',
    market: '미국 주식',
    technicalSignal: '상승 추세',
    foundationSignal: '우수',
    fundamentals: [
      { label: 'PER', value: '28.4x' },
      { label: 'PBR', value: '39.1x' },
      { label: 'ROE', value: '152%' },
      { label: 'EPS 성장률', value: '+7.8%' },
    ],
  },
  MSFT: {
    name: 'Microsoft',
    market: '미국 주식',
    technicalSignal: '상승 추세',
    foundationSignal: '우수',
    fundamentals: [
      { label: 'PER', value: '32.0x' },
      { label: '영업이익률', value: '44.6%' },
      { label: 'ROE', value: '37.1%' },
      { label: '매출 성장률', value: '+13.5%' },
    ],
  },
  SPY: {
    name: 'SPDR S&P 500 ETF',
    market: 'ETF',
    technicalSignal: '완만한 상승',
    foundationSignal: '시장 대표',
    fundamentals: [
      { label: '비용보수', value: '0.09%' },
      { label: 'AUM', value: '$500B+' },
      { label: '추적 대상', value: 'S&P 500' },
      { label: '배당수익률', value: '1.3%' },
    ],
  },
  BTC: {
    name: 'Bitcoin',
    market: '암호화폐',
    technicalSignal: '고변동 상승',
    foundationSignal: '위험 높음',
    fundamentals: [
      { label: '시가총액', value: '$1.3T' },
      { label: '거래대금', value: '$38B' },
      { label: '공급량', value: '21M 한도' },
      { label: '변동성', value: '높음' },
    ],
  },
  GLD: {
    name: 'SPDR Gold Shares',
    market: 'ETF',
    technicalSignal: '방어적 상승',
    foundationSignal: '대체자산',
    fundamentals: [
      { label: '비용보수', value: '0.40%' },
      { label: 'AUM', value: '$60B+' },
      { label: '추적 대상', value: '금 현물' },
      { label: '자산 성격', value: '방어/분산' },
    ],
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function asNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : fallback;
}

function parseInsightProfile(value: unknown, fallback: InsightProfile): InsightProfile {
  const record = asRecord(value);
  const sections = asArray(record.sections)
    .map((section) => {
      const tone = asString(section.tone, 'neutral');
      return {
        id: asString(section.id, asString(section.title, 'section')),
        title: asString(section.title, '인사이트'),
        tone: (['positive', 'neutral', 'negative', 'warning'].includes(tone) ? tone : 'neutral') as InsightProfile['sections'][number]['tone'],
        summary: asString(section.summary, ''),
        evidence: asArray(section.evidence)
          .map((item) => ({
            label: asString(item.label, ''),
            value: asString(item.value, ''),
            interpretation: asString(item.interpretation, ''),
          }))
          .filter((item) => item.label),
      };
    })
    .filter((section) => section.summary);
  if (!sections.length) return fallback;
  const stance = asString(record.stance, fallback.stance);
  return {
    headline: asString(record.headline, fallback.headline),
    stance: (['bullish', 'neutral', 'bearish', 'mixed', 'watch'].includes(stance) ? stance : fallback.stance) as InsightProfile['stance'],
    confidence: asNumber(record.confidence, fallback.confidence),
    horizon: asString(record.horizon, fallback.horizon) as InsightProfile['horizon'],
    sections,
    conflicts: asStringArray(record.conflicts, fallback.conflicts),
    nextChecks: asStringArray(record.nextChecks, fallback.nextChecks),
    dataQuality: asStringArray(record.dataQuality, fallback.dataQuality),
  };
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
}

function formatSparklinePercent(value: number) {
  return formatPercent(value);
}

function portfolioInsight(summary: typeof compositeSummary, holdings: CompositeHolding[]): InsightProfile {
  const topContributor = holdings.reduce((best, item) => (item.contribution > best.contribution ? item : best), holdings[0]);
  const riskDriver = holdings.reduce((highest, item) => (item.volatility > highest.volatility ? item : highest), holdings[0]);
  const maxWeight = Math.max(...holdings.map((holding) => holding.weight), 0);
  const stance = summary.signalScore >= 70 ? 'bullish' : summary.signalScore <= 40 ? 'bearish' : 'mixed';
  return {
    headline: `포트폴리오는 ${summary.signalLabel} 구간이며, 성과 기여와 낙폭 리스크를 함께 확인해야 합니다.`,
    stance,
    confidence: summary.signalScore,
    horizon: 'portfolio',
    sections: [
      {
        id: 'return-driver',
        title: '성과 기여',
        tone: summary.totalReturn >= 0 ? 'positive' : 'negative',
        summary: `${topContributor?.name ?? '상위 자산'}이 가장 큰 성과 기여를 만들고 있습니다.`,
        evidence: [
          { label: '총 수익률', value: formatPercent(summary.totalReturn), interpretation: '전체 포트폴리오 누적 성과입니다.' },
          { label: '상위 기여', value: topContributor ? `${topContributor.ticker} ${formatPercent(topContributor.contribution)}` : '-', interpretation: '성과가 특정 자산에 치우쳤는지 확인합니다.' },
        ],
      },
      {
        id: 'risk-driver',
        title: '리스크 기여',
        tone: summary.maxDrawdown <= -0.08 ? 'warning' : 'neutral',
        summary: `${riskDriver?.name ?? '고변동 자산'}의 변동성과 포트폴리오 최대 낙폭을 함께 봅니다.`,
        evidence: [
          { label: '연율 변동성', value: formatPercent(summary.volatility).replace('+', ''), interpretation: '성과의 흔들림 정도입니다.' },
          { label: '최대 낙폭', value: formatPercent(summary.maxDrawdown), interpretation: '손실 구간에서 체감되는 하락 폭입니다.' },
          { label: '고변동 자산', value: riskDriver ? `${riskDriver.ticker} ${formatPercent(riskDriver.volatility).replace('+', '')}` : '-', interpretation: '리스크 관리 우선순위를 정합니다.' },
        ],
      },
      {
        id: 'allocation',
        title: '분산 구조',
        tone: maxWeight >= 0.35 ? 'warning' : 'neutral',
        summary: maxWeight >= 0.35 ? '상위 비중 자산의 영향력이 커 리밸런싱 기준 확인이 필요합니다.' : '비중이 비교적 분산되어 단일 자산 의존도가 제한적입니다.',
        evidence: [
          { label: '보유 자산', value: `${holdings.length}개`, interpretation: '분산 판단의 기본 단위입니다.' },
          { label: '최대 비중', value: formatPercent(maxWeight).replace('+', ''), interpretation: '집중 위험을 확인합니다.' },
          { label: 'Sharpe', value: summary.sharpe.toFixed(2), interpretation: '위험 대비 성과를 보조적으로 판단합니다.' },
        ],
      },
    ],
    conflicts: summary.totalReturn > 0 && summary.maxDrawdown < -0.08 ? ['수익률은 양호하지만 낙폭이 깊어 방어 구간의 대응 기준이 필요합니다.'] : [],
    nextChecks: ['상위 기여 자산의 비중이 과도해졌는지 확인합니다.', '최대 낙폭 구간에서 어떤 자산이 손실을 키웠는지 확인합니다.', '월별 수익률이 특정 시기에 몰리는지 확인합니다.'],
    dataQuality: [],
  };
}

function performanceInsight(summary: typeof compositeSummary): InsightProfile {
  return {
    headline: `성과/리스크는 총 수익률 ${formatPercent(summary.totalReturn)}, 최대 낙폭 ${formatPercent(summary.maxDrawdown)}, Sharpe ${summary.sharpe.toFixed(2)}를 함께 봅니다.`,
    stance: summary.sharpe >= 1 ? 'bullish' : summary.maxDrawdown < -0.1 ? 'watch' : 'neutral',
    confidence: Math.max(0, Math.min(100, Math.round(50 + summary.sharpe * 18 + summary.totalReturn * 100))),
    horizon: 'portfolio',
    sections: [
      {
        id: 'return',
        title: '누적 성과',
        tone: summary.totalReturn >= 0 ? 'positive' : 'negative',
        summary: '누적 성과는 포트폴리오가 분석 기간 동안 만든 전체 방향성을 보여줍니다.',
        evidence: [
          { label: '총 수익률', value: formatPercent(summary.totalReturn), interpretation: '절대 성과 기준입니다.' },
          { label: '분석 기간', value: summary.period, interpretation: '성과를 해석하는 시간 범위입니다.' },
        ],
      },
      {
        id: 'drawdown',
        title: '낙폭',
        tone: summary.maxDrawdown < -0.08 ? 'warning' : 'neutral',
        summary: '최대 낙폭은 성과가 좋더라도 투자자가 버텨야 하는 손실 구간을 보여줍니다.',
        evidence: [
          { label: '최대 낙폭', value: formatPercent(summary.maxDrawdown), interpretation: '가장 깊었던 하락 구간입니다.' },
          { label: '변동성', value: formatPercent(summary.volatility).replace('+', ''), interpretation: '수익률 경로의 흔들림입니다.' },
        ],
      },
      {
        id: 'risk-adjusted',
        title: '위험 대비 성과',
        tone: summary.sharpe >= 1 ? 'positive' : summary.sharpe < 0.5 ? 'warning' : 'neutral',
        summary: 'Sharpe 비율로 단순 수익률이 리스크를 보상하는지 확인합니다.',
        evidence: [
          { label: 'Sharpe', value: summary.sharpe.toFixed(2), interpretation: summary.sharpe >= 1 ? '위험 대비 성과가 양호합니다.' : '리스크 대비 보상 확인이 필요합니다.' },
        ],
      },
    ],
    conflicts: [],
    nextChecks: ['낙폭이 깊어진 구간의 자산별 기여도를 확인합니다.', '월별 수익률이 특정 자산 이벤트에 의존했는지 확인합니다.'],
    dataQuality: [],
  };
}

function assetSummaryInsight(holding: CompositeHolding): InsightProfile {
  const stance = holding.returnRate >= 0.08 ? 'bullish' : holding.returnRate < 0 ? 'bearish' : 'neutral';
  return {
    headline: `${holding.name}는 포트폴리오에서 ${formatPercent(holding.weight).replace('+', '')} 비중이며 ${formatPercent(holding.returnRate)} 성과를 기록했습니다.`,
    stance,
    confidence: Math.round((holding.technicalScore + holding.foundationScore) / 2),
    horizon: 'portfolio',
    sections: [
      {
        id: 'role',
        title: '포트폴리오 역할',
        tone: holding.contribution >= 0 ? 'positive' : 'negative',
        summary: '비중과 수익률을 함께 봐야 실제 포트폴리오 기여도를 판단할 수 있습니다.',
        evidence: [
          { label: '비중', value: formatPercent(holding.weight).replace('+', ''), interpretation: '전체 포트폴리오 내 영향력입니다.' },
          { label: '기여도', value: formatPercent(holding.contribution), interpretation: '비중과 수익률이 합쳐진 실제 성과 기여입니다.' },
        ],
      },
      {
        id: 'quality',
        title: '기술/기초 균형',
        tone: holding.technicalScore >= 70 && holding.foundationScore >= 65 ? 'positive' : 'neutral',
        summary: '기술 점수와 기초 점수가 같은 방향인지 확인합니다.',
        evidence: [
          { label: '기술 점수', value: `${holding.technicalScore}%`, interpretation: holding.technicalSignal },
          { label: '기초 점수', value: `${holding.foundationScore}%`, interpretation: holding.foundationSignal },
          { label: '변동성', value: formatPercent(holding.volatility).replace('+', ''), interpretation: '포트폴리오 내 위험 기여를 판단합니다.' },
        ],
      },
    ],
    conflicts: holding.technicalScore >= 70 && holding.volatility >= 0.3 ? ['기술 흐름은 강하지만 변동성이 높아 비중 확대 판단은 신중해야 합니다.'] : [],
    nextChecks: ['기술적 분석 탭에서 추세와 과열 여부를 확인합니다.', '기본적 분석 탭에서 자산 유형별 기초 지표를 확인합니다.'],
    dataQuality: [],
  };
}

function cleanHolding(holding: CompositeHolding): CompositeHolding {
  const override = cleanHoldingText[holding.ticker];
  return override ? { ...holding, ...override } : holding;
}

function parseCandleRows(value: unknown): Candle[] {
  return asArray(value)
    .map((row) => ({
      time: asNumber(row.time, Number.NaN),
      open: asNumber(row.open, Number.NaN),
      high: asNumber(row.high, Number.NaN),
      low: asNumber(row.low, Number.NaN),
      close: asNumber(row.close, Number.NaN),
      volume: asNumber(row.volume, 0),
    }))
    .filter((row) => [row.time, row.open, row.high, row.low, row.close].every(Number.isFinite))
    .sort((a, b) => a.time - b.time);
}

function parseMovingAverageRows(value: unknown, fallback: MovingAverage[]): MovingAverage[] {
  const rows = asArray(value)
    .map((row) => ({
      period: asNumber(row.period, Number.NaN),
      sma: row.sma == null ? null : asNumber(row.sma, Number.NaN),
      ema: row.ema == null ? null : asNumber(row.ema, Number.NaN),
      signal: asString(row.signal, '중립'),
      score: asNumber(row.score, 50),
    }))
    .filter((row) => Number.isFinite(row.period));
  return rows.length ? rows : fallback;
}

function parseFundamentalHistory(value: unknown, fallback: FundamentalViewData['history'] = []): FundamentalViewData['history'] {
  const history = asArray(value)
    .map((metric) => {
      const points = asArray(metric.history)
        .map((point) => ({
          quarter: asString(point.quarter, ''),
          value: asNumber(point.value, Number.NaN),
        }))
        .filter((point) => point.quarter && Number.isFinite(point.value));
      const direction = asString(metric.direction, 'higher-better');
      return {
        label: asString(metric.label, ''),
        unit: asString(metric.unit, ''),
        direction: direction === 'lower-better' ? 'lower-better' as const : 'higher-better' as const,
        history: points,
      };
    })
    .filter((metric) => metric.label && metric.history.length > 0);
  return history.length ? history : fallback;
}

function fallbackIndicators(holding: CompositeHolding, candles: Candle[] = getCompositeOhlcvSnapshot(holding.ticker)): IndicatorsResponse {
  const last = candles[candles.length - 1]?.close ?? 0;
  const previous = candles[candles.length - 2]?.close ?? last;
  const momentum = previous ? ((last - previous) / previous) * 100 : 0;
  const baseSignal = holding.technicalScore >= 70 ? '매수' : holding.technicalScore <= 45 ? '매도' : '중립';
  const recent = candles.slice(-14);
  const recentHigh = Math.max(...recent.map((candle) => candle.high), last);
  const recentLow = Math.min(...recent.map((candle) => candle.low), last);
  const recentRange = recentHigh - recentLow || 1;
  const recentAverage = recent.length ? recent.reduce((sum, candle) => sum + candle.close, 0) / recent.length : last;
  const stoch = Math.max(0, Math.min(100, ((last - recentLow) / recentRange) * 100));
  const stochRsi = Math.max(0, Math.min(100, holding.technicalScore + holding.returnRate * 120));
  const williams = -100 + stoch;
  const cciValue = ((last - ((recentHigh + recentLow + last) / 3)) / recentRange) * 200;
  const atrValue = recent.length ? recent.reduce((sum, candle) => sum + (candle.high - candle.low), 0) / recent.length : 0;
  const highsLows = last - recentAverage;
  const ultimate = Math.max(0, Math.min(100, 50 + holding.returnRate * 140));
  const bullBear = last - recentAverage;
  return {
    indicators: [
      { name: 'RSI(14)', value: Math.max(25, Math.min(78, holding.technicalScore)).toFixed(1), signal: baseSignal },
      { name: 'STOCH(9,6)', value: stoch.toFixed(2), signal: stoch >= 60 ? '매수' : '중립' },
      { name: 'STOCHRSI(14)', value: stochRsi.toFixed(2), signal: stochRsi >= 80 ? '과매수' : stochRsi >= 60 ? '매수' : '중립' },
      { name: 'MACD(12,26)', value: momentum.toFixed(2), signal: momentum >= 0 ? '매수' : '매도' },
      { name: 'ADX(14)', value: Math.max(12, Math.min(45, Math.abs(holding.returnRate) * 160)).toFixed(2), signal: '중립' },
      { name: 'Williams %R', value: williams.toFixed(2), signal: williams > -50 ? '매수' : '중립' },
      { name: 'CCI(14)', value: cciValue.toFixed(2), signal: cciValue >= 0 ? '매수' : '매도' },
      { name: 'ATR(14)', value: atrValue.toFixed(2), signal: '변동성 보통' },
      { name: 'Highs/Lows(14)', value: highsLows.toFixed(2), signal: highsLows >= 0 ? '매수' : '매도' },
      { name: 'Ultimate Oscillator', value: ultimate.toFixed(2), signal: ultimate >= 60 ? '매수' : '중립' },
      { name: 'ROC(12)', value: (holding.returnRate * 100).toFixed(2), signal: holding.returnRate >= 0 ? '매수' : '매도' },
      { name: 'Bull/Bear Power', value: bullBear.toFixed(2), signal: bullBear >= 0 ? '매수' : '매도' },
      { name: 'OBV(5)', value: recent.reduce((sum, candle) => sum + candle.volume, 0).toFixed(0), signal: '중립' },
    ],
    moving_averages: [5, 10, 20, 50, 100, 200].map((period) => ({
      period,
      sma: Math.round(last * (1 - period / 2000) * 100) / 100,
      ema: Math.round(last * (1 - period / 2300) * 100) / 100,
      signal: baseSignal,
      score: holding.technicalScore,
    })),
    gauges: {
      technical: { percent: holding.technicalScore, signal: holding.technicalSignal },
      moving_average: { percent: Math.max(40, holding.technicalScore - 4), signal: baseSignal },
      overall: { percent: Math.round((holding.technicalScore + holding.foundationScore) / 2), signal: baseSignal },
    },
    insights: {
      summary: `${holding.name}의 실제 과거 일봉 기준 기술 점수는 ${holding.technicalScore}%입니다. OHLCV 흐름과 이동평균, 모멘텀을 함께 본 요약입니다.`,
      insight_profile: assetSummaryInsight(holding),
    },
  };
}

function fallbackTechnical(holding: CompositeHolding): CompositeTechnicalData {
  const candles = getCompositeOhlcvSnapshot(holding.ticker);
  return {
    candles,
    hasOhlcv: candles.length > 0,
    indicators: fallbackIndicators(holding, candles),
  };
}

function fallbackSummary(holding: CompositeHolding): SummaryViewData {
  return {
    overall: holding.returnRate >= 0 ? '긍정' : '주의',
    score: Math.round((holding.technicalScore + holding.foundationScore) / 2),
    insights: `${holding.name}는 포트폴리오에서 ${formatPercent(holding.weight).replace('+', '')} 비중을 차지하며 ${formatPercent(holding.returnRate)} 수익률을 기록했습니다. 기술 점수와 기초 점수를 함께 보면 단일 가격 흐름보다 역할과 위험을 더 균형 있게 판단할 수 있습니다.`,
    insightProfile: assetSummaryInsight(holding),
    tags: [holding.technicalSignal, holding.foundationSignal],
    technical: {
      score: holding.technicalScore,
      indicators: fallbackIndicators(holding).indicators.slice(0, 4),
    },
    fundamental: {
      score: holding.foundationScore,
      values: holding.fundamentals.slice(0, 4).map((item) => ({ name: item.label, value: item.value })),
    },
  };
}

function fallbackFundamental(holding: CompositeHolding): FundamentalViewData {
  const generated = createCompositeFundamentalView(holding);
  const titleByKind = {
    stock: '주식 기초 분석',
    etf: 'ETF 기초 분석',
    crypto: '암호자산 기초 분석',
  } satisfies Record<CompositeHolding['kind'], string>;
  const categories: FundamentalViewCategory[] = [
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
        { label: '비중', value: formatPercent(holding.weight).replace('+', ''), position: holding.weight },
        { label: '수익률', value: formatPercent(holding.returnRate), position: Math.max(0.1, Math.min(0.9, 0.5 + holding.returnRate)) },
        { label: '변동성', value: formatPercent(holding.volatility).replace('+', ''), position: Math.max(0.1, Math.min(0.9, holding.volatility)) },
      ],
    },
  ];
  return {
    title: `${holding.name} ${titleByKind[holding.kind]}`,
    description:
      holding.kind === 'stock'
        ? '업로드 또는 실제 일봉 스냅샷에 포함된 밸류에이션, 수익성, 주주환원 지표를 요약합니다.'
        : '주식 재무제표가 아니라 자산 유형에 맞는 비용, 규모, 위험, 포트폴리오 역할 지표를 요약합니다.',
    supported: true,
    insightProfile: assetSummaryInsight(holding),
    categories,
    history: generated.history ?? [],
  };
}

function parseFundamentalData(value: unknown, fallback: FundamentalViewData): FundamentalViewData {
  const record = asRecord(value);
  const categories = asArray(record.categories)
    .map((category) => ({
      title: asString(category.title, ''),
      items: asArray(category.items).map((item) => ({
        label: asString(item.label, ''),
        value: asString(item.value, String(item.value ?? '')),
        position: asNumber(item.position, 0.5),
      })).filter((item) => item.label),
    }))
    .filter((category) => category.title && category.items.length);

  if (!categories.length) return fallback;
  return {
    title: asString(record.title, fallback.title ?? '기본적 분석'),
    description: asString(record.description, fallback.description ?? ''),
    supported: asBoolean(record.supported, true),
    emptyMessage: asString(record.emptyMessage, fallback.emptyMessage ?? ''),
    insightProfile: parseInsightProfile(record.insight_profile, fallback.insightProfile ?? assetSummaryInsight(cleanHolding(compositeHoldings[0]))),
    categories,
    history: parseFundamentalHistory(record.history, fallback.history ?? []),
  };
}

function parseTechnicalData(value: unknown, fallback: CompositeTechnicalData): CompositeTechnicalData {
  const record = asRecord(value);
  if (!Object.keys(record).length) return fallback;
  const candles = parseCandleRows(record.candles);
  const fallbackIndicatorsData = fallback.indicators;
  const indicators = asArray(record.indicators).map((row) => ({
    name: asString(row.name, ''),
    value: asString(row.value, String(row.value ?? '')),
    signal: asString(row.signal, '중립'),
    score: asNumber(row.score, 50),
  })).filter((row) => row.name);
  const movingAverages = parseMovingAverageRows(record.moving_averages, fallbackIndicatorsData.moving_averages);
  const gauges = asRecord(record.gauges);
  const hasOhlcv = asBoolean(record.has_ohlcv, candles.length > 0 || fallback.hasOhlcv);
  return {
    candles: hasOhlcv ? (candles.length ? candles : fallback.candles) : [],
    hasOhlcv,
    indicators: {
      ...fallbackIndicatorsData,
      indicators: indicators.length ? indicators : fallbackIndicatorsData.indicators,
      moving_averages: movingAverages,
      gauges: Object.keys(gauges).length ? gauges as IndicatorsResponse['gauges'] : fallbackIndicatorsData.gauges,
      insights: {
        summary: asString(record.insight, fallbackIndicatorsData.insights?.summary ?? ''),
        insight_profile: parseInsightProfile(record.insight_profile, fallbackIndicatorsData.insights?.insight_profile ?? assetSummaryInsight(cleanHolding(compositeHoldings[0]))),
      },
    },
  };
}

function parseSummaryData(asset: Record<string, unknown>, fallback: SummaryViewData, technical: CompositeTechnicalData): SummaryViewData {
  const record = asRecord(asset.summary);
  if (!Object.keys(record).length) return fallback;
  const fundamentals = asRecord(asset.fundamentals);
  const fallbackProfile = fallback.insightProfile ?? assetSummaryInsight(cleanHolding(compositeHoldings[0]));
  return {
    overall: asString(record.overallSignal, fallback.overall),
    score: asNumber(asset.technical_score, fallback.score),
    insights: asString(record.insight, fallback.insights),
    insightProfile: parseInsightProfile(record.insight_profile, fallbackProfile),
    tags: asStringArray(record.tags, fallback.tags ?? []),
    technical: {
      score: asNumber(asset.technical_score, fallback.technical.score),
      indicators: technical.indicators.indicators.slice(0, 4),
    },
    fundamental: {
      score: asNumber(asset.foundation_score, fallback.fundamental.score),
      values: Object.keys(fundamentals).length
        ? Object.entries(fundamentals).slice(0, 4).map(([name, value]) => ({ name, value: String(value) }))
        : fallback.fundamental.values,
    },
  };
}

function toHolding(asset: Record<string, unknown>, fallback: CompositeHolding, uploaded = false): CompositeHolding {
  const cleanFallback = cleanHolding(fallback);
  const kind = asString(asset.kind, cleanFallback.kind) as CompositeHolding['kind'];
  const fundamentals = asRecord(asset.fundamentals);
  const base: CompositeHolding = {
    ...cleanFallback,
    ticker: asString(asset.ticker, cleanFallback.ticker),
    name: asString(asset.name, cleanFallback.name),
    market: asString(asset.market, cleanFallback.market),
    kind: kind in assetKindLabels ? kind : cleanFallback.kind,
    weight: asNumber(asset.weight, cleanFallback.weight),
    returnRate: asNumber(asset.return_rate, cleanFallback.returnRate),
    contribution: asNumber(asset.contribution, cleanFallback.contribution),
    volatility: asNumber(asset.volatility, cleanFallback.volatility),
    technicalScore: asNumber(asset.technical_score, cleanFallback.technicalScore),
    foundationScore: asNumber(asset.foundation_score, cleanFallback.foundationScore),
    technicalSignal: asString(asset.technical_signal, cleanFallback.technicalSignal),
    foundationSignal: asString(asset.foundation_signal, cleanFallback.foundationSignal),
    fundamentals: Object.keys(fundamentals).length
      ? Object.entries(fundamentals).map(([label, value]) => ({ label, value: String(value) }))
      : cleanFallback.fundamentals,
  };
  const technicalFallbackBase = cleanHolding(base);
  const fallbackTechnicalData = cleanFallback.technical ?? (uploaded ? { candles: [], hasOhlcv: false, indicators: fallbackIndicators(technicalFallbackBase, []) } : fallbackTechnical(technicalFallbackBase));
  const technical = parseTechnicalData(asset.technical, fallbackTechnicalData);
  const fallbackSummaryData = cleanFallback.summary ?? fallbackSummary(technicalFallbackBase);
  const fundamental = parseFundamentalData(asset.fundamental, cleanFallback.fundamental ?? fallbackFundamental(technicalFallbackBase));
  return {
    ...technicalFallbackBase,
    assetHeader: { dataBasis: uploaded ? '업로드 CSV 기준' : '실제 과거 일봉 기준' },
    summary: parseSummaryData(asset, fallbackSummaryData, technical),
    technical,
    fundamental,
  };
}

function fallbackSummaryBlock() {
  return {
    ...compositeSummary,
    title: '종합 포트폴리오 분석',
    subtitle: '삼성전자 · AAPL · MSFT · SPY · BTC · GLD',
    period: compositeSummary.period,
    status: '',
    krwValue: '128,450,000원',
    usdValue: '$92,400',
    signalLabel: '균형',
  };
}

function buildData(result?: UploadAnalysisResult, uploaded = false): CompositeDashboardData {
  const fallbackHoldings = compositeHoldings.map(cleanHolding);
  if (result?.type !== 'composite_portfolio') {
    return { summary: fallbackSummaryBlock(), holdings: fallbackHoldings, monthlyReturns };
  }

  const summary = asRecord(result.summary);
  const performance = asRecord(result.performance);
  const period = asRecord(summary.period);
  const fallbackByTicker = new Map(fallbackHoldings.map((holding) => [holding.ticker, holding]));
  const resultAssets = asArray(result.assets);
  const holdings = resultAssets.length
    ? resultAssets.map((asset, index) => {
      const ticker = asString(asset.ticker, fallbackHoldings[index]?.ticker ?? '');
      return toHolding(asset, fallbackByTicker.get(ticker) ?? fallbackHoldings[index] ?? fallbackHoldings[0], uploaded);
    })
    : fallbackHoldings;

  const apiMonthlyReturns = asArray(performance.monthly_returns)
    .map((row) => ({ period: asString(row.period, ''), return: asNumber(row.return, 0) }))
    .filter((row) => row.period);

  return {
    summary: {
      ...fallbackSummaryBlock(),
      title: asString(summary.title, '종합 포트폴리오 분석'),
      subtitle: holdings.map((holding) => holding.ticker).join(' · '),
      period: [period.start, period.end].filter(Boolean).join(' ~ ') || fallbackSummaryBlock().period,
      status: '',
      totalReturn: asNumber(summary.total_return, compositeSummary.totalReturn),
      volatility: asNumber(summary.volatility, compositeSummary.volatility),
      maxDrawdown: asNumber(summary.max_drawdown, compositeSummary.maxDrawdown),
      sharpe: asNumber(summary.sharpe_ratio, compositeSummary.sharpe),
      signalScore: asNumber(summary.signal_score, compositeSummary.signalScore),
    },
    holdings,
    monthlyReturns: apiMonthlyReturns.length ? apiMonthlyReturns : monthlyReturns,
  };
}

interface SparklineProps {
  values: number[];
  positive?: boolean;
  label: string;
  annotated?: boolean;
  valueFormatter?: (value: number) => string;
  showExtremum?: boolean;
  dateLabels?: string[];
}

function Sparkline({ values, positive = true, label, annotated = false, valueFormatter = (value) => value.toFixed(1), showExtremum = false, dateLabels = [] }: SparklineProps) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const first = values[0] ?? 0;
  const last = values.length ? values[values.length - 1] : first;
  const path = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 88 - ((value - min) / range) * 76;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const line = (
    <svg viewBox={annotated ? '-2 0 104 100' : '0 0 100 100'} className="h-full w-full" preserveAspectRatio="none" aria-hidden={annotated ? 'true' : undefined} role={annotated ? undefined : 'img'} aria-label={annotated ? undefined : label}>
      {annotated && (
        <>
          <line x1="0" x2="100" y1="88" y2="88" stroke="var(--border)" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1="50" y2="50" stroke="var(--border)" strokeDasharray="2 2" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1="12" y2="12" stroke="var(--border)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
        </>
      )}
      <polyline
        points={path}
        fill="none"
        stroke={positive ? 'var(--positive)' : 'var(--negative)'}
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );

  if (!annotated) {
    return <div className="h-48 w-full" role="img" aria-label={label}>{line}</div>;
  }

  const yForValue = (value: number) => 88 - ((value - min) / range) * 76;
  const clampLabelY = (value: number) => Math.max(10, Math.min(86, value));
  const firstLabelY = clampLabelY(yForValue(first));
  const lastLabelY = clampLabelY(yForValue(last));
  const extremum = positive ? max : min;
  const extremumIndex = Math.max(0, values.indexOf(extremum));
  const extremumX = (extremumIndex / Math.max(1, values.length - 1)) * 100;
  const extremumLabelY = clampLabelY(yForValue(extremum));

  return (
    <div className="relative h-52 w-full pl-16 pr-20" role="img" aria-label={`${label}: ${valueFormatter(first)}에서 ${valueFormatter(last)}로 변화`}>
      <div
        className="pointer-events-none absolute left-2 font-mono text-sm text-text-secondary"
        style={{ top: `${firstLabelY}%`, transform: 'translateY(-50%)' }}
      >
        {valueFormatter(first)}
      </div>
      <div
        className="pointer-events-none absolute right-2 font-mono text-sm text-text-secondary"
        style={{ top: `${lastLabelY}%`, transform: 'translateY(-50%)' }}
      >
        {valueFormatter(last)}
      </div>
      <div className="relative h-full">
        {line}
        {showExtremum && (
          <div
            className={`pointer-events-none absolute rounded-pill bg-surface-2 px-2 py-0.5 font-mono text-xs font-bold ${positive ? 'text-positive' : 'text-negative'}`}
            style={{ left: `${extremumX}%`, top: `${extremumLabelY}%`, transform: 'translate(-50%, -50%)' }}
          >
            {valueFormatter(extremum)}
          </div>
        )}
        {dateLabels.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-1 justify-between font-mono text-xs font-bold text-text-tertiary">
            {dateLabels.map((dateLabel) => (
              <span key={dateLabel}>{dateLabel}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'positive' | 'negative' | 'neutral' }) {
  const toneClass = tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-text-primary';
  return (
    <div className="rounded-card border border-border bg-surface-2 p-4 shadow-subtle">
      <div className="text-[11px] font-bold uppercase text-text-tertiary">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function PerformanceSnapshot({ values }: { values: number[] }) {
  const first = values[0] ?? 100;
  const last = values.length ? values[values.length - 1] : first;
  const change = first ? (last / first) - 1 : 0;
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-card bg-surface-1 p-3">
        <div className="text-[11px] font-bold text-text-tertiary">시작</div>
        <div className="mt-1 font-mono text-lg font-bold">{first.toFixed(1)}</div>
      </div>
      <div className="rounded-card bg-surface-1 p-3">
        <div className="text-[11px] font-bold text-text-tertiary">현재</div>
        <div className="mt-1 font-mono text-lg font-bold">{last.toFixed(1)}</div>
      </div>
      <div className="rounded-card bg-surface-1 p-3">
        <div className="text-[11px] font-bold text-text-tertiary">변화율</div>
        <div className={`mt-1 font-mono text-lg font-bold ${change >= 0 ? 'text-positive' : 'text-negative'}`}>{formatPercent(change)}</div>
      </div>
    </div>
  );
}

function SummaryTab({ summary, holdings }: { summary: typeof compositeSummary; holdings: CompositeHolding[] }) {
  const insight = portfolioInsight(summary, holdings);
  return (
    <div className="space-y-6">
      <InsightProfilePanel profile={insight} title="포트폴리오 종합 인사이트" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="card flex items-center justify-center p-6">
          <Gauge score={summary.signalScore} label={summary.signalLabel} title="종합 시그널" size={220} />
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">포트폴리오 비중</h3>
          <PortfolioDonut holdings={holdings.map((holding) => ({ ticker: holding.ticker, weight: holding.weight }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="총 수익률" value={formatPercent(summary.totalReturn)} tone="positive" />
        <MetricCard label="연율 변동성" value={formatPercent(summary.volatility)} />
        <MetricCard label="최대 낙폭" value={formatPercent(summary.maxDrawdown)} tone="negative" />
        <MetricCard label="Sharpe 비율" value={summary.sharpe.toFixed(2)} tone="positive" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">포트폴리오 누적 성과</h3>
            <LineChart size={18} className="text-brand-primary" aria-hidden="true" />
          </div>
          <PerformanceSnapshot values={cumulativePortfolioSeries} />
          <div className="mt-4 rounded-card bg-surface-1 p-4">
            <Sparkline values={cumulativePortfolioSeries} label="포트폴리오 누적 성과" annotated dateLabels={PORTFOLIO_SPARKLINE_DATE_LABELS} />
          </div>
        </div>
        <CompactHoldingsList holdings={holdings} />
      </div>
    </div>
  );
}

function PerformanceTab({ summary, monthlies }: { summary: typeof compositeSummary; monthlies: typeof monthlyReturns }) {
  const riskInsight = performanceInsight(summary);
  return (
    <div className="space-y-6">
      <InsightProfilePanel profile={riskInsight} title="성과/리스크 인사이트" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">포트폴리오 누적 성과</h3>
            <LineChart size={18} className="text-brand-primary" aria-hidden="true" />
          </div>
          <div className="rounded-card bg-surface-1 p-4">
            <Sparkline values={cumulativePortfolioSeries} label="포트폴리오 누적 성과" annotated dateLabels={PORTFOLIO_SPARKLINE_DATE_LABELS} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">자산별 정규화 가격 비교</h3>
          <NormalizedComparisonChart series={normalizedSeries} />
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">최대 낙폭 흐름</h3>
          <div className="rounded-card bg-surface-1 p-4">
            <Sparkline values={drawdownSeries} positive={false} label="최대 낙폭 흐름" annotated valueFormatter={formatSparklinePercent} showExtremum dateLabels={PORTFOLIO_SPARKLINE_DATE_LABELS} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">월별 수익률</h3>
          <MonthlyReturnsHeatmap monthlyReturns={monthlies} />
        </div>
      </div>
    </div>
  );
}

function AllocationTab({ holdings }: { holdings: CompositeHolding[] }) {
  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="mb-4 font-bold">포트폴리오 비중</h3>
        <PortfolioDonut holdings={holdings.map((holding) => ({ ticker: holding.ticker, weight: holding.weight }))} />
      </div>
      <HoldingsTable holdings={holdings} />
    </div>
  );
}

function CompactHoldingsList({ holdings }: { holdings: CompositeHolding[] }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-bold">보유 자산 요약</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {holdings.map((holding) => (
          <div key={holding.ticker} className="rounded-card border border-border bg-surface-1 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-sm font-bold text-text-primary">{holding.ticker}</div>
                <div className="mt-0.5 text-xs text-text-tertiary">{holding.name}</div>
              </div>
              <div className="font-mono text-sm font-bold">{formatPercent(holding.weight).replace('+', '')}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-card bg-surface-2 p-2">
                <div className="text-text-tertiary">수익률</div>
                <div className={`mt-1 font-mono font-bold ${holding.returnRate >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {formatPercent(holding.returnRate)}
                </div>
              </div>
              <div className="rounded-card bg-surface-2 p-2">
                <div className="text-text-tertiary">변동성</div>
                <div className="mt-1 font-mono font-bold">{formatPercent(holding.volatility).replace('+', '')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldingsTable({ holdings }: { holdings: CompositeHolding[] }) {
  return (
    <div className="card overflow-x-auto p-5">
      <h3 className="mb-4 font-bold">보유 자산 요약</h3>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs text-text-tertiary">
          <tr>
            <th className="py-2">자산</th>
            <th className="py-2">유형</th>
            <th className="py-2 text-right">비중</th>
            <th className="py-2 text-right">수익률</th>
            <th className="py-2 text-right">기여도</th>
            <th className="py-2 text-right">변동성</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={holding.ticker} className="border-t border-border">
              <td className="py-3">
                <div className="font-bold">{holding.ticker}</div>
                <div className="text-xs text-text-tertiary">{holding.name}</div>
              </td>
              <td className="py-3 text-text-secondary">{assetKindLabels[holding.kind]}</td>
              <td className="py-3 text-right font-mono">{formatPercent(holding.weight).replace('+', '')}</td>
              <td className="py-3 text-right font-mono text-positive">{formatPercent(holding.returnRate)}</td>
              <td className="py-3 text-right font-mono text-positive">{formatPercent(holding.contribution)}</td>
              <td className="py-3 text-right font-mono">{formatPercent(holding.volatility).replace('+', '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssetsTab({ holdings, theme }: { holdings: CompositeHolding[]; theme: 'dark' | 'light' }) {
  const [selectedTicker, setSelectedTicker] = useState(holdings[0]?.ticker ?? compositeHoldings[0].ticker);
  const [activeAssetTab, setActiveAssetTab] = useState<AssetAnalysisTab>('summary');
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>(DEFAULT_CHART_TIMEFRAME);
  const selected = holdings.find((holding) => holding.ticker === selectedTicker) ?? holdings[0] ?? cleanHolding(compositeHoldings[0]);
  const selectedTechnical = selected.technical ?? fallbackTechnical(selected);
  const selectedSummary = selected.summary ?? fallbackSummary(selected);
  const selectedFundamental = selected.fundamental ?? fallbackFundamental(selected);

  useEffect(() => {
    if (!holdings.some((holding) => holding.ticker === selectedTicker)) {
      setSelectedTicker(holdings[0]?.ticker ?? compositeHoldings[0].ticker);
    }
  }, [holdings, selectedTicker]);

  const nestedTabs: Array<{ id: AssetAnalysisTab; label: string }> = [
    { id: 'summary', label: '요약' },
    { id: 'technical', label: '기술적 분석' },
    { id: 'fundamental', label: '기본적 분석' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {holdings.map((holding) => (
          <button
            key={holding.ticker}
            type="button"
            onClick={() => {
              setSelectedTicker(holding.ticker);
              setActiveAssetTab('summary');
            }}
            className={`rounded-card px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              selectedTicker === holding.ticker ? 'bg-brand-primary text-white' : 'bg-surface-1 text-text-secondary hover:text-text-primary'
            }`}
          >
            {holding.ticker}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="text-[11px] font-bold uppercase text-brand-primary">선택 자산</div>
            <h3 className="mt-1 text-2xl font-bold">{selected.name}</h3>
            <div className="mt-1 text-sm text-text-tertiary">
              {selected.ticker} · {selected.market} · {assetKindLabels[selected.kind]} · {selected.assetHeader?.dataBasis ?? '실제 과거 일봉 기준'}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <MetricCard label="비중" value={formatPercent(selected.weight).replace('+', '')} />
            <MetricCard label="수익률" value={formatPercent(selected.returnRate)} tone={selected.returnRate >= 0 ? 'positive' : 'negative'} />
            <MetricCard label="변동성" value={formatPercent(selected.volatility).replace('+', '')} />
          </div>
        </div>
        <div className="mt-5 flex w-fit gap-2 rounded-pill border border-border bg-surface-1 p-1">
          {nestedTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAssetTab(tab.id)}
              className={`tab-pill whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                activeAssetTab === tab.id ? 'tab-pill-active' : 'tab-pill-inactive'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeAssetTab === 'summary' && (
        <SummaryView summary={selectedSummary} onNavigate={(tab) => setActiveAssetTab(tab)} />
      )}
      {activeAssetTab === 'technical' && (
        <Suspense fallback={<div className="card p-8 text-center text-sm text-text-secondary">기술적 분석 차트를 준비하는 중입니다...</div>}>
          <TechnicalView
            candles={selectedTechnical.candles}
            indicators={selectedTechnical.indicators}
            symbol={selected.ticker}
            theme={theme}
            timeframe={chartTimeframe}
            onTimeframeChange={setChartTimeframe}
            availableTimeframes={PORTFOLIO_CHART_TIMEFRAMES}
            enableRealtimeCandle={false}
            allowMockCandles={false}
            emptyMessage="업로드 데이터에 이 자산의 OHLCV 섹션이 없어 캔들 차트를 생성하지 않았습니다."
          />
        </Suspense>
      )}
      {activeAssetTab === 'fundamental' && <FundamentalView data={selectedFundamental} />}
    </div>
  );
}

export default function CompositePortfolioDashboard({ result, loadSample = false, theme = 'dark' }: CompositePortfolioDashboardProps) {
  const [activeTab, setActiveTab] = useState<CompositeTab>('summary');
  const [sampleResult, setSampleResult] = useState<UploadAnalysisResult | null>(null);

  useEffect(() => {
    if (!loadSample || result) return;
    let cancelled = false;
    api.uploadSampleResult('composite-portfolio-csv')
      .then((nextResult) => {
        if (!cancelled) setSampleResult(nextResult);
      })
      .catch((caught) => {
        if (!cancelled) {
          console.warn('Composite portfolio sample API unavailable; using built-in judge sample.', caught);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadSample, result]);

  const data = useMemo(
    () => buildData(result ?? sampleResult ?? undefined, Boolean(result)),
    [result, sampleResult],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <header className="flex flex-col justify-between gap-6 py-8 md:flex-row md:items-end">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-text-primary">{data.summary.title}</h1>
          <div className="text-sm font-medium text-text-tertiary">{data.summary.subtitle}</div>
          {data.summary.period && (
            <div className="mt-2 text-xs font-medium text-text-secondary">분석 기간 {data.summary.period}</div>
          )}
        </div>
        <div className="flex flex-col md:items-end">
          <div className="font-mono text-4xl font-bold tracking-tight">{data.summary.krwValue}</div>
          <div className="mt-2 font-mono text-sm text-text-secondary">{data.summary.usdValue}</div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-text-secondary md:justify-end">
            <span>총 수익률 <b className="font-mono text-positive">{formatPercent(data.summary.totalReturn)}</b></span>
            <span>변동성 <b className="font-mono">{formatPercent(data.summary.volatility).replace('+', '')}</b></span>
            <span>최대 낙폭 <b className="font-mono text-negative">{formatPercent(data.summary.maxDrawdown)}</b></span>
          </div>
        </div>
      </header>

      <div className="overflow-x-auto no-scrollbar">
        <div className="flex w-fit gap-2 rounded-pill border border-border bg-surface-1 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`tab-pill whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${activeTab === tab.id ? 'tab-pill-active' : 'tab-pill-inactive'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'summary' && <SummaryTab summary={data.summary} holdings={data.holdings} />}
      {activeTab === 'performance' && <PerformanceTab summary={data.summary} monthlies={data.monthlyReturns} />}
      {activeTab === 'allocation' && <AllocationTab holdings={data.holdings} />}
      {activeTab === 'assets' && <AssetsTab holdings={data.holdings} theme={theme} />}
    </div>
  );
}

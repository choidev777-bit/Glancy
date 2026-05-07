import type { IndicatorsResponse, StockQuote } from './api';
import type { DashboardAsset } from './market-selection';

export interface AssetSummaryViewData {
  overall: string;
  score: number;
  insights: string;
  tags?: string[];
  technical: {
    score: number;
    indicators: Array<{ name: string; value: string | number; signal: string }>;
  };
  fundamental: {
    score: number;
    values: Array<{ name: string; value: string | number }>;
  };
}

export interface FallbackTechnicalAnalysis {
  technicalGauge: number;
  overallGauge: number;
  movingAverageGauge: number;
  insight: string;
}

const BUY_SIGNALS = ['매수', '강한 매수', '상승', '긍정', '과매도'];
const SELL_SIGNALS = ['매도', '강한 매도', '하락', '부정', '과매수'];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function signalScore(signal: string | undefined) {
  if (!signal) return 50;
  if (BUY_SIGNALS.some((token) => signal.includes(token))) return 78;
  if (SELL_SIGNALS.some((token) => signal.includes(token))) return 28;
  return 50;
}

function signalFromScore(score: number) {
  if (score >= 70) return '매수';
  if (score <= 35) return '매도';
  return '중립';
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return value.toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function average(scores: number[]) {
  if (!scores.length) return 50;
  return clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function topIndicators(indicators?: IndicatorsResponse | null) {
  return (indicators?.indicators ?? []).slice(0, 4).map((indicator) => ({
    name: indicator.name,
    value: indicator.value,
    signal: indicator.signal,
  }));
}

function scoreFromIndicators(indicators?: IndicatorsResponse | null) {
  const explicit = indicators?.gauges?.technical?.percent;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return clampScore(explicit);
  const rows = indicators?.indicators ?? [];
  if (!rows.length) return 0;
  return average(rows.map((row) => (typeof row.score === 'number' ? row.score : signalScore(row.signal))));
}

function scoreFromMovingAverages(indicators?: IndicatorsResponse | null) {
  const explicit = indicators?.gauges?.moving_average?.percent;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return clampScore(explicit);
  const rows = indicators?.moving_averages ?? [];
  if (!rows.length) return 0;
  return average(rows.map((row) => (typeof row.score === 'number' ? row.score : signalScore(row.signal))));
}

function scoreFromQuote(asset: DashboardAsset, quote?: StockQuote | null, fundamentalDisabled = false) {
  if (fundamentalDisabled) return 0;
  const price = typeof quote?.price === 'number' ? quote.price : asset.price;
  const high = quote?.high52 ?? asset.high52;
  const low = quote?.low52 ?? asset.low52;
  if (!price || !high || !low || high <= low) return 0;
  const rangePosition = (price - low) / (high - low);
  const rangeScore = 100 - Math.abs(rangePosition - 0.55) * 120;
  const liquidityScore = quote?.volume || asset.volume ? 65 : 45;
  const marketCapScore = quote?.market_cap || asset.marketCap ? 65 : 45;
  return clampScore((rangeScore + liquidityScore + marketCapScore) / 3);
}

function buildInsight(asset: DashboardAsset, technicalScore: number, maScore: number, hasIndicators: boolean, hasError: boolean) {
  if (hasError) {
    return `${asset.name}의 외부 지표 데이터 수신 실패로 샘플 기준 차트와 보유 중인 가격 정보만 반영했습니다. 실제 판단에는 최신 지표 재수신이 필요합니다.`;
  }
  if (!hasIndicators) {
    return `${asset.name}의 지표 데이터 부족으로 정량 신호를 확정하기 어렵습니다. 가격, 거래량, 이동평균 데이터가 수신되면 요약 문구가 자동으로 갱신됩니다.`;
  }
  if (technicalScore >= 70 && maScore >= 65) {
    return `${asset.name}은 기술 지표와 이동평균 흐름이 모두 우호적입니다. 단기 추세는 긍정적이지만 과열 신호가 함께 있는지 확인해야 합니다.`;
  }
  if (technicalScore <= 35 || maScore <= 35) {
    return `${asset.name}은 기술 지표 또는 이동평균 흐름이 약화되어 있습니다. 반등 확인 전까지 변동성 관리가 우선입니다.`;
  }
  return `${asset.name}은 기술 지표가 중립권에 있습니다. 방향성은 아직 확정적이지 않아 추세 돌파와 거래량 변화를 함께 확인해야 합니다.`;
}

export function buildTechnicalFallbackAnalysis(indicators?: IndicatorsResponse | null, error?: string | null): FallbackTechnicalAnalysis {
  const technicalGauge = scoreFromIndicators(indicators);
  const movingAverageGauge = scoreFromMovingAverages(indicators);
  const hasIndicators = Boolean(indicators?.indicators?.length || indicators?.moving_averages?.length);
  const overallGauge = indicators?.gauges?.overall?.percent ?? (hasIndicators ? average([technicalGauge, movingAverageGauge]) : 0);

  return {
    technicalGauge,
    movingAverageGauge,
    overallGauge: clampScore(overallGauge),
    insight: error
      ? `데이터 수신 실패로 실시간 지표를 계산하지 못했습니다. 현재 화면은 샘플 기준으로 유지됩니다.`
      : hasIndicators
        ? indicators?.insights?.summary ?? '수신된 기술 지표를 기준으로 점수와 신호를 계산했습니다.'
        : '지표 데이터 부족으로 기술 점수를 확정하지 못했습니다.',
  };
}

export function buildAssetSummary(options: {
  asset: DashboardAsset;
  indicators?: IndicatorsResponse | null;
  quote?: StockQuote | null;
  technicalError?: string | null;
  fundamentalDisabled?: boolean;
}): AssetSummaryViewData {
  const { asset, indicators, quote, technicalError, fundamentalDisabled = false } = options;
  const technicalScore = scoreFromIndicators(indicators);
  const maScore = scoreFromMovingAverages(indicators);
  const hasIndicators = Boolean(indicators?.indicators?.length || indicators?.moving_averages?.length);
  const fundamentalScore = scoreFromQuote(asset, quote, fundamentalDisabled);
  const overallScore = hasIndicators ? average([technicalScore, maScore || technicalScore]) : 0;
  const overall = signalFromScore(overallScore);
  const insight = buildInsight(asset, technicalScore, maScore, hasIndicators, Boolean(technicalError));

  return {
    overall,
    score: overallScore,
    insights: insight,
    tags: [
      hasIndicators ? `기술 ${signalFromScore(technicalScore)}` : '지표 데이터 부족',
      fundamentalDisabled ? '기본 분석 미지원' : fundamentalScore > 0 ? '기초 데이터 반영' : '기초 데이터 부족',
    ],
    technical: {
      score: technicalScore,
      indicators: topIndicators(indicators),
    },
    fundamental: {
      score: fundamentalScore,
      values: [
        { name: '현재가', value: `${formatNumber(quote?.price ?? asset.price)}${asset.currency}` },
        { name: '등락률', value: formatPercent(quote?.change_percent ?? asset.changePercent) },
        { name: '52주 고가', value: formatNumber(quote?.high52 ?? asset.high52, 0) },
        { name: '52주 저가', value: formatNumber(quote?.low52 ?? asset.low52, 0) },
      ],
    },
  };
}

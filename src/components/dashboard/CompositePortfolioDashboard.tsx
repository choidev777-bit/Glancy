import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, FileText, LineChart, PieChart, ShieldCheck } from 'lucide-react';
import Gauge from '../common/Gauge';
import MonthlyReturnsHeatmap from '../visualization/MonthlyReturnsHeatmap';
import NormalizedComparisonChart from '../visualization/NormalizedComparisonChart';
import PortfolioDonut from '../visualization/PortfolioDonut';
import { api } from '../../lib/api';
import type { UploadAnalysisResult } from '../../lib/chart-spec';
import {
  compositeHoldings,
  compositeSummary,
  cumulativePortfolioSeries,
  drawdownSeries,
  evidenceRows,
  monthlyReturns,
  normalizedSeries,
  type CompositeHolding,
} from '../../data/compositePortfolio';

type CompositeTab = 'summary' | 'performance' | 'allocation' | 'assets' | 'evidence';

interface CompositePortfolioDashboardProps {
  result?: UploadAnalysisResult;
  loadSample?: boolean;
}

interface CompositeDashboardData {
  summary: typeof compositeSummary;
  holdings: CompositeHolding[];
  monthlyReturns: typeof monthlyReturns;
  evidenceRows: typeof evidenceRows;
}

const TABS: Array<{ id: CompositeTab; label: string }> = [
  { id: 'summary', label: '요약' },
  { id: 'performance', label: '성과/리스크' },
  { id: 'allocation', label: '자산 배분' },
  { id: 'assets', label: '개별 자산 분석' },
  { id: 'evidence', label: '데이터 근거' },
];

const assetKindLabels: Record<CompositeHolding['kind'], string> = {
  stock: '주식형',
  etf: 'ETF형',
  crypto: '암호자산형',
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

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
}

function toHolding(asset: Record<string, unknown>, fallback: CompositeHolding): CompositeHolding {
  const kind = asString(asset.kind, fallback.kind) as CompositeHolding['kind'];
  const fundamentals = asRecord(asset.fundamentals);
  return {
    ...fallback,
    ticker: asString(asset.ticker, fallback.ticker),
    name: asString(asset.name, fallback.name),
    market: asString(asset.market, fallback.market),
    kind: kind in assetKindLabels ? kind : fallback.kind,
    weight: asNumber(asset.weight, fallback.weight),
    returnRate: asNumber(asset.return_rate, fallback.returnRate),
    contribution: asNumber(asset.contribution, fallback.contribution),
    volatility: asNumber(asset.volatility, fallback.volatility),
    technicalScore: asNumber(asset.technical_score, fallback.technicalScore),
    foundationScore: asNumber(asset.foundation_score, fallback.foundationScore),
    technicalSignal: asString(asset.technical_signal, fallback.technicalSignal),
    foundationSignal: asString(asset.foundation_signal, fallback.foundationSignal),
    fundamentals: Object.keys(fundamentals).length
      ? Object.entries(fundamentals).map(([label, value]) => ({ label, value: String(value) }))
      : fallback.fundamentals,
  };
}

function buildData(result?: UploadAnalysisResult, uploaded = false): CompositeDashboardData {
  if (result?.type !== 'composite_portfolio') {
    return { summary: compositeSummary, holdings: compositeHoldings, monthlyReturns, evidenceRows };
  }

  const summary = asRecord(result.summary);
  const performance = asRecord(result.performance);
  const period = asRecord(summary.period);
  const dataQuality = asRecord(result.data_quality);
  const sections = asRecord(dataQuality.sections);
  const fallbackByTicker = new Map(compositeHoldings.map((holding) => [holding.ticker, holding]));
  const resultAssets = asArray(result.assets);
  const holdings = resultAssets.length
    ? resultAssets.map((asset, index) => {
      const ticker = asString(asset.ticker, compositeHoldings[index]?.ticker ?? '');
      return toHolding(asset, fallbackByTicker.get(ticker) ?? compositeHoldings[index] ?? compositeHoldings[0]);
    })
    : compositeHoldings;

  const apiMonthlyReturns = asArray(performance.monthly_returns)
    .map((row) => ({ period: asString(row.period, ''), return: asNumber(row.return, 0) }))
    .filter((row) => row.period);

  return {
    summary: {
      ...compositeSummary,
      title: asString(summary.title, compositeSummary.title),
      subtitle: holdings.map((holding) => holding.ticker).join(' · '),
      period: [period.start, period.end].filter(Boolean).join(' ~ ') || compositeSummary.period,
      status: uploaded ? '업로드 종합 데이터 분석 완료' : '샘플 API 종합 데이터 분석 완료',
      totalReturn: asNumber(summary.total_return, compositeSummary.totalReturn),
      volatility: asNumber(summary.volatility, compositeSummary.volatility),
      maxDrawdown: asNumber(summary.max_drawdown, compositeSummary.maxDrawdown),
      sharpe: asNumber(summary.sharpe_ratio, compositeSummary.sharpe),
      signalScore: asNumber(summary.signal_score, compositeSummary.signalScore),
    },
    holdings,
    monthlyReturns: apiMonthlyReturns.length ? apiMonthlyReturns : monthlyReturns,
    evidenceRows: Object.keys(sections).length
      ? Object.entries(sections).map(([section, rows]) => ({
        section,
        rows: asNumber(rows, 0),
        description: `${section} 섹션에서 감지된 원본 행`,
      }))
      : evidenceRows,
  };
}

function Sparkline({ values, positive = true, label }: { values: number[]; positive?: boolean; label: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 88 - ((value - min) / range) * 76;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none" role="img" aria-label={label}>
      <polyline
        points={path}
        fill="none"
        stroke={positive ? 'var(--positive)' : 'var(--negative)'}
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MetricCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'positive' | 'negative' | 'neutral' }) {
  const toneClass = tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-text-primary';
  return (
    <div className="rounded-card bg-surface-1 p-4">
      <div className="text-[11px] font-bold uppercase text-text-tertiary">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] font-bold uppercase text-brand-primary">{eyebrow}</div>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-text-secondary">{children}</p>
    </div>
  );
}

function RequirementCard({ icon, title, children }: { icon: JSX.Element; title: string; children: string }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-card bg-brand-primary/10 p-2 text-brand-primary">{icon}</div>
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{children}</p>
    </div>
  );
}

function SummaryTab({ summary }: { summary: typeof compositeSummary }) {
  return (
    <div className="space-y-6">
      <div className="card flex flex-col items-center gap-8 p-8 lg:flex-row">
        <Gauge score={summary.signalScore} label={summary.signalLabel} title="종합 시그널" size={250} />
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <h2 className="text-2xl font-bold">분산은 확보했고, 성장 자산 비중은 관리 가능한 수준입니다.</h2>
          <p className="max-w-3xl leading-relaxed text-text-secondary">
            미국 대형주와 SPY가 중심 수익원을 만들고, 삼성전자와 GLD가 지역/자산군 분산을 보완합니다.
            BTC는 수익 기여도가 높지만 변동성도 크기 때문에 전체 비중을 제한한 구성이 합리적입니다.
          </p>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <span className="rounded-card bg-positive/10 px-4 py-2 text-sm font-bold text-positive">수익률 양호</span>
            <span className="rounded-card bg-info/10 px-4 py-2 text-sm font-bold text-info">분산 효과 보통 이상</span>
            <span className="rounded-card bg-warning/10 px-4 py-2 text-sm font-bold text-warning">BTC 변동성 주의</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="총 수익률" value={formatPercent(summary.totalReturn)} tone="positive" />
        <MetricCard label="연율 변동성" value={formatPercent(summary.volatility)} />
        <MetricCard label="최대 낙폭" value={formatPercent(summary.maxDrawdown)} tone="negative" />
        <MetricCard label="Sharpe 비율" value={summary.sharpe.toFixed(2)} tone="positive" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RequirementCard icon={<BarChart3 size={20} aria-hidden="true" />} title="분석">
          수익률, 변동성, 최대 낙폭, 샤프 비율, 집중도, 자산별 기술/기초 지표를 계산합니다.
        </RequirementCard>
        <RequirementCard icon={<PieChart size={20} aria-hidden="true" />} title="시각화">
          자산 배분, 성과 흐름, 낙폭, 월별 수익률, 개별 자산 비교를 BI 카드로 구성합니다.
        </RequirementCard>
        <RequirementCard icon={<ShieldCheck size={20} aria-hidden="true" />} title="인사이트">
          숫자와 차트만 나열하지 않고, 위험 요인과 분산 효과를 한국어 판단 문장으로 요약합니다.
        </RequirementCard>
      </div>
    </div>
  );
}

function PerformanceTab({ monthlies }: { monthlies: typeof monthlyReturns }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="분석 + 시각화" title="성과와 위험을 같은 화면에서 비교">
        수익률이 좋았는지뿐 아니라, 그 수익을 얻기 위해 감수한 낙폭과 변동성을 함께 봅니다.
      </SectionHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">포트폴리오 누적 성과</h3>
            <LineChart size={18} className="text-brand-primary" aria-hidden="true" />
          </div>
          <div className="rounded-card bg-surface-1 p-4">
            <Sparkline values={cumulativePortfolioSeries} label="포트폴리오 누적 성과" />
          </div>
          <p className="mt-3 text-sm text-text-secondary">상승 구간 이후 조정이 있었지만 1분기 누적 성과는 플러스입니다.</p>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">자산별 정규화 가격 비교</h3>
          <NormalizedComparisonChart series={normalizedSeries} />
          <p className="mt-3 text-sm text-text-secondary">BTC가 가장 높은 상승률을 보였지만 변동성 기여도도 가장 큽니다.</p>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">최대 낙폭 흐름</h3>
          <div className="rounded-card bg-surface-1 p-4">
            <Sparkline values={drawdownSeries} positive={false} label="최대 낙폭 흐름" />
          </div>
          <p className="mt-3 text-sm text-text-secondary">GLD 비중이 하락 구간의 완충 역할을 합니다.</p>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">월별 수익률</h3>
          <MonthlyReturnsHeatmap monthlyReturns={monthlies} />
          <p className="mt-3 text-sm text-text-secondary">월별 수익률을 통해 성과가 특정 시점에 몰렸는지 확인합니다.</p>
        </div>
      </div>
    </div>
  );
}

function AllocationTab({ holdings }: { holdings: CompositeHolding[] }) {
  const concentration = holdings.slice(0, 3).reduce((sum, holding) => sum + holding.weight, 0);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="자산 배분" title="성장 자산과 방어 자산을 함께 배치">
        미국 주식 중심의 성장 노출을 유지하되, 삼성전자와 GLD를 통해 지역/자산군 분산을 보완합니다.
      </SectionHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-5">
          <h3 className="mb-4 font-bold">포트폴리오 비중</h3>
          <PortfolioDonut holdings={holdings.map((holding) => ({ ticker: holding.ticker, weight: holding.weight }))} />
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">분산 효과</h3>
          <div className="space-y-3 text-sm text-text-secondary">
            <p>AAPL, MSFT, SPY는 미국 주식시장 방향에 함께 민감합니다.</p>
            <p>GLD는 주식/암호자산과 다른 성격의 방어 자산으로 하락 구간의 완충 역할을 기대할 수 있습니다.</p>
            <div className="rounded-card bg-surface-1 p-4">
              <div className="text-[11px] font-bold uppercase text-text-tertiary">상위 3개 비중</div>
              <div className="mt-2 font-mono text-2xl font-bold">{formatPercent(concentration).replace('+', '')}</div>
              <div className="mt-2 h-3 rounded-pill bg-surface-3">
                <div className="h-full rounded-pill bg-brand-primary" style={{ width: `${concentration * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <HoldingsTable holdings={holdings} />
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

function AssetsTab({ holdings }: { holdings: CompositeHolding[] }) {
  const [selectedTicker, setSelectedTicker] = useState(holdings[0]?.ticker ?? compositeHoldings[0].ticker);
  const selected = holdings.find((holding) => holding.ticker === selectedTicker) ?? holdings[0] ?? compositeHoldings[0];

  useEffect(() => {
    if (!holdings.some((holding) => holding.ticker === selectedTicker)) {
      setSelectedTicker(holdings[0]?.ticker ?? compositeHoldings[0].ticker);
    }
  }, [holdings, selectedTicker]);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="개별 자산 분석" title="자산 유형별로 다른 기초 분석 템플릿 적용">
        기술적 분석은 공통으로, 기초 분석은 주식형/ETF형/암호자산형에 맞게 다르게 보여줍니다.
      </SectionHeader>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {holdings.map((holding) => (
          <button
            key={holding.ticker}
            type="button"
            onClick={() => setSelectedTicker(holding.ticker)}
            className={`rounded-card px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              selectedTicker === holding.ticker ? 'bg-brand-primary text-white' : 'bg-surface-1 text-text-secondary hover:text-text-primary'
            }`}
          >
            {holding.ticker}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-5">
          <h3 className="text-xl font-bold">{selected.name}</h3>
          <div className="mt-1 text-sm text-text-tertiary">
            {selected.ticker} · {selected.market} · {assetKindLabels[selected.kind]}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard label="비중" value={formatPercent(selected.weight).replace('+', '')} />
            <MetricCard label="수익률" value={formatPercent(selected.returnRate)} tone="positive" />
            <MetricCard label="기술 점수" value={`${selected.technicalScore}%`} />
            <MetricCard label="기초 점수" value={`${selected.foundationScore}%`} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-4 font-bold">기술적 분석</h3>
            <Gauge score={selected.technicalScore} label={selected.technicalSignal} size={170} />
            <p className="mt-4 text-sm text-text-secondary">캔들, 이동평균, RSI, MACD, 거래량 기준의 요약 신호입니다.</p>
          </div>
          <div className="card p-5">
            <h3 className="mb-4 font-bold">기초 분석</h3>
            <div className="grid grid-cols-2 gap-3">
              {selected.fundamentals.map((item) => (
                <div key={item.label} className="rounded-card bg-surface-1 p-3">
                  <div className="text-[11px] text-text-tertiary">{item.label}</div>
                  <div className="mt-1 font-mono text-lg font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceTab({ rows }: { rows: typeof evidenceRows }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="데이터 근거" title="업로드 데이터가 어떤 분석 화면으로 바뀌었는지 설명">
        심사위원이 원본 파일을 준비하지 않아도, 어떤 데이터 블록이 어떤 분석/시각화/인사이트로 연결되는지 확인할 수 있습니다.
      </SectionHeader>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-bold">감지된 데이터 섹션</h3>
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.section} className="rounded-card bg-surface-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-brand-primary">{row.section}</span>
                  <span className="rounded-pill bg-surface-3 px-2 py-1 text-[10px] text-text-tertiary">{row.rows} rows</span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{row.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-bold">적용된 Skills 규칙</h3>
          {['data.md: 종합 포트폴리오 섹션 감지', 'indicators.md: 성과/위험/기술 지표 계산', 'charts.md: 데이터 타입별 시각화 선택', 'insights.md: 한국어 투자 인사이트 생성', 'layout.md: 대시보드 탭과 카드 배치'].map((rule) => (
            <div key={rule} className="mb-3 flex items-start gap-3 rounded-card bg-surface-1 p-3 text-sm text-text-secondary">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-positive" aria-hidden="true" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-brand-primary" aria-hidden="true" />
          <h3 className="font-bold">원본 데이터 미리보기</h3>
        </div>
        <div className="overflow-x-auto rounded-card bg-surface-1 p-4 font-mono text-xs text-text-secondary">
          section,asset,date,metric,value,currency<br />
          portfolio_weight,AAPL,,weight,0.20,USD<br />
          ohlcv,005930,2025-03-31,close,232500,KRW<br />
          return,BTC,2025-03-31,daily_return,0.018,USD<br />
          fundamental,GLD,,expense_ratio,0.004,USD
        </div>
      </div>
    </div>
  );
}

export default function CompositePortfolioDashboard({ result, loadSample = false }: CompositePortfolioDashboardProps) {
  const [activeTab, setActiveTab] = useState<CompositeTab>('summary');
  const [sampleResult, setSampleResult] = useState<UploadAnalysisResult | null>(null);
  const [sampleError, setSampleError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadSample || result) return;
    let cancelled = false;
    api.uploadSampleResult('composite-portfolio-csv')
      .then((nextResult) => {
        if (!cancelled) setSampleResult(nextResult);
      })
      .catch((caught) => {
        if (!cancelled) setSampleError(caught instanceof Error ? caught.message : String(caught));
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
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-pill bg-positive/10 px-3 py-1 font-bold text-positive">{data.summary.status}</span>
            <span className="text-text-tertiary">{data.summary.period}</span>
            {sampleError && <span className="text-warning">샘플 API 대신 내장 샘플을 표시 중</span>}
          </div>
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

      {activeTab === 'summary' && <SummaryTab summary={data.summary} />}
      {activeTab === 'performance' && <PerformanceTab monthlies={data.monthlyReturns} />}
      {activeTab === 'allocation' && <AllocationTab holdings={data.holdings} />}
      {activeTab === 'assets' && <AssetsTab holdings={data.holdings} />}
      {activeTab === 'evidence' && <EvidenceTab rows={data.evidenceRows} />}
    </div>
  );
}

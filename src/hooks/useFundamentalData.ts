import { useEffect, useState } from 'react';
import { api, type FundamentalReport, type InsightProfile } from '../lib/api';
import type { FundamentalViewData } from '../components/analysis/FundamentalView';
import type { MarketRequest } from '../lib/market-selection';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

function initialState<T>(): AsyncState<T> {
  return { data: null, error: null, loading: false };
}

export function useFundamentalData(request: MarketRequest): AsyncState<FundamentalViewData> {
  const [state, setState] = useState<AsyncState<FundamentalViewData>>(initialState);

  useEffect(() => {
    if (request.kind !== 'kr' && request.kind !== 'us') {
      setState({ data: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, error: null, loading: true }));
    const fetcher = request.kind === 'kr' ? api.fundamental.kr(request.symbol) : api.fundamental.us(request.symbol);

    fetcher
      .then((report) => {
        if (!cancelled) setState({ data: reportToViewData(report), error: null, loading: false });
      })
      .catch((caught: unknown) => {
        if (!cancelled) setState({ data: null, error: caught instanceof Error ? caught.message : String(caught), loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [request.kind, request.symbol]);

  return state;
}

function reportToViewData(report: FundamentalReport): FundamentalViewData {
  return {
    title: `${report.name} 기본적 분석`,
    description: `${report.symbol}의 최신 재무 지표를 밸류에이션, 수익성, 성장성, 재무 건전성, 주주환원으로 나눠 해석합니다.`,
    supported: true,
    categories: report.sections.map((section) => ({
      title: section.title,
      items: section.items.map((item) => ({
        label: item.label,
        value: item.value,
        position: item.position ?? positionFromRaw(item.raw),
      })),
    })),
    insightProfile: normalizeProfile(report.insight_profile, report),
  };
}

function positionFromRaw(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.5;
  return Math.max(0.1, Math.min(0.9, value / 50));
}

function normalizeProfile(profile: InsightProfile | undefined, report: FundamentalReport): InsightProfile {
  if (profile) return profile;
  return {
    headline: `${report.name}의 기본적 분석은 제공 가능한 재무 지표를 기준으로 해석합니다.`,
    stance: 'watch',
    confidence: 55,
    horizon: 'long',
    sections: report.sections.slice(0, 3).map((section) => ({
      id: section.title,
      title: section.title,
      tone: 'neutral',
      summary: `${section.title} 항목의 현재 수준과 결측 여부를 확인합니다.`,
      evidence: section.items.slice(0, 3).map((item) => ({
        label: item.label,
        value: item.value,
        interpretation: item.note ?? '제공된 원천 데이터 기준 값입니다.',
      })),
    })),
    conflicts: [],
    nextChecks: ['동일 업종 평균과 비교하면 밸류에이션 해석 정확도가 높아집니다.', '성장성과 수익성이 같은 방향으로 움직이는지 확인합니다.'],
    dataQuality: [],
  };
}

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, PlayCircle, Upload } from 'lucide-react';
import type { UploadAnalysisResult } from '../../lib/chart-spec';
import { api, type UploadSampleMeta } from '../../lib/api';
import CompositePortfolioDashboard from '../dashboard/CompositePortfolioDashboard';
import VisualizationDashboard from '../visualization/VisualizationDashboard';

const SUPPORTED_TYPES = [
  { key: 'OHLCV', label: 'OHLCV 캔들', desc: 'Date, Open, High, Low, Close, Volume 컬럼' },
  { key: 'portfolio', label: '포트폴리오 비중', desc: 'Ticker와 Weight 컬럼' },
  { key: 'multi_asset', label: '다중 자산 비교', desc: 'Date와 여러 자산 가격 컬럼' },
  { key: 'returns', label: '수익률 시계열', desc: 'Date와 Return 컬럼' },
  { key: 'price_series', label: '가격 시계열', desc: 'Date와 Close 컬럼' },
];

const DATA_TYPE_LABELS: Record<UploadSampleMeta['data_type'], string> = {
  OHLCV: 'OHLCV 캔들',
  portfolio: '포트폴리오',
  multi_asset: '다중 자산',
  returns: '수익률',
  price_series: '가격 시계열',
  composite_portfolio: '종합 포트폴리오',
};

function displayDataType(type: UploadAnalysisResult['type']): string {
  if (!type || type === 'unknown') return '알 수 없음';
  return DATA_TYPE_LABELS[type];
}

const BASE_URL = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL
  || 'http://localhost:8000';

interface UploadViewProps {
  defaultMode?: 'samples' | 'upload';
}

export default function UploadView({ defaultMode = 'samples' }: UploadViewProps) {
  const [mode, setMode] = useState<'samples' | 'upload'>(defaultMode);
  const [samples, setSamples] = useState<UploadSampleMeta[]>([]);
  const [samplesError, setSamplesError] = useState<string | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const latestUploadId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    api.uploadSamples()
      .then((nextSamples) => {
        if (!cancelled) setSamples(nextSamples);
      })
      .catch((caught) => {
        if (!cancelled) setSamplesError(caught instanceof Error ? caught.message : String(caught));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSample = async (sample: UploadSampleMeta) => {
    const uploadId = latestUploadId.current + 1;
    latestUploadId.current = uploadId;
    setActiveSampleId(sample.id);
    setFile(null);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const nextResult = await api.uploadSampleResult(sample.id);
      if (latestUploadId.current === uploadId) setResult(nextResult);
    } catch (caught) {
      if (latestUploadId.current === uploadId) {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    } finally {
      if (latestUploadId.current === uploadId) setLoading(false);
    }
  };

  const handleFile = async (selectedFile: File) => {
    const uploadId = latestUploadId.current + 1;
    latestUploadId.current = uploadId;
    setActiveSampleId(null);
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch(`${BASE_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`업로드 실패: ${response.status}`);
      const nextResult = (await response.json()) as UploadAnalysisResult;
      if (latestUploadId.current === uploadId) setResult(nextResult);
    } catch (caught) {
      if (latestUploadId.current === uploadId) {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    } finally {
      if (latestUploadId.current === uploadId) setLoading(false);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const selectedFile = event.dataTransfer.files[0];
    if (selectedFile) void handleFile(selectedFile);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('samples')}
          className={`rounded-card px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            mode === 'samples' ? 'bg-brand-primary text-white' : 'bg-surface-1 text-text-secondary hover:text-text-primary'
          }`}
        >
          샘플 대시보드
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`rounded-card px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            mode === 'upload' ? 'bg-brand-primary text-white' : 'bg-surface-1 text-text-secondary hover:text-text-primary'
          }`}
        >
          파일 업로드
        </button>
      </div>

      {mode === 'samples' && (
        <div className="card p-6">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h3 className="font-bold">심사용 샘플 대시보드</h3>
              <p className="mt-1 text-sm text-text-secondary">
                각 샘플은 실제 CSV/JSON 업로드와 같은 백엔드 분석 경로로 처리됩니다.
              </p>
            </div>
            <span className="rounded-pill bg-surface-2 px-3 py-1 text-[11px] font-bold uppercase text-text-tertiary">
              CSV / JSON
            </span>
          </div>

          {samplesError && (
            <div className="mb-4 rounded-card border border-negative/30 bg-negative/5 p-3 text-sm text-negative">
              샘플 목록을 불러오지 못했습니다: {samplesError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {samples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => void handleSample(sample)}
                className={`rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  activeSampleId === sample.id
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-border bg-surface-1 hover:border-brand-primary/50'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <PlayCircle size={16} className="text-brand-primary" aria-hidden="true" />
                    {sample.label}
                  </span>
                  <span className="rounded-pill bg-surface-3 px-2 py-1 text-[10px] font-bold uppercase text-text-tertiary">
                    {sample.format}
                  </span>
                </div>
                <div className="mb-2 text-[11px] font-bold uppercase text-brand-primary">
                  {DATA_TYPE_LABELS[sample.data_type]}
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">{sample.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div
          className={`card border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? 'border-brand-primary bg-brand-primary/5' : 'border-border'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <Upload size={48} className="mx-auto mb-4 text-text-tertiary" aria-hidden="true" />
          <h3 className="mb-2 text-lg font-bold">CSV 또는 JSON 투자 데이터 업로드</h3>
          <p className="mx-auto mb-6 max-w-xl text-sm text-text-secondary">
            Glancy가 OHLCV, 포트폴리오, 다중 자산, 수익률, 가격 시계열 데이터를 자동 판별하고
            적합한 시각화 대시보드를 구성합니다.
          </p>
          <label className="btn-primary inline-flex cursor-pointer">
            <input
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];
                if (selectedFile) void handleFile(selectedFile);
              }}
            />
            파일 선택
          </label>
          {file && <div className="mt-3 text-xs text-text-tertiary">선택한 파일: {file.name}</div>}
        </div>
      )}

      <div className="card p-6">
        <h3 className="mb-4 font-bold">지원하는 데이터 유형</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_TYPES.map((type) => (
            <div key={type.key} className="rounded-card bg-surface-1 p-3">
              <div className="mb-1 flex items-center gap-2">
                <FileText size={16} className="text-brand-primary" aria-hidden="true" />
                <span className="text-sm font-bold">{type.label}</span>
              </div>
              <div className="text-xs text-text-tertiary">{type.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card p-8 text-center text-text-secondary">
          {activeSampleId ? '샘플 데이터를 분석하는 중...' : '업로드한 데이터를 분석하는 중...'}
        </div>
      )}

      {error && (
        <div className="card border-negative/30 bg-negative/5 p-6">
          <div className="flex items-center gap-2 text-negative">
            <AlertCircle size={20} aria-hidden="true" />
            <span className="font-bold">업로드 오류</span>
          </div>
          <div className="mt-2 text-sm text-text-secondary">{error}</div>
        </div>
      )}

      {result !== null && (
        <>
          <div className="card p-6">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-positive" aria-hidden="true" />
              <span className="font-bold">감지된 데이터 유형: {displayDataType(result.type)}</span>
            </div>
            <p className="text-sm text-text-secondary">
              원본 JSON보다 먼저, 분석 결과를 설명 가능한 시각화 묶음으로 보여줍니다.
            </p>
          </div>

          {result.type === 'composite_portfolio' ? (
            <CompositePortfolioDashboard result={result} />
          ) : (
            <VisualizationDashboard result={result} />
          )}

          <details className="card p-6">
            <summary className="cursor-pointer font-bold">개발자용 원본 JSON</summary>
            <pre className="mt-4 max-h-96 overflow-auto rounded-card bg-surface-1 p-4 text-xs">
              {JSON.stringify(result, null, 2) ?? ''}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}

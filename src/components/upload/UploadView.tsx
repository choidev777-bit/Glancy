import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Upload } from 'lucide-react';
import type { UploadAnalysisResult } from '../../lib/chart-spec';
import VisualizationDashboard from '../visualization/VisualizationDashboard';

const SUPPORTED_TYPES = [
  { key: 'OHLCV', label: 'OHLCV candles', desc: 'Date, Open, High, Low, Close, Volume columns' },
  { key: 'portfolio', label: 'Portfolio weights', desc: 'Ticker and Weight columns' },
  { key: 'multi_asset', label: 'Multi-asset comparison', desc: 'Date plus multiple asset price columns' },
  { key: 'returns', label: 'Return series', desc: 'Date and Return columns' },
  { key: 'price_series', label: 'Price series', desc: 'Date and Close columns' },
];

const BASE_URL = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL
  || 'http://localhost:8000';

export default function UploadView() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const latestUploadId = useRef(0);

  const handleFile = async (selectedFile: File) => {
    const uploadId = latestUploadId.current + 1;
    latestUploadId.current = uploadId;
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
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
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
        <Upload size={48} className="mx-auto mb-4 text-text-tertiary" />
        <h3 className="mb-2 text-lg font-bold">Upload CSV or JSON investment data</h3>
        <p className="mx-auto mb-6 max-w-xl text-sm text-text-secondary">
          Glancy auto-detects OHLCV, portfolio, multi-asset, returns, and price-series data, then prepares the right
          visualization path for the judges.
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
          Choose File
        </label>
        {file && <div className="mt-3 text-xs text-text-tertiary">Selected: {file.name}</div>}
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-bold">Supported Data Shapes</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_TYPES.map((type) => (
            <div key={type.key} className="rounded-card bg-surface-1 p-3">
              <div className="mb-1 flex items-center gap-2">
                <FileText size={16} className="text-brand-primary" />
                <span className="text-sm font-bold">{type.label}</span>
              </div>
              <div className="text-xs text-text-tertiary">{type.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {loading && <div className="card p-8 text-center text-text-secondary">Analyzing uploaded data...</div>}

      {error && (
        <div className="card border-negative/30 bg-negative/5 p-6">
          <div className="flex items-center gap-2 text-negative">
            <AlertCircle size={20} />
            <span className="font-bold">Upload Error</span>
          </div>
          <div className="mt-2 text-sm text-text-secondary">{error}</div>
        </div>
      )}

      {result !== null && (
        <>
          <div className="card p-6">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-positive" />
              <span className="font-bold">Detected type: {result.type}</span>
            </div>
            <p className="text-sm text-text-secondary">
              The upload result is rendered as an explainable visualization bundle before raw JSON.
            </p>
          </div>

          <VisualizationDashboard result={result} />

          <details className="card p-6">
            <summary className="cursor-pointer font-bold">Developer raw JSON</summary>
            <pre className="mt-4 max-h-96 overflow-auto rounded-card bg-surface-1 p-4 text-xs">
              {JSON.stringify(result, null, 2) ?? ''}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}

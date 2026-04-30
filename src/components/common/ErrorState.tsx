import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = '데이터를 불러오는 중 문제가 발생했습니다.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="card p-8 text-center">
      <AlertCircle size={32} className="mx-auto mb-3 text-negative" />
      <p className="mb-4 text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw size={16} />
          다시 시도
        </button>
      )}
    </div>
  );
}

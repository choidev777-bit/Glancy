import { CheckCircle2, Clock3, DatabaseBackup } from 'lucide-react';
import type { MarketDataMeta } from '../../lib/api';

interface DataStatusBadgeProps {
  meta?: MarketDataMeta;
}

export default function DataStatusBadge({ meta }: DataStatusBadgeProps) {
  const status = meta?.data_status ?? 'live';
  const source = meta?.source_name;

  if (source === 'kiwoom') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-positive/15 px-2 py-1 text-xs text-positive">
        <CheckCircle2 size={13} />
        키움 현재가
      </span>
    );
  }

  if (source === 'binance') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-positive/15 px-2 py-1 text-xs text-positive">
        <CheckCircle2 size={13} />
        Binance 실시간
      </span>
    );
  }

  if (status === 'sample') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-pill bg-warning/15 px-2 py-1 text-xs text-warning"
        title={meta?.fallback_reason ?? '외부 API 실패로 샘플 fallback 데이터를 사용 중입니다.'}
      >
        <DatabaseBackup size={13} />
        샘플 데이터
      </span>
    );
  }

  if (status === 'unavailable') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-pill bg-warning/15 px-2 py-1 text-xs text-warning"
        title={meta?.fallback_reason ?? '현재가 API 연결이 실패했습니다.'}
      >
        <DatabaseBackup size={13} />
        현재가 연결 실패
      </span>
    );
  }

  if (status === 'cached') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-info/15 px-2 py-1 text-xs text-info">
        <Clock3 size={13} />
        캐시 데이터
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-info/15 px-2 py-1 text-xs text-info">
      <Clock3 size={13} />
      일봉/지연 데이터
    </span>
  );
}

import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = '표시할 데이터가 없습니다.' }: EmptyStateProps) {
  return (
    <div className="card p-12 text-center">
      <Inbox size={32} className="mx-auto mb-3 text-text-tertiary" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}

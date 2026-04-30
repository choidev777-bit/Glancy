import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SignalBadgeProps {
  signal: string;
  className?: string;
}

const SignalBadge: React.FC<SignalBadgeProps> = ({ signal, className }) => {
  const normalized = signal.toLowerCase();
  const styles = (() => {
    if (signal.includes('강한 매수') || normalized.includes('strong buy')) return 'bg-positive-bright text-[#0a0a0a]';
    if (signal.includes('매수') || normalized.includes('buy')) {
      return 'border border-positive/30 bg-positive/15 text-positive';
    }
    if (signal.includes('강한 매도') || normalized.includes('strong sell')) return 'bg-negative-bright text-[#fafafa]';
    if (signal.includes('매도') || normalized.includes('sell')) {
      return 'border border-negative/30 bg-negative/15 text-negative';
    }
    if (signal.includes('과매수') || normalized.includes('overbought')) {
      return 'border border-warning/30 bg-warning/15 text-warning';
    }
    if (signal.includes('과매도') || normalized.includes('oversold')) {
      return 'border border-info/30 bg-info/15 text-info';
    }
    return 'bg-surface-3 text-text-secondary';
  })();

  return (
    <span
      className={cn(
        'inline-flex min-w-[50px] items-center justify-center rounded-tag px-2 py-0.5 text-[11px] font-semibold',
        styles,
        className,
      )}
    >
      {signal}
    </span>
  );
};

export default SignalBadge;

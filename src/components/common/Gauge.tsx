import React from 'react';

interface GaugeProps {
  score: number; // 0 to 100
  label?: string;
  title?: string;
  size?: number;
}

const Gauge: React.FC<GaugeProps> = ({ score, label, title, size = 200 }) => {
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = () => {
    if (score >= 80) return 'var(--positive-bright)';
    if (score >= 60) return 'var(--positive)';
    if (score >= 40) return 'var(--neutral)';
    if (score >= 20) return 'var(--negative)';
    return 'var(--negative-bright)';
  };

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      {title && <h4 className="text-text-secondary text-sm font-semibold mb-4">{title}</h4>}
      <div className="relative" style={{ width: size, height: size * 0.55 }}>
        <svg width={size} height={size * 0.55} viewBox="0 0 200 110">
          <path
            d="M 20,100 A 80,80 0 0 1 180,100"
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 20,100 A 80,80 0 0 1 180,100"
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          {label && (
            <span className="text-base font-bold" style={{ color: getStrokeColor() }}>
              {label}
            </span>
          )}
          <span className="mt-0.5 font-mono text-xs text-text-tertiary">{score}%</span>
        </div>
      </div>
    </div>
  );
};

export default Gauge;

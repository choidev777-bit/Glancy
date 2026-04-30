interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({ width = '100%', height = '20px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-card bg-surface-3 ${className}`}
      style={{ width, height }}
    />
  );
}

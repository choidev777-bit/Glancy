import { RotateCcw, Wand2 } from 'lucide-react';

interface RuntimeApplyBarProps {
  onApply: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export default function RuntimeApplyBar({ onApply, onReset, disabled = false }: RuntimeApplyBarProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={onReset} className="btn-secondary inline-flex items-center gap-2">
        <RotateCcw size={16} />
        Reset
      </button>
      <button type="button" onClick={onApply} disabled={disabled} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
        <Wand2 size={16} />
        Apply Skills
      </button>
    </div>
  );
}

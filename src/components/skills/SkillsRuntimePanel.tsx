import { useState } from 'react';
import { FileCode2 } from 'lucide-react';
import { ParsedSkillsRuntime } from '../../lib/skills-parser';
import { useSkillsRuntime } from '../../hooks/useSkillsRuntime';
import RuntimeApplyBar from './RuntimeApplyBar';
import RuntimeDiff from './RuntimeDiff';
import SkillsEditor from './SkillsEditor';

interface SkillsRuntimePanelProps {
  onRuntimeChange: (runtime: ParsedSkillsRuntime) => void;
}

const PRESETS = {
  Conservative: {
    find: ['rsi_overbought: 70', 'rsi_oversold: 30', 'brand_primary: "#06b6d4"'],
    replace: ['rsi_overbought: 75', 'rsi_oversold: 25', 'brand_primary: "#38bdf8"'],
  },
  Aggressive: {
    find: ['rsi_overbought: 70', 'rsi_oversold: 30', 'brand_primary: "#06b6d4"'],
    replace: ['rsi_overbought: 60', 'rsi_oversold: 40', 'brand_primary: "#f97316"'],
  },
  'High Contrast': {
    find: ['positive: "#22c55e"', 'negative: "#ef4444"', 'brand_primary: "#06b6d4"'],
    replace: ['positive: "#00ffaa"', 'negative: "#ff3366"', 'brand_primary: "#ffcc00"'],
  },
};

export default function SkillsRuntimePanel({ onRuntimeChange }: SkillsRuntimePanelProps) {
  const { markdown, setMarkdown, runtime, apply, reset } = useSkillsRuntime();
  const [open, setOpen] = useState(false);

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    const preset = PRESETS[presetName];
    let next = markdown;
    preset.find.forEach((target, index) => {
      next = next.replace(target, preset.replace[index]);
    });
    setMarkdown(next);
  };

  const handleApply = () => {
    const parsed = apply(markdown);
    onRuntimeChange(parsed);
  };

  return (
    <section className="card border-brand-primary/20 bg-surface-2">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-bold">
          <FileCode2 size={16} />
          Skills Runtime Demo
        </span>
        <span className="text-xs text-text-tertiary">Markdown {'->'} parser {'->'} dashboard state</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((name) => (
              <button key={name} type="button" onClick={() => applyPreset(name)} className="rounded-pill border border-border px-3 py-1 text-xs font-bold text-text-secondary hover:text-text-primary">
                {name}
              </button>
            ))}
          </div>

          <SkillsEditor markdown={markdown} onChange={setMarkdown} />

          {runtime.warnings.length > 0 && (
            <div className="rounded-card border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              {runtime.warnings.join(' ')}
            </div>
          )}

          <RuntimeDiff runtime={runtime} />
          <RuntimeApplyBar onApply={handleApply} onReset={reset} disabled={runtime.warnings.length > 0} />
        </div>
      )}
    </section>
  );
}

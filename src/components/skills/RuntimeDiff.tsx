import type { ParsedSkillsRuntime } from '../../lib/skills-parser';

interface RuntimeDiffProps {
  runtime: ParsedSkillsRuntime;
}

export default function RuntimeDiff({ runtime }: RuntimeDiffProps) {
  return (
    <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
      <div>
        <div className="mb-1 font-bold text-text-secondary">Indicator Params</div>
        <pre className="max-h-52 overflow-auto rounded-card bg-surface-1 p-3 font-mono">
          {JSON.stringify(runtime.indicators, null, 2)}
        </pre>
      </div>
      <div>
        <div className="mb-1 font-bold text-text-secondary">Theme Tokens</div>
        <pre className="max-h-52 overflow-auto rounded-card bg-surface-1 p-3 font-mono">
          {JSON.stringify(runtime.theme, null, 2)}
        </pre>
      </div>
    </div>
  );
}

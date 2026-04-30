interface SkillsEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export default function SkillsEditor({ markdown, onChange }: SkillsEditorProps) {
  return (
    <textarea
      value={markdown}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-[300px] w-full rounded-card border border-border bg-surface-1 p-3 font-mono text-xs text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
      spellCheck={false}
    />
  );
}

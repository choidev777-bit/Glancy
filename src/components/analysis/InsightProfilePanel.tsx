import { AlertTriangle, CheckCircle2, Eye, ListChecks } from 'lucide-react';
import type { InsightProfile, InsightSection } from '../../lib/api';

interface InsightProfilePanelProps {
  profile?: InsightProfile | null;
  fallback?: string;
  title?: string;
}

const stanceLabels: Record<InsightProfile['stance'], string> = {
  bullish: '긍정',
  neutral: '중립',
  bearish: '주의',
  mixed: '혼재',
  watch: '관찰',
};

function toneClass(tone: InsightSection['tone']) {
  if (tone === 'positive') return 'border-positive/25 bg-positive/5';
  if (tone === 'negative') return 'border-negative/25 bg-negative/5';
  if (tone === 'warning') return 'border-warning/25 bg-warning/5';
  return 'border-border bg-surface-1';
}

function stanceClass(stance: InsightProfile['stance']) {
  if (stance === 'bullish') return 'bg-positive/15 text-positive';
  if (stance === 'bearish') return 'bg-negative/15 text-negative';
  if (stance === 'mixed' || stance === 'watch') return 'bg-warning/15 text-warning';
  return 'bg-info/15 text-info';
}

export default function InsightProfilePanel({ profile, fallback, title = '인사이트' }: InsightProfilePanelProps) {
  if (!profile) {
    if (!fallback) return null;
    return (
      <section className="card border-info/20 bg-info/5 p-5">
        <h3 className="mb-2 font-bold text-text-primary">{title}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{fallback}</p>
      </section>
    );
  }

  return (
    <section className="card space-y-5 border-brand-primary/20 bg-surface-2 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="text-[11px] font-bold uppercase text-brand-primary">{title}</div>
          <h3 className="mt-1 text-lg font-bold leading-snug text-text-primary">{profile.headline}</h3>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <span className={`rounded-pill px-3 py-1 text-xs font-bold ${stanceClass(profile.stance)}`}>
            {stanceLabels[profile.stance]}
          </span>
          <span className="rounded-pill bg-surface-3 px-3 py-1 text-xs font-bold text-text-secondary">
            신뢰도 {Math.round(profile.confidence)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {profile.sections.map((section) => (
          <div key={section.id} className={`rounded-card border p-4 ${toneClass(section.tone)}`}>
            <div className="mb-2 flex items-center gap-2">
              <Eye size={15} className="text-brand-primary" aria-hidden="true" />
              <h4 className="text-sm font-bold text-text-primary">{section.title}</h4>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-text-secondary">{section.summary}</p>
            <div className="grid gap-2">
              {section.evidence.slice(0, 3).map((item) => (
                <div key={`${section.id}-${item.label}`} className="rounded-card bg-surface-1 p-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] text-text-tertiary">{item.label}</span>
                    <span className="font-mono text-xs font-bold">{item.value}</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-text-secondary">{item.interpretation}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(profile.conflicts.length > 0 || profile.nextChecks.length > 0 || profile.dataQuality.length > 0) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {profile.conflicts.length > 0 && (
            <InsightList icon="warning" title="상충 신호" items={profile.conflicts} />
          )}
          {profile.nextChecks.length > 0 && (
            <InsightList icon="check" title="다음 확인" items={profile.nextChecks} />
          )}
          {profile.dataQuality.length > 0 && (
            <InsightList icon="warning" title="데이터 품질" items={profile.dataQuality} />
          )}
        </div>
      )}
    </section>
  );
}

function InsightList({ icon, title, items }: { icon: 'warning' | 'check'; title: string; items: string[] }) {
  const Icon = icon === 'warning' ? AlertTriangle : ListChecks;
  return (
    <div className="rounded-card border border-border bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={15} className={icon === 'warning' ? 'text-warning' : 'text-brand-primary'} aria-hidden="true" />
        <h4 className="text-sm font-bold">{title}</h4>
      </div>
      <ul className="space-y-2 text-xs leading-relaxed text-text-secondary">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-text-tertiary" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

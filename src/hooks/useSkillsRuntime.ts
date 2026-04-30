import { useEffect, useState } from 'react';
import { ParsedSkillsRuntime, parseSkillsRuntime } from '../lib/skills-parser';

const DEFAULT_RUNTIME: ParsedSkillsRuntime = {
  indicators: {},
  theme: {},
  warnings: [],
};

export function useSkillsRuntime() {
  const [markdown, setMarkdown] = useState('');
  const [runtime, setRuntime] = useState<ParsedSkillsRuntime>(DEFAULT_RUNTIME);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch('/skills/indicators.md').then((response) => response.text()), fetch('/skills/theme.md').then((response) => response.text())])
      .then(([indicatorsMd, themeMd]) => {
        if (cancelled) return;
        const merged = `${indicatorsMd}\n\n${themeMd}`;
        setMarkdown(merged);
        setRuntime(parseSkillsRuntime(merged));
      })
      .catch(() => {
        if (!cancelled) setRuntime({ ...DEFAULT_RUNTIME, warnings: ['Unable to load public Skills presets.'] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const apply = (nextMarkdown: string) => {
    setMarkdown(nextMarkdown);
    const parsed = parseSkillsRuntime(nextMarkdown);
    setRuntime(parsed);
    applyThemeTokens(parsed.theme);
    return parsed;
  };

  const reset = () => {
    window.location.reload();
  };

  return { markdown, setMarkdown, runtime, apply, reset };
}

function applyThemeTokens(theme: ParsedSkillsRuntime['theme']) {
  const root = document.documentElement;
  if (theme.brand_primary) root.style.setProperty('--brand-primary', theme.brand_primary);
  if (theme.positive) root.style.setProperty('--positive', theme.positive);
  if (theme.negative) root.style.setProperty('--negative', theme.negative);
  if (theme.warning) root.style.setProperty('--warning', theme.warning);
  if (theme.info) root.style.setProperty('--info', theme.info);
}

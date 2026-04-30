# Plan 11 — Skills Runtime Demo

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `skills/theme.md` 또는 `skills/indicators.md`를 수정하면 대시보드의 UI/지표/인사이트가 즉시 바뀌는 화면을 구현한다. 이는 "Skills.md가 단순 문서가 아니라 런타임 설정 파일"이라는 핵심 차별점을 심사자가 직접 확인하는 데모다.

**Architecture:** 프론트에 Skills Runtime 패널을 추가한다. 기본 Skills preset은 `public/skills/*.md`에서 로드하고, 사용자가 패널에서 markdown 내용을 편집하면 lightweight parser가 토큰/파라미터를 추출하여 앱 상태에 반영한다. 백엔드 지표 계산은 query params 또는 POST body params로 오버라이드한다.

**Tech Stack:** React 18 / TypeScript / Markdown text parser / CSS variables / backend indicator params

**예상 소요:** 5~7시간

---

## File Structure

```
public/
└── skills/
    ├── theme.md
    └── indicators.md

src/
├── lib/
│   ├── skills-parser.ts
│   └── skills-presets.ts
├── hooks/
│   └── useSkillsRuntime.ts
└── components/
    └── skills/
        ├── SkillsRuntimePanel.tsx
        ├── SkillsEditor.tsx
        ├── RuntimeDiff.tsx
        └── RuntimeApplyBar.tsx

backend/app/routers/
└── indicators.py  # params override support
```

---

## Tasks

### Task 1: public Skills preset 복사

**Files:**
- Create: `public/skills/theme.md`
- Create: `public/skills/indicators.md`

- [ ] **Step 1: 제출용 Skills 문서 중 데모 대상 복사**

`skills/theme.md`, `skills/indicators.md`가 생성된 뒤 `public/skills/`로 복사한다.

- [ ] **Step 2: 데모 전용 주석 추가**

각 파일 상단에 다음 형식을 추가한다.

```markdown
<!-- runtime-demo: true -->
<!-- editable-fields: rsi_period,rsi_overbought,rsi_oversold,brand_primary,positive,negative -->
```

- [ ] **Step 3: 커밋**

```bash
git add public/skills/
git commit -m "feat(skills): expose theme and indicators presets for runtime demo"
```

---

### Task 2: Skills markdown parser 구현

**Files:**
- Create: `src/lib/skills-parser.ts`

- [ ] **Step 1: parser 작성**

```typescript
export interface RuntimeIndicatorParams {
  rsi_period?: number;
  rsi_overbought?: number;
  rsi_oversold?: number;
  macd_fast?: number;
  macd_slow?: number;
  macd_signal?: number;
  bb_period?: number;
  bb_std?: number;
}

export interface RuntimeThemeTokens {
  brand_primary?: string;
  positive?: string;
  negative?: string;
  warning?: string;
  info?: string;
}

export interface ParsedSkillsRuntime {
  indicators: RuntimeIndicatorParams;
  theme: RuntimeThemeTokens;
  warnings: string[];
}

const NUMBER_PATTERNS: Array<[keyof RuntimeIndicatorParams, RegExp]> = [
  ["rsi_period", /rsi[_\s-]*period\s*[:=]\s*(\d+)/i],
  ["rsi_overbought", /rsi[_\s-]*overbought\s*[:=]\s*(\d+)/i],
  ["rsi_oversold", /rsi[_\s-]*oversold\s*[:=]\s*(\d+)/i],
  ["macd_fast", /macd[_\s-]*fast\s*[:=]\s*(\d+)/i],
  ["macd_slow", /macd[_\s-]*slow\s*[:=]\s*(\d+)/i],
  ["macd_signal", /macd[_\s-]*signal\s*[:=]\s*(\d+)/i],
  ["bb_period", /bb[_\s-]*period\s*[:=]\s*(\d+)/i],
  ["bb_std", /bb[_\s-]*std\s*[:=]\s*(\d+(?:\.\d+)?)/i],
];

const COLOR_PATTERNS: Array<[keyof RuntimeThemeTokens, RegExp]> = [
  ["brand_primary", /brand[_\s-]*primary\s*[:=]\s*(#[0-9a-f]{6})/i],
  ["positive", /positive\s*[:=]\s*(#[0-9a-f]{6})/i],
  ["negative", /negative\s*[:=]\s*(#[0-9a-f]{6})/i],
  ["warning", /warning\s*[:=]\s*(#[0-9a-f]{6})/i],
  ["info", /info\s*[:=]\s*(#[0-9a-f]{6})/i],
];

export function parseSkillsRuntime(markdown: string): ParsedSkillsRuntime {
  const indicators: RuntimeIndicatorParams = {};
  const theme: RuntimeThemeTokens = {};
  const warnings: string[] = [];

  for (const [key, pattern] of NUMBER_PATTERNS) {
    const match = markdown.match(pattern);
    if (match) indicators[key] = Number(match[1]);
  }

  for (const [key, pattern] of COLOR_PATTERNS) {
    const match = markdown.match(pattern);
    if (match) theme[key] = match[1];
  }

  if (indicators.rsi_oversold && indicators.rsi_overbought && indicators.rsi_oversold >= indicators.rsi_overbought) {
    warnings.push("RSI oversold must be lower than overbought.");
  }

  return { indicators, theme, warnings };
}
```

- [ ] **Step 2: parser 테스트 작성**

`src/lib/skills-parser.test.ts` 또는 기존 테스트 도구가 없다면 수동 QA 체크리스트에 포함한다.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/skills-parser.ts
git commit -m "feat(skills): parse runtime settings from markdown"
```

---

### Task 3: runtime hook 구현

**Files:**
- Create: `src/hooks/useSkillsRuntime.ts`

- [ ] **Step 1: hook 작성**

```tsx
import { useEffect, useState } from "react";
import { parseSkillsRuntime, ParsedSkillsRuntime } from "../lib/skills-parser";

const DEFAULT_RUNTIME: ParsedSkillsRuntime = {
  indicators: {},
  theme: {},
  warnings: [],
};

export function useSkillsRuntime() {
  const [markdown, setMarkdown] = useState("");
  const [runtime, setRuntime] = useState<ParsedSkillsRuntime>(DEFAULT_RUNTIME);

  useEffect(() => {
    Promise.all([
      fetch("/skills/indicators.md").then((r) => r.text()),
      fetch("/skills/theme.md").then((r) => r.text()),
    ]).then(([indicatorsMd, themeMd]) => {
      const merged = `${indicatorsMd}\n\n${themeMd}`;
      setMarkdown(merged);
      setRuntime(parseSkillsRuntime(merged));
    });
  }, []);

  const apply = (nextMarkdown: string) => {
    setMarkdown(nextMarkdown);
    const parsed = parseSkillsRuntime(nextMarkdown);
    setRuntime(parsed);
    applyThemeTokens(parsed.theme);
  };

  const reset = () => {
    window.location.reload();
  };

  return { markdown, setMarkdown, runtime, apply, reset };
}

function applyThemeTokens(theme: ParsedSkillsRuntime["theme"]) {
  const root = document.documentElement;
  if (theme.brand_primary) root.style.setProperty("--brand-primary", theme.brand_primary);
  if (theme.positive) root.style.setProperty("--positive", theme.positive);
  if (theme.negative) root.style.setProperty("--negative", theme.negative);
  if (theme.warning) root.style.setProperty("--warning", theme.warning);
  if (theme.info) root.style.setProperty("--info", theme.info);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useSkillsRuntime.ts
git commit -m "feat(skills): runtime hook for editable Skills.md"
```

---

### Task 4: Skills Runtime 패널 UI

**Files:**
- Create: `src/components/skills/SkillsRuntimePanel.tsx`
- Create: `src/components/skills/SkillsEditor.tsx`
- Create: `src/components/skills/RuntimeDiff.tsx`
- Create: `src/components/skills/RuntimeApplyBar.tsx`

- [ ] **Step 1: 패널 구성**

패널은 기술적 분석 화면 오른쪽 또는 하단에 배치한다.

Required controls:
- indicators.md / theme.md 편집 textarea
- 빠른 preset 버튼: Conservative / Aggressive / High Contrast
- Apply 버튼
- Reset 버튼
- parsed params preview
- warnings 표시

- [ ] **Step 2: `SkillsRuntimePanel.tsx` 작성**

```tsx
import { useState } from "react";
import { FileCode2, RotateCcw, Wand2 } from "lucide-react";
import { useSkillsRuntime } from "../../hooks/useSkillsRuntime";

interface Props {
  onRuntimeChange: (runtime: ReturnType<typeof useSkillsRuntime>["runtime"]) => void;
}

export default function SkillsRuntimePanel({ onRuntimeChange }: Props) {
  const { markdown, setMarkdown, runtime, apply, reset } = useSkillsRuntime();
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    apply(markdown);
    onRuntimeChange(runtime);
  };

  return (
    <section className="border border-border bg-surface-2 rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 font-bold text-sm">
          <FileCode2 size={16} />
          Skills Runtime Demo
        </span>
        <span className="text-xs text-text-tertiary">Markdown -> dashboard</span>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full min-h-[260px] bg-surface-1 border border-border rounded-card p-3 font-mono text-xs"
            spellCheck={false}
          />

          {runtime.warnings.length > 0 && (
            <div className="text-xs text-warning">
              {runtime.warnings.join(" ")}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <pre className="bg-surface-1 p-3 rounded-card overflow-auto">{JSON.stringify(runtime.indicators, null, 2)}</pre>
            <pre className="bg-surface-1 p-3 rounded-card overflow-auto">{JSON.stringify(runtime.theme, null, 2)}</pre>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={reset} className="btn-secondary inline-flex items-center gap-2">
              <RotateCcw size={16} />
              Reset
            </button>
            <button type="button" onClick={handleApply} className="btn-primary inline-flex items-center gap-2">
              <Wand2 size={16} />
              Apply Skills
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/skills/
git commit -m "feat(skills): add runtime demo panel"
```

---

### Task 5: indicators API에 runtime params 연결

**Files:**
- Modify: `backend/app/routers/indicators.py`
- Modify: `src/lib/api.ts`
- Modify: `src/hooks/useIndicatorsData.ts`

- [ ] **Step 1: backend query params 추가**

`/indicators/...` endpoint에서 다음 query params를 받아 `compute_all(data, params=params)`로 전달한다.

```python
rsi_period: int = 14
rsi_overbought: float = 70
rsi_oversold: float = 30
macd_fast: int = 12
macd_slow: int = 26
macd_signal: int = 9
bb_period: int = 20
bb_std: float = 2.0
```

- [ ] **Step 2: frontend API client params 지원**

`api.indicators.kr/us/crypto`가 `runtimeParams`를 받아 query string에 포함한다.

- [ ] **Step 3: TechnicalView에서 RuntimePanel 연결**

`SkillsRuntimePanel`이 apply되면 indicators hook refetch가 발생해야 한다.

- [ ] **Step 4: 커밋**

```bash
git add backend/app/routers/indicators.py src/lib/api.ts src/hooks/useIndicatorsData.ts src/components/analysis/TechnicalView.tsx
git commit -m "feat(skills): apply runtime indicator params to analysis"
```

---

### Task 6: 데모 검증

**Files:**
- Modify: `docs/deployment/qa-checklist.md`

- [ ] **Step 1: 수동 검증 항목 추가**

```markdown
## Skills Runtime Demo
- [ ] RSI overbought 70 -> 60 변경 시 RSI signal/insight가 바뀐다
- [ ] brand_primary 색상 변경 시 활성 탭/차트 accent가 바뀐다
- [ ] Reset으로 원래 theme과 indicator params가 복구된다
- [ ] 잘못된 RSI threshold에서 warning이 표시된다
```

- [ ] **Step 2: 커밋**

```bash
git add docs/deployment/qa-checklist.md
git commit -m "docs(qa): add Skills Runtime Demo checks"
```

---

## Self-Review

- [ ] markdown을 실제 런타임 입력으로 사용하고 있는가?
- [ ] theme.md 변경이 CSS variable 또는 chart theme에 반영되는가?
- [ ] indicators.md 변경이 backend 계산에 반영되는가?
- [ ] 심사자가 30초 안에 변화를 확인할 수 있는가?
- [ ] Reset이 안정적으로 작동하는가?

## 완료 조건

심사자가 `Skills Runtime Demo` 패널에서 RSI 기준 또는 brand color를 수정하고 `Apply Skills`를 눌렀을 때, 게이지/인사이트/차트 스타일이 즉시 변화한다.

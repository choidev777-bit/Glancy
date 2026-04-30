# Prompt Log

This is a summarized prompt log. It avoids private chain-of-thought and instead records the user-visible prompt intent, context, and resulting artifacts.

## 1. Brainstorming

**Tooling context:** Claude Code with Superpowers brainstorming and planning skills, later Codex implementation sessions.

**Input context:** Hackathon page, evaluation goals, investment dashboard concept, need for Skills-based evidence.

**Prompt summary:**

> Design a Skills-based investment data visualization dashboard that can compete for first place. Treat `Skills.md` as more than documentation: it should drive data, indicators, insights, charts, layout, theme, and demo behavior.

**Output artifacts:**

- `HACKATHON_DESIGN.md`
- `DESIGN.md`
- `docs/superpowers/plans/00-master-plan.md`

## 2. Writing Plans

**Prompt summary:**

> Split the hackathon implementation into executable plans. Each plan should include file structure, tasks, tests, completion criteria, and how it maps to judging criteria.

**Output artifacts:**

- `docs/superpowers/plans/01-proposal-pdf.md`
- `docs/superpowers/plans/02-skills-md-modules.md`
- `docs/superpowers/plans/03-data-layer.md`
- `docs/superpowers/plans/04-indicators-engine.md`
- `docs/superpowers/plans/05-insights-engine.md`
- `docs/superpowers/plans/06-fundamental-data.md`
- `docs/superpowers/plans/07-csv-upload.md`
- `docs/superpowers/plans/08-chart-integration.md`
- `docs/superpowers/plans/09-ui-polish.md`
- `docs/superpowers/plans/10-deployment-qa.md`
- `docs/superpowers/plans/11-skills-runtime-demo.md`
- `docs/superpowers/plans/12-vibe-coding-evidence.md`
- `docs/superpowers/plans/13-demo-reliability-layer.md`
- `docs/superpowers/plans/14-visualization-intelligence.md`

## 3. Codex Implementation Sessions

**Prompt summary pattern:**

> Implement one plan per conversation. Follow the written plan, use TDD where possible, verify with tests/builds, and report exactly what passed.

**Implemented plan batches:**

| Plan | Prompt intent | Output |
| --- | --- | --- |
| 01 | Build proposal package | `docs/proposal/proposal.md`, `.html`, `.pdf` |
| 02 | Generate Skills modules | `skills/*.md`, `skills.zip` |
| 03-07 | Build backend data/indicator/insight/fundamental/upload foundation | `backend/app/*`, backend tests |
| 08 | Integrate charts | `src/components/charts/*`, `src/lib/api.ts` |
| 09 | Polish UI | upload UI, mobile search, common states, clean copy |
| 10 | Prepare deployment QA | `vercel.json`, `backend/railway.json`, `docs/deployment/*` |
| 11 | Implement runtime Skills demo | `public/skills/*`, `src/components/skills/*`, parser, hook, API params |
| 12 | Package vibe coding evidence | `docs/evidence/*`, `docs/submission.md` |

## 4. Verification Prompts

**Prompt summary:**

> Before claiming completion, run fresh verification. Report exact test/build outcomes and disclose any warnings or limitations.

**Verification commands used across sessions:**

- `npm run build`
- `node tests/plan08-market-selection.test.mjs`
- `node tests/plan09-ui-polish.test.mjs`
- `node tests/plan10-deployment-qa.test.mjs`
- `node tests/plan11-skills-runtime.test.mjs`
- `backend/.venv/Scripts/python.exe -m pytest ...`

## 5. Safety Notes

- The evidence is a summarized log, not a verbatim transcript.
- It is intended to help judges inspect the workflow without exposing irrelevant private reasoning.
- The traceability matrix is the primary proof artifact.

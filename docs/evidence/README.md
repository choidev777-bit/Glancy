# Glancy Vibe Coding Evidence

This folder is the evidence package for Glancy's Skills-driven vibe coding workflow. It shows that `skills/*.md` files are not decorative documentation; they act as the design, data, indicator, chart, layout, and theme rules used to generate and refine the dashboard.

## Core Claims

1. `skills/*.md` defines executable product rules for data normalization, indicators, insights, charts, layout, and theme behavior.
2. The implementation can be traced from each Skills module to concrete backend, frontend, and documentation artifacts.
3. The Skills Runtime Demo proves that parts of `theme.md` and `indicators.md` can change dashboard behavior at runtime.
4. The project can be rebuilt from the Skills package by following the documented prompt order.

## Evidence Index

| Document | Purpose |
| --- | --- |
| `skills-to-code-matrix.md` | Maps each Skills module to implemented files and user-visible proof. |
| `prompt-log.md` | Summarizes the vibe coding prompt flow used to move from idea to plans to implementation. |
| `rebuild-from-skills.md` | Describes how another builder could recreate the project from `skills/*.md`. |
| `generated-artifacts.md` | Lists major generated and refined artifacts across backend, frontend, docs, and deployment. |

## Runtime Proof

The `Skills Runtime Demo` in the technical analysis screen loads editable public presets from:

- `public/skills/indicators.md`
- `public/skills/theme.md`

Changing RSI/MACD/Bollinger parameters updates indicator API query params. Changing theme tokens updates CSS variables in the running dashboard. This is the clearest judge-facing proof that Skills files behave like runtime rules, not just static documentation.

## Reviewer Path

1. Open `skills-to-code-matrix.md`.
2. Open the app and visit `기술적 분석`.
3. Expand `Skills Runtime Demo`.
4. Apply `Aggressive` or `High Contrast`.
5. Confirm the parsed params/theme preview changes and the dashboard responds.

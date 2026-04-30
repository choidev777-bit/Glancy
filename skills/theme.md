# theme.md — Design Token Layer

## 1. Visual Direction

Glancy uses a dark financial workstation style: dense, precise, and data-first. The dashboard should feel like a professional analysis surface rather than a marketing page.

## 2. Typography

| Role | Font |
|------|------|
| UI/body | Pretendard, Inter, sans-serif |
| Numbers | JetBrains Mono, SF Mono, Consolas, monospace |

Numbers should use tabular figures where possible.

## 3. Dark Theme Tokens

```yaml
page_background: "#0a0a0a"
surface_1: "#121212"
surface_2: "#1a1a1a"
surface_3: "#222222"
surface_4: "#2a2a2a"

text_primary: "#fafafa"
text_secondary: "#a3a3a3"
text_tertiary: "#737373"
text_disabled: "#525252"

brand_primary: "#06b6d4"
brand_secondary: "#0891b2"

positive: "#22c55e"
positive_bright: "#4ade80"
negative: "#ef4444"
negative_bright: "#f87171"
neutral: "#a3a3a3"
warning: "#f59e0b"
info: "#3b82f6"

border_default: "#262626"
border_subtle: "#1f1f1f"
border_strong: "#404040"
```

## 4. Light Theme Tokens

```yaml
page_background: "#fafafa"
surface_1: "#ffffff"
surface_2: "#f5f5f5"
surface_3: "#e5e5e5"
surface_4: "#d4d4d4"

text_primary: "#0a0a0a"
text_secondary: "#525252"
text_tertiary: "#737373"
text_disabled: "#a3a3a3"

brand_primary: "#0891b2"
brand_secondary: "#0e7490"

positive: "#16a34a"
positive_bright: "#15803d"
negative: "#dc2626"
negative_bright: "#b91c1c"
neutral: "#737373"
warning: "#d97706"
info: "#2563eb"

border_default: "#e5e5e5"
border_subtle: "#f0f0f0"
border_strong: "#a3a3a3"
```

## 5. Chart Series Tokens

```yaml
chart_1: "#06b6d4"
chart_2: "#a855f7"
chart_3: "#f59e0b"
chart_4: "#ec4899"
chart_5: "#10b981"
chart_6: "#8b5cf6"
chart_7: "#f97316"
chart_8: "#14b8a6"
```

Use chart series colors for identity, not financial direction. Use positive/negative only for direction, profit/loss, buy/sell, and heatmap polarity.

## 6. Component Geometry

| Component | Radius |
|-----------|--------|
| Cards | 8px |
| Chart panels | 6px |
| Pills/badges | 9999px |
| Dialogs | 16px |

Spacing:
- dashboard outer padding: 24px desktop, 16px mobile
- card padding: 16-24px
- dense tables: 8-12px cell padding

## 7. Runtime Editable Tokens

The Skills Runtime Demo may edit:

```yaml
brand_primary: "#06b6d4"
positive: "#22c55e"
negative: "#ef4444"
warning: "#f59e0b"
info: "#3b82f6"
```

Invalid color values must be ignored with warning.

## 8. Accessibility Rules

- Maintain contrast for text on all surfaces.
- Do not rely on red/green alone; pair with labels.
- Keep font size stable; do not scale text by viewport width.
- Heatmaps need numeric values in cells or tooltips.

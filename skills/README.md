# Glancy Skills.md Package

Glancy is a Skills.md-driven investment dashboard. These files define the rules for data normalization, indicator computation, insight generation, chart selection, layout composition, and visual theme.

## Package Structure

| File | Role |
|------|------|
| `main.md` | System entry point and execution order |
| `data.md` | Data source registry and MarketData normalization |
| `indicators.md` | Technical/fundamental indicator computation rules |
| `insights.md` | Rule-based Korean narrative generation |
| `charts.md` | Data type to ChartSpec visualization mapping |
| `layout.md` | Dashboard composition, responsive behavior, states |
| `theme.md` | Design tokens for dark/light dashboard themes |
| `providers/kiwoom.md` | Optional Kiwoom REST setup and AI/user responsibilities |

## Dependency Graph

```text
main.md
  -> data.md
      -> indicators.md
          -> insights.md
              -> charts.md
                  -> layout.md <- theme.md
                      -> Final Dashboard
```

## Two Usage Modes

### Build-time Guide

AI coding tools should load `README.md` and `main.md` first, then load the relevant module for the current task. Each module describes inputs, outputs, fallback behavior, and examples.

### Runtime Configuration

The dashboard can use selected rules from `indicators.md`, `charts.md`, and `theme.md` at runtime. When a user changes RSI thresholds or theme tokens in the Skills Runtime Demo, the dashboard recalculates or restyles without changing code.

## Optional Korean Stock Provider Mode

For Korean stocks, AI should present two modes before enabling brokerage-backed data:

| Mode | When to use | Behavior |
|------|-------------|----------|
| `pykrx` | Default, no brokerage setup | Search via KRX KIND, chart via pykrx/KRX, quote from latest daily candle |
| `kiwoom_rest` | User completed Kiwoom REST setup | Quote and chart can use Kiwoom REST, with pykrx fallback |
| `auto` | Recommended for configured demos | Use Kiwoom when env is complete; otherwise continue with pykrx |

Load `providers/kiwoom.md` before implementing or troubleshooting Kiwoom REST integration.

## Scoring Strategy

This package targets all five hackathon evaluation areas:

| Criterion | Evidence |
|-----------|----------|
| Generality | `data.md` normalizes multiple data sources and upload types |
| Skills.md quality | Seven focused modules with explicit interfaces |
| Automatic dashboard generation | `charts.md` and `layout.md` generate views from data type |
| Vibe coding | Skills-to-code traceability can be documented from this package |
| Practicality/creativity | Runtime demo, upload analysis, and fallback reliability |

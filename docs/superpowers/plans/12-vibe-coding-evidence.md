# Plan 12 — Vibe Coding Evidence

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Skills.md 기반 바이브 코딩"을 말로 주장하는 수준에서 끝내지 않고, 심사자가 확인 가능한 증거 패키지로 만든다. Skills.md 모듈이 어떤 코드/화면/동작으로 변환됐는지 추적 가능해야 한다.

**Architecture:** `docs/evidence/`에 재현 절차, prompt log, Skills-to-code traceability matrix, rebuild notes, screenshots를 정리한다. 최종 제출 페이지 또는 README에서 이 증거 패키지를 링크한다.

**Tech Stack:** Markdown / Git history / screenshots / optional screen recording

**예상 소요:** 3~5시간

---

## File Structure

```
docs/evidence/
├── README.md                         # 증거 패키지 진입점
├── skills-to-code-matrix.md          # Skills.md -> 구현 매핑표
├── prompt-log.md                     # 바이브 코딩 프롬프트 로그
├── rebuild-from-skills.md            # Skills.md만으로 재빌드하는 절차
├── generated-artifacts.md            # 생성/수정된 주요 파일 목록
└── screenshots/
    ├── runtime-demo-before.png
    ├── runtime-demo-after.png
    ├── upload-detection.png
    └── dashboard-live.png
```

---

## Tasks

### Task 1: Evidence README 작성

**Files:**
- Create: `docs/evidence/README.md`

- [ ] **Step 1: 증거 패키지 개요 작성**

```markdown
# Glancy Vibe Coding Evidence

본 문서는 Glancy가 Skills.md 패키지를 중심으로 설계되고 구현됐음을 보여주는 증거 패키지다.

## 핵심 주장

1. `skills/*.md`는 단순 설명서가 아니라 데이터/지표/인사이트/차트/레이아웃/테마의 규칙 소스다.
2. 구현 코드는 각 Skills.md 모듈을 기준으로 생성 및 수정됐다.
3. 런타임 데모에서 `theme.md`, `indicators.md` 일부 규칙을 변경하면 대시보드가 즉시 변화한다.

## Evidence Index

| 문서 | 설명 |
|------|------|
| `skills-to-code-matrix.md` | 각 Skills.md 모듈이 어떤 코드로 구현됐는지 매핑 |
| `prompt-log.md` | 바이브 코딩 프롬프트 흐름 |
| `rebuild-from-skills.md` | Skills.md만으로 재빌드하는 절차 |
| `generated-artifacts.md` | 주요 생성 산출물 목록 |
```

- [ ] **Step 2: 커밋**

```bash
git add docs/evidence/README.md
git commit -m "docs(evidence): add vibe coding evidence index"
```

---

### Task 2: Skills-to-Code Matrix 작성

**Files:**
- Create: `docs/evidence/skills-to-code-matrix.md`

- [ ] **Step 1: 매핑표 작성**

```markdown
# Skills-to-Code Traceability Matrix

| Skills module | Rule responsibility | Implemented files | User-visible proof |
|---------------|---------------------|-------------------|--------------------|
| `main.md` | 실행 순서, routing, fallback | `backend/app/main.py`, `src/App.tsx` | 카테고리 탭/분석 탭 라우팅 |
| `data.md` | 데이터 소스 레지스트리, MarketData 표준화 | `backend/app/models.py`, `backend/app/sources/*`, `backend/app/normalize.py` | 6개 데이터 소스 동일 UI 렌더 |
| `indicators.md` | 기술 지표, 시그널, 게이지 계산 | `backend/app/indicators/*` | RSI/MACD/MA/ADX/피벗 테이블 |
| `insights.md` | 규칙 기반 자연어 해석 | `backend/app/insights/*` | Skills 기반 인사이트 패널 |
| `charts.md` | 차트 선택, series mapping | `src/components/charts/*`, `src/lib/chart-theme.ts` | 캔들/MA/RSI/MACD 차트 |
| `layout.md` | 페이지 구성, responsive states | `src/components/dashboard/*`, `src/components/analysis/*` | 요약/기술/기본 분석 탭 |
| `theme.md` | 색/폰트/간격 토큰 | `tailwind.config.js`, `src/index.css`, `src/lib/chart-theme.ts` | 다크/라이트 + runtime theme demo |

## Runtime Proof

`Plan 11`의 Skills Runtime Demo는 `indicators.md`, `theme.md`의 일부 규칙을 앱 실행 중 변경하여 코드 없이 UI/분석 결과가 달라지는 것을 보여준다.
```

- [ ] **Step 2: 커밋**

```bash
git add docs/evidence/skills-to-code-matrix.md
git commit -m "docs(evidence): map Skills modules to code artifacts"
```

---

### Task 3: Prompt Log 작성

**Files:**
- Create: `docs/evidence/prompt-log.md`

- [ ] **Step 1: 프롬프트 로그 템플릿 작성**

```markdown
# Prompt Log

## How to read this file

각 항목은 바이브 코딩 과정에서 사용한 핵심 프롬프트와 산출물을 기록한다. 전체 대화 원문이 아니라, 심사자가 구현 흐름을 이해하는 데 필요한 요약 로그다.

---

## 1. Brainstorming

**Input context:** 해커톤 평가 기준, 운영진 Q&A, 투자 대시보드 요구사항.

**Prompt summary:**
> 투자 데이터 Skills 기반 대시보드에서 1등을 목표로 할 때, Skills.md를 단순 제출 문서가 아니라 시스템을 구동하는 런타임 설정 파일로 해석할 수 있는지 브레인스토밍.

**Output artifacts:**
- `HACKATHON_DESIGN.md`
- `docs/superpowers/plans/00-master-plan.md`

---

## 2. Writing Plans

**Prompt summary:**
> 브레인스토밍 결과를 작업 파트별 실행 계획으로 분해. 각 계획은 파일 구조, 단계별 작업, 테스트, 완료 조건을 포함.

**Output artifacts:**
- `docs/superpowers/plans/01-proposal-pdf.md`
- `docs/superpowers/plans/02-skills-md-modules.md`
- `docs/superpowers/plans/03-data-layer.md` ... `13-demo-reliability-layer.md`

---

## 3. Implementation

**Prompt summary template:**
> `skills/{module}.md`의 규칙을 기준으로 `{target files}`를 구현한다. 기존 코드 스타일을 유지하고, 테스트를 추가한다.

**Output artifacts:** See `generated-artifacts.md`.
```

- [ ] **Step 2: 실제 사용한 프롬프트 요약 추가**

Claude Code / Codex / 기타 도구에서 사용한 핵심 프롬프트를 날짜별로 요약한다.

- [ ] **Step 3: 커밋**

```bash
git add docs/evidence/prompt-log.md
git commit -m "docs(evidence): add prompt log template"
```

---

### Task 4: Rebuild from Skills 절차 작성

**Files:**
- Create: `docs/evidence/rebuild-from-skills.md`

- [ ] **Step 1: 재빌드 절차 문서화**

```markdown
# Rebuild From Skills.md

이 절차는 Glancy를 Skills.md 패키지 중심으로 다시 생성하는 방법을 설명한다.

## Inputs

- `skills/README.md`
- `skills/main.md`
- `skills/data.md`
- `skills/indicators.md`
- `skills/insights.md`
- `skills/charts.md`
- `skills/layout.md`
- `skills/theme.md`

## Recommended Prompt Order

1. Load `skills/README.md` and `skills/main.md`.
2. Generate backend data models from `data.md`.
3. Generate indicator engine from `indicators.md`.
4. Generate insight rules from `insights.md`.
5. Generate chart components from `charts.md`.
6. Generate dashboard layout from `layout.md`.
7. Apply design tokens from `theme.md`.
8. Run tests and compare against this repository.

## Success Criteria

- Generated backend exposes the same MarketData shape.
- Generated indicator response includes gauges and insights.
- Generated frontend renders 6 categories and 3 analysis tabs.
- Runtime demo can override at least RSI thresholds and theme accent colors.
```

- [ ] **Step 2: 커밋**

```bash
git add docs/evidence/rebuild-from-skills.md
git commit -m "docs(evidence): document rebuild from Skills workflow"
```

---

### Task 5: Generated Artifacts 문서 작성

**Files:**
- Create: `docs/evidence/generated-artifacts.md`

- [ ] **Step 1: 산출물 목록 작성**

```markdown
# Generated Artifacts

## Backend

| Area | Files |
|------|-------|
| Data layer | `backend/app/models.py`, `backend/app/normalize.py`, `backend/app/sources/*`, `backend/app/routers/*` |
| Indicators | `backend/app/indicators/*` |
| Insights | `backend/app/insights/*` |
| Upload | `backend/app/upload/*` |
| Reliability | `backend/app/cache.py`, `backend/app/fallback.py` |

## Frontend

| Area | Files |
|------|-------|
| Dashboard shell | `src/App.tsx`, `src/components/dashboard/*` |
| Analysis views | `src/components/analysis/*` |
| Charts | `src/components/charts/*` |
| Skills runtime | `src/components/skills/*`, `src/hooks/useSkillsRuntime.ts`, `src/lib/skills-parser.ts` |
| Upload | `src/components/upload/UploadView.tsx` |

## Docs

| Area | Files |
|------|-------|
| Plans | `docs/superpowers/plans/*.md` |
| Evidence | `docs/evidence/*.md` |
| Deployment | `docs/deployment/*.md` |
```

- [ ] **Step 2: 실제 구현 후 파일 목록 갱신**

- [ ] **Step 3: 커밋**

```bash
git add docs/evidence/generated-artifacts.md
git commit -m "docs(evidence): list generated artifacts"
```

---

### Task 6: README 또는 제출 페이지에서 Evidence 링크

**Files:**
- Modify: `README.md` if exists
- 또는 Create: `docs/submission.md`

- [ ] **Step 1: 제출 설명에 Evidence 링크 추가**

```markdown
## Vibe Coding Evidence

Glancy는 `skills/*.md`를 중심으로 구현됐다. 자세한 증거는 `docs/evidence/README.md`에서 확인할 수 있다.
```

- [ ] **Step 2: 커밋**

```bash
git add README.md docs/submission.md
git commit -m "docs(submission): link vibe coding evidence"
```

---

## Self-Review

- [ ] Skills.md -> 코드 매핑표가 명확한가?
- [ ] prompt log가 심사자에게 보여줘도 안전한 수준으로 정리됐는가?
- [ ] rebuild 절차가 재현 가능한가?
- [ ] Runtime Demo와 Evidence 문서가 서로 연결되는가?
- [ ] 최종 제출 설명에서 evidence가 발견 가능한가?

## 완료 조건

심사자가 `docs/evidence/README.md`만 읽어도 "이 프로젝트는 Skills.md 기반으로 바이브 코딩됐다"는 흐름과 증거를 확인할 수 있다.

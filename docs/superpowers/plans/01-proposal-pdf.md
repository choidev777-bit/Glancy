# Plan 01 — 기획서 PDF 작성

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DACON 해커톤 기획서 PDF를 4/30 09:59까지 제출 가능한 형태로 완성한다.

**Architecture:** Markdown으로 기획서 작성 → PDF 변환. 기획서는 운영진 가이드라인(서비스 개요 / 분석 흐름 / 대시보드 구성 / Skills.md 설계 방향 / 확장 기능)을 모두 포함하고, 평가 기준 5개 항목(범용성/Skills.md/대시보드 자동생성/바이브코딩/실용성)에 직접 매핑되도록 구성한다.

**Tech Stack:** Markdown + Pandoc(또는 Typora/VS Code Markdown PDF 익스텐션) → PDF

**예상 소요:** 6~8시간

---

## File Structure

- 작업 디렉터리: `docs/proposal/`
- 작성: `docs/proposal/proposal.md` (단일 마크다운 파일)
- 산출물: `docs/proposal/proposal.pdf`
- 참고 자산: `HACKATHON_DESIGN.md`, `DESIGN.md` (이미 존재)

---

## Tasks

### Task 1: 기획서 디렉터리 + 메타 준비

**Files:**
- Create: `docs/proposal/proposal.md`
- Create: `docs/proposal/assets/` (이미지 디렉터리)

- [ ] **Step 1: 디렉터리 생성**

```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\thisi\Documents\Glancy\docs\proposal\assets" | Out-Null
```

- [ ] **Step 2: 빈 마크다운 파일 생성 + 헤더 작성**

`docs/proposal/proposal.md` 생성하고 다음 내용 추가:

```markdown
# 월간 해커톤 기획서
## Skills.md 기반 범용 투자 데이터 대시보드 — Glancy

| 항목 | 내용 |
|------|------|
| 팀명 | (입력) |
| 팀원 | (입력) |
| 제출일 | 2026-04-29 |
| 대회명 | 월간 해커톤: 투자 데이터를 시각화하라 |
```

- [ ] **Step 3: 커밋**

```bash
git add docs/proposal/proposal.md
git commit -m "docs: scaffold proposal markdown"
```

---

### Task 2: 1장 서비스 개요 작성

**Files:**
- Modify: `docs/proposal/proposal.md`

- [ ] **Step 1: 1장 작성**

`proposal.md`에 다음 섹션 추가:

```markdown
## 1. 서비스 개요

### 1-1. 제품명
**Glancy** — Skills.md 기반 범용 투자 분석 대시보드

### 1-2. 핵심 가치 제안
한 줄 요약: "Skills.md 문서가 곧 시스템이 되는 투자 분석 도구"

본 서비스는 다음 두 가지 시나리오를 모두 지원한다.

1. **카테고리 탭으로 즉시 탐색** — 한국주식 / 미국주식 / ETF / 암호화폐 / 글로벌지수 6개 카테고리에 사전 연결된 데이터 소스를 통해 사용자가 종목 선택만으로 즉각 분석 결과 확인
2. **사용자 데이터 자동 분석** — CSV/JSON 업로드 시 데이터 유형(OHLCV / 포트폴리오 / 다종목 비교 / 수익률 시계열 / 가격 시계열)을 자동 감지하여 적절한 분석 자동 수행

### 1-3. 차별점 — Skills.md를 런타임 설정 파일로 활용
타 참가팀 일반 해석: Skills.md = 개발 시 AI에게 준 가이드 문서.
본 팀 고급 해석: Skills.md = **런타임 설정 파일**. 사용자 / 심사자가 파라미터를 변경하면 indicators.md 규칙이 즉시 재적용되어 대시보드 전체가 새 규칙 기반으로 재생성된다. "문서가 시스템을 구동한다"의 직관적 증명.

### 1-4. 타겟 사용자
- 개인 투자자: 다양한 자산 (한국 주식, 미국 주식, ETF, 암호화폐) 통합 모니터링
- 데이터 분석가: 본인의 CSV 데이터를 동일 시스템으로 분석
- 투자 입문자: AI 인사이트 텍스트로 숫자를 자연어로 해석
```

- [ ] **Step 2: 커밋**

```bash
git add docs/proposal/proposal.md
git commit -m "docs(proposal): add section 1 — service overview"
```

---

### Task 3: 2장 분석 흐름 설계 작성

**Files:**
- Modify: `docs/proposal/proposal.md`

- [ ] **Step 1: 2장 작성**

```markdown
## 2. 분석 흐름 설계

### 2-1. 전체 데이터 파이프라인

```
[입력]                    [Skills.md 모듈]              [출력]
─────────────────────────────────────────────────────────────────
카테고리 탭 선택      →   data.md           →   표준화된 MarketData
또는 CSV 업로드           (데이터 소스 레지스트리)
                          
                      →   indicators.md     →   계산된 지표 + 시그널
                          (지표 계산 규칙)

                      →   insights.md       →   자연어 인사이트 텍스트
                          (규칙 기반 해석)        (외부 AI API 미사용)

                      →   charts.md         →   차트 종류 + 시리즈 매핑
                          (시각화 선택 기준)

                      →   layout.md         →   페이지 구성
                          (배치 + 반응형)
                                                   
                      →   theme.md          →   디자인 토큰 적용
                          (색/폰트/간격)            (라이트/다크)
                                                   
                                            →   최종 대시보드 렌더링
```

### 2-2. Orchestration — main.md
main.md는 위 6개 모듈의 호출 순서, 의존성, 사용자 시나리오별 라우팅을 정의한다.

### 2-3. 분석 유형 분기

| 입력 유형 | 분석 종류 |
|----------|----------|
| 한국/미국 주식 | 기술적 분석 + 기본적 분석 |
| ETF / 암호화폐 / 지수 | 기술적 분석 |
| OHLCV CSV | 기술적 분석 (자동 감지) |
| 포트폴리오 CSV | 비중/수익률/MDD/샤프/상관관계 |
| 다종목 비교 CSV | 정규화 수익률 + 상관관계 매트릭스 |
| 수익률 시계열 CSV | 통계 분석 (월별 히트맵 등) |
```

- [ ] **Step 2: 커밋**

```bash
git add docs/proposal/proposal.md
git commit -m "docs(proposal): add section 2 — analysis pipeline"
```

---

### Task 4: 3장 대시보드 구성 작성

**Files:**
- Modify: `docs/proposal/proposal.md`

- [ ] **Step 1: 3장 작성**

```markdown
## 3. 대시보드 구성

### 3-1. UI 계층 구조

```
[헤더] 로고 + 검색 + 다크/라이트 토글
─────────────────────────────────────────────────
[카테고리 탭] 한국주식 | 미국주식 | ETF | 암호화폐 | 글로벌지수 | 업로드
─────────────────────────────────────────────────
[종목 정보] 종목명 / 현재가 / 등락률 / 거래량 / 시가총액 / 52주 고저
─────────────────────────────────────────────────
[분석 탭] 요약 | 기술적 분석 | 기본적 분석    ← SPA, 페이지 리로드 없음
─────────────────────────────────────────────────
[탭 콘텐츠]
  [요약]        종합 게이지 + 인사이트 + 기술/기본 분석 요약 카드 2개
  [기술적 분석] 게이지 3개 + 캔들차트 + 보조 차트 + 지표/이동평균/피벗 테이블
  [기본적 분석] 5개 카드 (밸류에이션/수익성/성장성/재무건전성/주주환원)
```

### 3-2. 와우 모먼트 4가지

1. 카테고리 탭 6개 즉시 전환
2. 실시간 데이터 자동 업데이트 (암호화폐는 Binance WebSocket, 주식은 폴링)
3. Skills.md 규칙 기반 자동 해석 텍스트 (외부 AI API 없이)
4. CSV 업로드 → 데이터 유형 자동 감지 → 동일 시스템으로 분석

### 3-3. 사용자 파라미터 변경 (인터랙션 차별화)
RSI 기간, MACD 단기/장기/시그널, 볼린저밴드 표준편차 등을 사용자가 즉석에서 변경 가능.
변경 = indicators.md 런타임 오버라이드 = 대시보드 전체 재생성.
"Skills.md가 런타임 설정 파일임"을 사용자가 직접 체험.

### 3-4. 데이터 소스

| 카테고리 | 데이터 소스 | API 키 |
|---------|-----------|--------|
| 한국 주식 | pykrx + DART API | DART 키 서버 내장 |
| 미국 주식 | yfinance | 불필요 |
| ETF | yfinance ETF list | 불필요 |
| 암호화폐 | Binance + CoinGecko | 불필요 |
| 글로벌 지수 | yfinance (^KS11, ^GSPC 등) | 불필요 |
| 사용자 업로드 | CSV/JSON | 불필요 |

심사자는 별도 키 입력 / HTS 설치 없이 URL 접속만으로 모든 기능 확인 가능.
```

- [ ] **Step 2: 커밋**

```bash
git add docs/proposal/proposal.md
git commit -m "docs(proposal): add section 3 — dashboard composition"
```

---

### Task 5: 4장 Skills.md 설계 방향 작성

**Files:**
- Modify: `docs/proposal/proposal.md`

- [ ] **Step 1: 4장 작성**

```markdown
## 4. Skills.md 설계 방향

### 4-1. 모듈화 구조 (7개 파일)

운영진 규정상 "여러 개 제출 가능, 기능별·역할별 구분 권장"되어 있어 다음과 같이 분리한다.

```
skills/
├── main.md          # Orchestrator: 실행 흐름, 모듈 간 호출 정의
├── data.md          # Data Layer: 6개 데이터 소스 통합, 표준화
├── indicators.md    # Computation Layer: 기술/기본 지표 계산 규칙
├── insights.md      # Narrative Layer: 규칙 기반 자연어 해석
├── charts.md        # Visual Selection: 데이터 → 차트 종류 매핑
├── layout.md        # Composition: 페이지 배치, 반응형, 상태 처리
└── theme.md         # Design Token: 색/폰트/간격, 라이트/다크
```

### 4-2. 의존성 그래프

```
main.md (orchestrator)
  └─ data.md
       └─ indicators.md
            └─ insights.md
                 └─ charts.md
                      └─ layout.md ← theme.md (횡주입)
                           └─ Final Dashboard
```

### 4-3. 모듈별 책임 요약

| 모듈 | 책임 | 입력 | 출력 |
|------|------|------|------|
| main.md | 실행 흐름 정의 | 사용자 시나리오 | 모듈 호출 시퀀스 |
| data.md | 입력 정규화 | 카테고리 탭 / 업로드 | MarketData 표준 구조 |
| indicators.md | 지표 계산 | MarketData | 지표값 + 시그널 |
| insights.md | 자연어 해석 | 지표 + 시그널 | Insights[] (한국어) |
| charts.md | 차트 매핑 | 지표 + 인사이트 | ChartSpec[] |
| layout.md | 화면 배치 | ChartSpec + 인사이트 | LayoutSpec |
| theme.md | 디자인 토큰 | (정적) | CSS 변수 / 토큰 |

### 4-4. 인사이트 생성 — 외부 LLM API 미사용
insights.md는 다음과 같은 IF/THEN 규칙 + 텍스트 템플릿으로 구성된다.

```
규칙 예시:
  IF RSI < 20  → "RSI {value}. 극단적 과매도, 반등 가능성 높음."
  IF RSI 20~30 → "RSI {value}. 과매도 구간 진입."
  IF RSI 70~80 → "RSI {value}. 과매수 구간. 단기 조정 가능성."
  
종합 시그널:
  매수 신호 수 > 매도 신호 수 × 2 → "전반적으로 강한 매수 신호..."
```

장점:
- API 비용 0원
- 심사자 키 발급 불필요
- 응답 즉각 (네트워크 지연 없음)
- **Skills.md 자체가 지능임을 직접 증명** → Skills.md 설계 25점 + 바이브코딩 15점 직격
```

- [ ] **Step 2: 커밋**

```bash
git add docs/proposal/proposal.md
git commit -m "docs(proposal): add section 4 — Skills.md design"
```

---

### Task 6: 5장 평가 기준 매핑 + 6장 확장 기능 작성

**Files:**
- Modify: `docs/proposal/proposal.md`

- [ ] **Step 1: 5장, 6장 작성**

```markdown
## 5. 평가 기준 매핑

| 항목 | 배점 | 본 기획의 대응 |
|------|------|---------------|
| 범용성 | 25 | 6개 카테고리 + 5종 CSV 자동 감지 + Skills.md 모듈 교체로 분석 관점 변환 |
| Skills.md 설계 | 25 | 7개 모듈로 책임 분리, main.md orchestrator로 명확한 호출 구조 |
| 대시보드 자동 생성 | 25 | 클릭 한 번으로 전 분석 자동 실행, investing.com 수준의 UI 완성도 |
| 바이브코딩 활용 | 15 | Skills.md 정식판 기반으로 처음부터 다시 빌드, 수동 코드 최소화 증명 |
| 실용성 / 창의성 | 10 | 사용자 파라미터 변경, 다크/라이트, 반응형, 한국화 |

## 6. 확장 기능 아이디어 (추가 제출 시)

- **Skills.md 마켓플레이스**: 다른 분석 관점(보수적/공격적/단기/장기)을 가진 Skills.md 셋을 사용자가 다운로드하여 적용
- **포트폴리오 시뮬레이터**: 업로드한 포트폴리오의 과거 성과를 거꾸로 시뮬레이션
- **알림 규칙 엔진**: insights.md 규칙에 알림 트리거 추가 (예: "RSI 70 돌파 시 카카오톡 알림")
- **다국어 지원**: insights.md를 다국어 템플릿으로 확장 (영/일/중)
- **다중 종목 비교 뷰**: 카테고리 내 2~4개 종목 동시 분석
```

- [ ] **Step 2: 커밋**

```bash
git add docs/proposal/proposal.md
git commit -m "docs(proposal): add sections 5-6 — scoring map and extensions"
```

---

### Task 7: 7장 일정 + 8장 팀 구성 작성

**Files:**
- Modify: `docs/proposal/proposal.md`

- [ ] **Step 1: 7장, 8장 작성**

```markdown
## 7. 개발 일정

| 구간 | 기간 | 산출물 |
|------|------|--------|
| 1단계 | 4/6 ~ 4/30 | 기획서 + Skills.md v0.1 스켈레톤 |
| 2단계 | 4/30 ~ 5/3 | 빠른 프로토타입으로 Skills.md 검증 |
| 3단계 | 5/3 ~ 5/7 | Skills.md 정식판 작성 + 제출 |
| 4단계 | 5/7 ~ 5/14 | 완성된 Skills.md만 가지고 처음부터 다시 빌드 + 배포 |

핵심 철학: 4단계에서 **Skills.md만 가지고 처음부터 다시 빌드**. 이게 "문서가 시스템을 구동한다"의 증명이며, 바이브코딩 15점의 직접 근거.

## 8. 팀 구성

(팀 구성에 맞춰 작성)
```

- [ ] **Step 2: 커밋**

```bash
git add docs/proposal/proposal.md
git commit -m "docs(proposal): add sections 7-8 — schedule and team"
```

---

### Task 8: 시각 자료 (와이어프레임 / 모듈 그래프)

**Files:**
- Create: `docs/proposal/assets/wireframe.png`
- Create: `docs/proposal/assets/module-graph.png`
- Modify: `docs/proposal/proposal.md`

- [ ] **Step 1: 현재 대시보드 화면 캡처**

`npm run dev`로 실행 후 다음 화면 캡처:
- 요약 탭 화면
- 기술적 분석 탭 화면
- 기본적 분석 탭 화면
- 다크/라이트 모드 비교

PNG 파일로 `docs/proposal/assets/` 에 저장.

- [ ] **Step 2: 모듈 의존성 그래프 다이어그램 작성**

[Excalidraw](https://excalidraw.com/) 또는 [Mermaid Live Editor](https://mermaid.live/) 에서 4-2 의존성 그래프를 시각화하여 PNG 저장.

- [ ] **Step 3: 마크다운에 이미지 삽입**

`proposal.md`의 적절한 섹션에 이미지 추가:

```markdown
![대시보드 와이어프레임 - 요약 탭](./assets/wireframe-summary.png)
![대시보드 와이어프레임 - 기술적 분석](./assets/wireframe-technical.png)
![Skills.md 모듈 의존성](./assets/module-graph.png)
```

- [ ] **Step 4: 커밋**

```bash
git add docs/proposal/assets/ docs/proposal/proposal.md
git commit -m "docs(proposal): add wireframes and module graph"
```

---

### Task 9: PDF 변환

**Files:**
- Create: `docs/proposal/proposal.pdf`

- [ ] **Step 1: 변환 도구 선택 (택 1)**

**옵션 A — VS Code Markdown PDF 익스텐션 (권장, 가장 간단):**
1. VS Code에서 `Markdown PDF` 익스텐션 설치
2. `proposal.md` 파일 열기
3. `Ctrl+Shift+P` → "Markdown PDF: Export (pdf)" 선택

**옵션 B — Pandoc:**
```bash
pandoc proposal.md -o proposal.pdf --pdf-engine=xelatex -V mainfont="Pretendard" -V CJKmainfont="Pretendard"
```

**옵션 C — Typora:**
1. Typora에서 `proposal.md` 열기
2. File → Export → PDF

- [ ] **Step 2: PDF 검수**

생성된 `proposal.pdf` 확인 사항:
- 한글 깨짐 없음
- 이미지 정상 삽입
- 페이지 분리 자연스러움
- 표 잘림 없음

문제 있으면 마크다운 수정 후 재변환.

- [ ] **Step 3: 커밋**

```bash
git add docs/proposal/proposal.pdf
git commit -m "docs(proposal): export PDF version"
```

---

### Task 10: DACON 사이트 제출

**Files:** N/A (외부 작업)

- [ ] **Step 1: DACON 대회 페이지 접속**

https://daker.ai/public/hackathons/hackathon-investment-data-skills-dashboard

- [ ] **Step 2: 로그인 후 [기획서 제출] 버튼 클릭**

- [ ] **Step 3: `proposal.pdf` 업로드**

- [ ] **Step 4: 제출 시간 확인 (4/30 09:59 이전)**

- [ ] **Step 5: 제출 완료 스크린샷 보관**

`docs/proposal/submission-screenshot.png` 저장.

- [ ] **Step 6: 마지막 커밋**

```bash
git add docs/proposal/submission-screenshot.png
git commit -m "docs(proposal): proposal submitted to DACON"
```

---

## Self-Review

- [ ] 운영진 가이드 5개 항목 모두 포함됐는가?
  - 서비스 개요 (Task 2) ✓
  - 분석 흐름 설계 (Task 3) ✓
  - 대시보드 구성 (Task 4) ✓
  - Skills.md 설계 방향 (Task 5) ✓
  - 확장 기능 아이디어 (Task 6) ✓
- [ ] 평가 기준 5개 항목에 직접 매핑되는가? (Task 6 — 5장)
- [ ] PDF 한글 깨짐 없는가? (Task 9 Step 2)
- [ ] 4/30 09:59 이전에 제출 완료했는가? (Task 10)

## 완료 조건

DACON 사이트에 PDF 제출 완료, 제출 확인 스크린샷 보관.

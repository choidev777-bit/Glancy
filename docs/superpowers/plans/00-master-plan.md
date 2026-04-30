# Glancy 투자 대시보드 — 마스터 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans 또는 subagent-driven-development. 본 마스터 플랜은 인덱스이며, 실제 구현은 각 하위 플랜을 따른다.

**Goal:** DACON 월간 해커톤 "Skills 기반 투자 데이터 대시보드"에서 압도적 1등을 달성한다.

**Architecture:** Vite + React + TypeScript 프론트엔드(이미 스캐폴딩됨) + Python FastAPI 백엔드(예정). Skills.md 7개 모듈이 분석 규칙/시각화/UI 레이아웃/테마를 정의하고, 백엔드는 그 규칙을 코드로 구현한다. 프론트는 백엔드 API에서 데이터를 받아 Lightweight Charts(TradingView 오픈소스)로 렌더링한다.

**Tech Stack:**
- 프론트: Vite + React 18 + TypeScript + TailwindCSS + Lightweight Charts + Lucide
- 백엔드: Python 3.11+ + FastAPI + pykrx + yfinance + DART API (OpenDartReader) + Binance Python SDK + CoinGecko REST + python-binance + pandas + ta-lib(또는 pandas-ta)
- 배포: 프론트 Vercel, 백엔드 Railway (둘 다 무료 플랜)
- AI: 외부 LLM API 미사용. 인사이트는 insights.md 규칙 기반 패턴 매칭

---

## 1. 핵심 마일스톤

| 날짜 | 마감 | 산출물 |
|------|------|--------|
| 2026-04-30 09:59 | 기획서 제출 | `proposal.pdf` (Plan 01) |
| 2026-05-07 09:59 | Skills.md 제출 | `skills/*.md` 7개 (Plan 02) |
| 2026-05-14 09:59 | 최종 웹 링크 제출 | 배포 URL (Plans 03~10) |
| 2026-05-14~05-18 | 1차 대중 투표 | (제출 완료 상태 유지) |
| 2026-05-18~05-22 | 2차 내부 심사 | (제출 완료 상태 유지) |

---

## 2. 작업 의존성 그래프

```
[Plan 01] 기획서 PDF      ← 4/30 마감, 다른 작업과 독립적
                          
[Plan 02] Skills.md 모듈 ← 5/7 마감
   │
   ├─→ [Plan 03] 데이터 레이어 (data.md를 코드로)
   │      │
   │      ├─→ [Plan 04] 지표 엔진 (indicators.md를 코드로)
   │      │      │
   │      │      └─→ [Plan 05] 인사이트 엔진 (insights.md를 코드로)
   │      │
   │      └─→ [Plan 06] 기본적 분석 데이터
   │
   ├─→ [Plan 08] 차트 통합 (charts.md를 코드로)
   │
   └─→ [Plan 09] UI 마무리 (layout.md + theme.md를 코드로)

[Plan 07] CSV 업로드     ← Plan 03 완료 후 시작 가능 (선택)

[Plan 10] 배포 + QA      ← 5/14 마감, 모든 상위 Plan 완료 후

[Plan 11] Skills Runtime Demo      ← Plan 02, 04, 08, 09 이후
[Plan 12] Vibe Coding Evidence     ← 전 기간 병행, 최종 제출 전 정리
[Plan 13] Demo Reliability Layer   ← Plan 03 이후, Plan 10 이전 필수
[Plan 14] Visualization Intelligence ← Plan 02, 07, 08 이후, Plan 10 이전 필수
```

---

## 3. 추천 실행 순서

### Phase 1 (오늘 ~ 4/30): 기획서 우선
**최긴급:** 4/30 09:59까지 PDF 제출이 가장 큰 리스크.

- [ ] **Plan 01 — 기획서 PDF** 단독 진행, 약 6~8시간 분량.
  완료 후 즉시 Phase 2로 이동.

### Phase 2 (4/30 오전 ~ 5/3): 프로토타입
바이브 코딩으로 빠르게 구현하며 Skills.md 정련 재료 확보.

- [ ] **Plan 02 — Skills.md v0.1 스켈레톤** (각 .md 파일 골격만)
- [ ] **Plan 03 — 데이터 레이어 v0.1** (백엔드 부트스트랩 + pykrx + yfinance만)
- [ ] **Plan 04 — 지표 엔진 v0.1** (RSI, MACD, MA만)
- [ ] **Plan 08 — 차트 통합 v0.1** (캔들 + MA 오버레이만)
- [ ] **Plan 09 — UI 잔여 버그 수정** (자세히 보기 연결, ETF 더미데이터, MACD 차트)

### Phase 3 (5/3 ~ 5/7): Skills.md 정식판
프로토타입 학습 결과를 반영해 Skills.md 완성.

- [ ] **Plan 02 — Skills.md 정식판** (완성도 끌어올리기, 5/7 제출)

### Phase 4 (5/7 ~ 5/14): 최종 빌드
완성된 Skills.md를 가지고 처음부터 다시 빌드 (수동 구현 최소화 증명).

- [ ] **Plan 03~05 — 백엔드 풀 빌드** (5개 데이터 소스 + 전체 지표 + 인사이트 엔진)
- [ ] **Plan 06 — 기본적 분석 데이터 통합** (DART + yfinance fundamentals)
- [ ] **Plan 07 — CSV 업로드 자동 감지**
- [ ] **Plan 08 — 차트 풀 통합** (실시간 WebSocket 포함)
- [ ] **Plan 09 — UI 마무리** (반응형, 상태 처리, 폴리싱)
- [ ] **Plan 11 — Skills Runtime Demo** (`theme.md` / `indicators.md` 런타임 변경 증명)
- [ ] **Plan 13 — Demo Reliability Layer** (cache / fallback / sample mode)
- [ ] **Plan 14 — Visualization Intelligence Layer** (데이터 유형별 자동 차트 선택 + charts.md 선택 이유 표시)
- [ ] **Plan 12 — Vibe Coding Evidence** (Skills.md → 코드 매핑, 프롬프트 로그, 재빌드 절차)
- [ ] **Plan 10 — 배포 + QA + 제출**

---

## 4. 평가 기준 매핑

| 평가 항목 | 배점 | 책임 Plan |
|-----------|------|----------|
| 범용성 | 25 | Plan 02 (data.md 레지스트리), Plan 03, Plan 07, Plan 13, Plan 14 |
| Skills.md 설계 | 25 | Plan 02, Plan 11, Plan 14 |
| 대시보드 자동 생성 | 25 | Plan 04, 05, 06, 08, 09, Plan 11, Plan 14 |
| 바이브코딩 활용 | 15 | Plan 02, Plan 12 |
| 실용성/창의성 | 10 | Plan 09, Plan 10, Plan 13, Plan 14 |

---

## 5. 외부 의존성 / 사전 준비 체크리스트

- [ ] DART API 키 발급 (https://opendart.fss.or.kr/)
- [ ] Vercel 계정 (프론트 배포)
- [ ] Railway 계정 (백엔드 배포)
- [ ] GitHub 저장소 생성 (선택, 제출 시 가산점)
- [ ] Pretendard 웹폰트 적용 확인
- [ ] JetBrains Mono 웹폰트 적용 확인
- [ ] 도메인 (선택, glancy.app 등)

---

## 6. 의사결정 보류 항목

다음 항목은 Plan 03 시작 전 결정 필요.

- [ ] 백엔드 프레임워크: **FastAPI** (Python) 권장 — pykrx/yfinance/DART 모두 Python 생태계
- [ ] 백엔드 호스팅: Railway vs Render — Railway 권장 (무료 + 빠름)
- [ ] 모노레포 vs 멀티레포 — 모노레포 권장 (`/frontend`, `/backend`)
- [ ] 환경변수 관리: Vercel/Railway 대시보드 + `.env.local`

---

## 7. 본 마스터 플랜의 사용법

각 Plan 파일은 단독 실행 가능한 단위. 실행 시:
1. 해당 Plan을 처음부터 끝까지 한 번 읽는다
2. 체크박스 단위(2~5분)로 차례로 실행
3. 단계마다 커밋
4. Plan 완료 후 본 마스터 플랜으로 돌아와 다음 Plan 선택

각 Plan은 다음 형식을 따른다.
- **Files** 섹션: 정확한 파일 경로
- **Step** 단위: 한 행동(2~5분)
- 코드 블록은 그대로 복사하여 사용 가능
- 명령어는 그대로 실행 가능

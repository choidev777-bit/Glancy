# Plan 10 — 배포 + QA + 제출 안정화

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5/14 09:59 최종 웹 링크 제출 전, 프론트(Vercel)와 백엔드(Railway)를 안정적으로 배포하고 심사자가 끊김 없이 체험할 수 있는 데모 루트, 환경변수, fallback, 장애 대응 체크리스트를 완성한다.

**Architecture:** 프론트는 Vercel, 백엔드는 Railway에 배포한다. 모든 외부 API 의존 기능은 health check, cache/fallback, sample mode를 갖는다. 심사자는 제출 URL 하나로 "카테고리 탭 -> 실시간 차트 -> Skills Runtime Demo -> CSV 업로드" 순서의 핵심 경험을 3분 안에 확인한다.

**Tech Stack:** Vercel / Railway / GitHub / FastAPI health endpoint / browser QA / Lighthouse

**예상 소요:** 4~6시간

---

## File Structure

```
docs/deployment/
├── qa-checklist.md              # 최종 검수표
├── judge-demo-script.md         # 심사자 3분 데모 루트
├── env-vars.md                  # Vercel/Railway 환경변수
└── incident-playbook.md         # 장애 대응 체크리스트

frontend/runtime:
├── .env.example 또는 .env.local.example

backend/runtime:
├── .env.example
├── health endpoint
└── fallback/sample mode
```

---

## Tasks

### Task 1: 배포 환경변수 표준화

**Files:**
- Modify: `backend/.env.example`
- Create or Modify: `.env.local.example`
- Create: `docs/deployment/env-vars.md`

- [ ] **Step 1: 프론트 환경변수 정의**

```env
VITE_API_BASE_URL=https://glancy-backend.up.railway.app
VITE_ENABLE_SAMPLE_FALLBACK=true
VITE_ENABLE_SKILLS_RUNTIME_DEMO=true
```

- [ ] **Step 2: 백엔드 환경변수 정의**

```env
DART_API_KEY=
ALLOWED_ORIGINS=https://glancy.vercel.app,http://localhost:5173
PORT=8000
ENABLE_SAMPLE_FALLBACK=true
CACHE_TTL_SECONDS=300
```

- [ ] **Step 3: `docs/deployment/env-vars.md` 작성**

```markdown
# Deployment Environment Variables

## Vercel

| Key | Value | Required | Purpose |
|-----|-------|----------|---------|
| VITE_API_BASE_URL | Railway backend URL | yes | API base URL |
| VITE_ENABLE_SAMPLE_FALLBACK | true | yes | Demo reliability |
| VITE_ENABLE_SKILLS_RUNTIME_DEMO | true | yes | Skills runtime scoring proof |

## Railway

| Key | Value | Required | Purpose |
|-----|-------|----------|---------|
| DART_API_KEY | OpenDART key | optional but recommended | KR fundamentals |
| ALLOWED_ORIGINS | Vercel URL + localhost | yes | CORS |
| ENABLE_SAMPLE_FALLBACK | true | yes | External API failure fallback |
| CACHE_TTL_SECONDS | 300 | yes | API cache duration |
```

- [ ] **Step 4: 커밋**

```bash
git add .env.local.example backend/.env.example docs/deployment/env-vars.md
git commit -m "docs(deploy): document env vars for Vercel and Railway"
```

---

### Task 2: Railway 백엔드 배포

**Files:**
- Modify: `backend/app/main.py`
- Create: `backend/railway.json` 또는 Railway dashboard config

- [ ] **Step 1: health endpoint 확장**

`/health` 응답에 서비스 상태와 fallback 상태를 포함한다.

```json
{
  "status": "ok",
  "version": "0.1.0",
  "fallback_enabled": true,
  "services": {
    "pykrx": "unknown",
    "yfinance": "unknown",
    "binance": "unknown",
    "coingecko": "unknown"
  }
}
```

- [ ] **Step 2: Railway 서비스 생성**

```powershell
railway login
railway init
railway up
```

- [ ] **Step 3: Railway 환경변수 입력**

Railway dashboard에서 `DART_API_KEY`, `ALLOWED_ORIGINS`, `ENABLE_SAMPLE_FALLBACK`, `CACHE_TTL_SECONDS`를 설정한다.

- [ ] **Step 4: 배포 확인**

```powershell
curl https://glancy-backend.up.railway.app/health
curl https://glancy-backend.up.railway.app/crypto/BTCUSDT?limit=30
```

- [ ] **Step 5: 커밋**

```bash
git add backend/app/main.py backend/railway.json
git commit -m "chore(deploy): prepare Railway backend deployment"
```

---

### Task 3: Vercel 프론트 배포

**Files:**
- Modify: `vite.config.ts` if needed
- Create: `vercel.json` if needed

- [ ] **Step 1: Vercel 프로젝트 생성**

```powershell
vercel login
vercel
```

- [ ] **Step 2: Vercel 환경변수 설정**

Vercel dashboard에서 `VITE_API_BASE_URL`, `VITE_ENABLE_SAMPLE_FALLBACK`, `VITE_ENABLE_SKILLS_RUNTIME_DEMO`를 설정한다.

- [ ] **Step 3: production build 확인**

```powershell
npm run build
```

- [ ] **Step 4: production 배포**

```powershell
vercel --prod
```

- [ ] **Step 5: 커밋**

```bash
git add vercel.json vite.config.ts
git commit -m "chore(deploy): prepare Vercel frontend deployment"
```

---

### Task 4: 심사자 3분 데모 루트 작성

**Files:**
- Create: `docs/deployment/judge-demo-script.md`

- [ ] **Step 1: 데모 시나리오 작성**

```markdown
# Judge Demo Script

## 0:00-0:30 — 첫 화면
- 한국주식 탭에서 삼성전자 요약 확인
- 종합 게이지, 현재가, 인사이트 문장 확인

## 0:30-1:00 — 자산군 범용성
- 미국주식 -> ETF -> 암호화폐 -> 글로벌지수 순서로 탭 전환
- 동일한 UI가 서로 다른 데이터 소스를 처리하는 모습 확인

## 1:00-1:40 — 기술적 분석 자동 생성
- 기술적 분석 탭 진입
- 캔들차트, MA, RSI, MACD, 지표 테이블, 피벗 포인트 확인

## 1:40-2:20 — Skills Runtime Demo
- theme.md 색상 토큰 변경 또는 RSI 기준 변경
- 적용 버튼 클릭
- 게이지/인사이트/차트 스타일이 즉시 바뀌는지 확인

## 2:20-3:00 — 업로드 범용성
- CSV 업로드 탭 진입
- 샘플 OHLCV 또는 portfolio CSV 업로드
- 자동 감지 결과와 동일 분석 UI 확인
```

- [ ] **Step 2: 커밋**

```bash
git add docs/deployment/judge-demo-script.md
git commit -m "docs(demo): add 3-minute judge demo script"
```

---

### Task 5: 최종 QA 체크리스트

**Files:**
- Create: `docs/deployment/qa-checklist.md`

- [ ] **Step 1: 검수표 작성**

```markdown
# Final QA Checklist

## Submission
- [ ] 제출 URL이 production Vercel URL인가?
- [ ] incognito browser에서 로그인 없이 접속 가능한가?
- [ ] 모바일/데스크톱 모두 첫 화면이 깨지지 않는가?

## Data
- [ ] 한국주식 기본 종목 로드
- [ ] 미국주식 기본 종목 로드
- [ ] ETF 기본 종목 로드
- [ ] 암호화폐 기본 종목 로드
- [ ] 글로벌지수 기본 종목 로드
- [ ] 외부 API 실패 시 sample fallback 표시

## Skills Proof
- [ ] Skills Runtime Demo 진입 가능
- [ ] indicators.md 기준 변경 시 게이지/인사이트 재계산
- [ ] theme.md 토큰 변경 시 UI/차트 색상 변경
- [ ] 원복 버튼 작동

## Upload
- [ ] OHLCV CSV 자동 감지
- [ ] portfolio CSV 자동 감지
- [ ] returns CSV 자동 감지
- [ ] unknown CSV에서 친절한 안내 표시

## Stability
- [ ] `npm run build` 통과
- [ ] backend tests 통과
- [ ] Railway `/health` 정상
- [ ] Vercel production URL 정상
```

- [ ] **Step 2: 커밋**

```bash
git add docs/deployment/qa-checklist.md
git commit -m "docs(qa): add final submission checklist"
```

---

### Task 6: 장애 대응 플레이북

**Files:**
- Create: `docs/deployment/incident-playbook.md`

- [ ] **Step 1: 장애 대응 문서 작성**

```markdown
# Incident Playbook

## External API Down

Symptom: 특정 탭에서 데이터 로딩 실패.

Action:
1. sample fallback이 자동 적용되는지 확인
2. UI에 "실시간 소스 연결 실패, 샘플 데이터로 분석 중" 배지 표시
3. Railway logs에서 실패 API 확인

## CORS Error

Symptom: Vercel에서 API 호출 실패.

Action:
1. Railway `ALLOWED_ORIGINS`에 Vercel production URL 추가
2. backend 재배포
3. browser hard refresh

## DART Key Missing

Symptom: 한국 펀더멘털만 실패.

Action:
1. pykrx 기본 펀더멘털만 표시
2. DART 항목은 fallback note 표시
3. Railway env에 `DART_API_KEY` 추가 후 재배포

## Vercel Build Failure

Symptom: TypeScript build 실패.

Action:
1. local `npm run build` 재현
2. 타입 오류 수정
3. `VITE_API_BASE_URL` 설정 확인
```

- [ ] **Step 2: 커밋**

```bash
git add docs/deployment/incident-playbook.md
git commit -m "docs(qa): add incident playbook"
```

---

## Self-Review

- [ ] Vercel/Railway 배포 절차가 재현 가능한가?
- [ ] env vars가 문서화됐는가?
- [ ] 심사자 3분 데모 루트가 있는가?
- [ ] 외부 API 장애 시 fallback이 켜지는가?
- [ ] 최종 제출 전 QA 체크리스트가 있는가?

## 완료 조건

Production URL에서 incognito 접속이 가능하고, `judge-demo-script.md`의 3분 루트를 끊김 없이 수행한다.

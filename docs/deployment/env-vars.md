# Deployment Environment Variables

This project is designed for a Vercel frontend and a Railway FastAPI backend.

## Vercel

| Key | Example Value | Required | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `https://glancy-backend.up.railway.app` | Yes | FastAPI backend base URL. |
| `VITE_ENABLE_SAMPLE_FALLBACK` | `true` | Yes | Keeps the judge demo usable if an external data provider fails. |
| `VITE_ENABLE_SKILLS_RUNTIME_DEMO` | `true` | Yes | Enables the Skills runtime proof route/surface. |

## Railway

| Key | Example Value | Required | Purpose |
| --- | --- | --- | --- |
| `DART_API_KEY` | OpenDART API key | Optional, recommended | Korean fundamentals. |
| `ALLOWED_ORIGINS` | `https://glancy.vercel.app,http://localhost:5173` | Yes | CORS allowlist for Vercel and local development. |
| `PORT` | `8000` | Yes | Railway injects `PORT`; local default is `8000`. |
| `ENABLE_SAMPLE_FALLBACK` | `true` | Yes | Enables sample/cache fallback during external API failures. |
| `CACHE_TTL_SECONDS` | `300` | Yes | Cache duration for API responses. |

## Local Smoke Test

1. Copy `.env.local.example` to `.env.local` and adjust `VITE_API_BASE_URL` if needed.
2. Copy `backend/.env.example` to `backend/.env`.
3. Start backend: `cd backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload`.
4. Start frontend: `npm run dev -- --host 127.0.0.1`.
5. Check `http://127.0.0.1:8000/health` and `http://127.0.0.1:5173`.

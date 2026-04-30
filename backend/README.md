# Glancy Backend

FastAPI backend for the Glancy Skills.md-driven investment dashboard.

## Quick Start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Endpoints

| Path | Description |
|------|-------------|
| `GET /health` | Health check |
| `GET /kr-stocks/{ticker}` | Korean stock OHLCV |
| `GET /us-stocks/{symbol}` | US stock OHLCV |
| `GET /etfs/{symbol}` | ETF OHLCV |
| `GET /indices/{symbol}` | Global index OHLCV |
| `GET /crypto/{symbol}` | Crypto OHLCV |
| `POST /upload/` | CSV/JSON upload |

## Reliability

Market responses include `meta.data_status`:

| Status | Meaning |
|--------|---------|
| `live` | Fresh external API data |
| `cached` | Recent cached response |
| `sample` | Demo fallback data |


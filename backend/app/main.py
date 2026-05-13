from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import crypto, etfs, fundamental, indices, indicators, kr_stocks, search, upload, us_stocks

app = FastAPI(title="Glancy Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kr_stocks.router)
app.include_router(us_stocks.router)
app.include_router(etfs.router)
app.include_router(indices.router)
app.include_router(crypto.router)
app.include_router(upload.router)
app.include_router(indicators.router)
app.include_router(fundamental.router)
app.include_router(search.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "0.1.0",
        "fallback_enabled": settings.enable_sample_fallback,
        "cache_ttl_seconds": settings.cache_ttl_seconds,
        "allowed_origins": settings.cors_origins,
        "deployment": {
            "provider": "railway",
            "healthcheck_path": "/health",
            "demo_safe": settings.enable_sample_fallback,
        },
        "services": {
            "pykrx": "not_checked",
            "kiwoom": kiwoom_status(),
            "yfinance": "not_checked",
            "binance": "not_checked",
            "coingecko": "not_checked",
        },
    }


def kiwoom_status() -> str:
    from app.sources.kiwoom_source import get_kiwoom_status

    return get_kiwoom_status()

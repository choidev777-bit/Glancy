"""Asset search providers for the dashboard autocomplete."""

from __future__ import annotations

import time
from dataclasses import dataclass
from io import StringIO

import pandas as pd
import requests
from pykrx import stock

from app.models import AssetSearchResult

BINANCE_BASE = "https://api.binance.com/api/v3"
KIND_CORP_LIST_URL = "https://kind.krx.co.kr/corpgeneral/corpList.do"
YAHOO_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search"

_CACHE: dict[str, tuple[float, list[dict]]] = {}
_CACHE_TTL_SECONDS = 86_400

KR_FALLBACKS = [
    {"symbol": "005930", "name": "삼성전자", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "000660", "name": "SK하이닉스", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "035420", "name": "네이버", "aliases": ["NAVER"], "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "035720", "name": "카카오", "aliases": ["Kakao"], "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "005380", "name": "현대차", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "000270", "name": "기아", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "373220", "name": "LG에너지솔루션", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "207940", "name": "삼성바이오로직스", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "068270", "name": "셀트리온", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "006400", "name": "삼성SDI", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "005490", "name": "POSCO홀딩스", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "051910", "name": "LG화학", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "105560", "name": "KB금융", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "055550", "name": "신한지주", "market": "kr", "category": "KR Stocks", "exchange": "KOSPI"},
    {"symbol": "086520", "name": "에코프로", "market": "kr", "category": "KR Stocks", "exchange": "KOSDAQ"},
    {"symbol": "247540", "name": "에코프로비엠", "market": "kr", "category": "KR Stocks", "exchange": "KOSDAQ"},
    {"symbol": "091990", "name": "셀트리온헬스케어", "market": "kr", "category": "KR Stocks", "exchange": "KOSDAQ"},
    {"symbol": "069500", "name": "KODEX 200", "market": "etf", "category": "ETF", "exchange": "KRX ETF"},
    {"symbol": "102110", "name": "TIGER 200", "market": "etf", "category": "ETF", "exchange": "KRX ETF"},
    {"symbol": "133690", "name": "TIGER 미국나스닥100", "market": "etf", "category": "ETF", "exchange": "KRX ETF"},
    {"symbol": "379800", "name": "KODEX 미국S&P500TR", "market": "etf", "category": "ETF", "exchange": "KRX ETF"},
]

INDEX_FALLBACKS = [
    {"symbol": "^KS11", "name": "코스피", "exchange": "KSC"},
    {"symbol": "^KQ11", "name": "코스닥", "exchange": "KSC"},
    {"symbol": "^GSPC", "name": "S&P 500", "exchange": "SNP"},
    {"symbol": "^IXIC", "name": "나스닥 종합", "exchange": "NIM"},
    {"symbol": "^DJI", "name": "다우존스", "exchange": "DJI"},
    {"symbol": "^N225", "name": "니케이 225", "exchange": "OSA"},
    {"symbol": "^FTSE", "name": "FTSE 100", "exchange": "FGI"},
    {"symbol": "^HSI", "name": "항셍 지수", "exchange": "HKG"},
]

YAHOO_FALLBACKS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "quoteType": "EQUITY", "exchange": "NMS"},
    {"symbol": "NVDA", "name": "NVIDIA Corp", "quoteType": "EQUITY", "exchange": "NMS"},
    {"symbol": "MSFT", "name": "Microsoft Corp", "quoteType": "EQUITY", "exchange": "NMS"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "quoteType": "EQUITY", "exchange": "NMS"},
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF", "quoteType": "ETF", "exchange": "PCX"},
    {"symbol": "QQQ", "name": "Invesco QQQ Trust", "quoteType": "ETF", "exchange": "NMS"},
    {"symbol": "^GSPC", "name": "S&P 500", "quoteType": "INDEX", "exchange": "SNP"},
    {"symbol": "^IXIC", "name": "NASDAQ Composite", "quoteType": "INDEX", "exchange": "NIM"},
]

CRYPTO_NAMES = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "BNB": "BNB",
    "SOL": "Solana",
    "XRP": "XRP",
    "ADA": "Cardano",
    "DOGE": "Dogecoin",
    "AVAX": "Avalanche",
    "LINK": "Chainlink",
    "TRX": "TRON",
}


@dataclass(frozen=True)
class MarketFilters:
    kr: bool = True
    us: bool = True
    etf: bool = True
    crypto: bool = True
    index: bool = True

    @classmethod
    def from_csv(cls, value: str | None) -> "MarketFilters":
        if not value:
            return cls()
        requested = {item.strip().lower() for item in value.split(",") if item.strip()}
        return cls(
            kr="kr" in requested,
            us="us" in requested,
            etf="etf" in requested,
            crypto="crypto" in requested,
            index="index" in requested,
        )


def _cached(key: str, loader) -> list[dict]:
    now = time.time()
    if key in _CACHE:
        created_at, value = _CACHE[key]
        if now - created_at < _CACHE_TTL_SECONDS:
            return value
    value = loader()
    _CACHE[key] = (now, value)
    return value


def _score(query: str, symbol: str, name: str) -> float:
    q = query.casefold().strip()
    symbol_cf = symbol.casefold()
    name_cf = name.casefold()
    if symbol_cf == q:
        return 100
    if name_cf == q:
        return 95
    if symbol_cf.startswith(q):
        return 85
    if name_cf.startswith(q):
        return 80
    if q in symbol_cf:
        return 70
    if q in name_cf:
        return 65
    return 0


def _sort_and_limit(results: list[AssetSearchResult], limit: int) -> list[AssetSearchResult]:
    deduped: dict[tuple[str, str], AssetSearchResult] = {}
    for result in results:
        key = (result.market, result.symbol.upper())
        if key not in deduped or result.score > deduped[key].score:
            deduped[key] = result
    return sorted(deduped.values(), key=lambda item: item.score, reverse=True)[:limit]


def _normalize_kr_symbol(value: object) -> str:
    symbol = str(value).strip()
    return symbol.zfill(6) if symbol.isdigit() else symbol


def _kind_kr_assets() -> list[dict]:
    response = requests.get(
        KIND_CORP_LIST_URL,
        params={"method": "download", "searchType": "13"},
        timeout=12,
    )
    response.raise_for_status()
    response.encoding = "euc-kr"
    frames = pd.read_html(StringIO(response.text), keep_default_na=False)
    if not frames:
        raise ValueError("KRX KIND corporation list is empty")

    rows: list[dict] = []
    for item in frames[0].to_dict("records"):
        market_name = str(item.get("시장구분", "")).strip()
        if market_name == "유가":
            exchange = "KOSPI"
        elif market_name == "코스닥":
            exchange = "KOSDAQ"
        else:
            continue

        symbol = _normalize_kr_symbol(item.get("종목코드", ""))
        name = str(item.get("회사명", "")).strip()
        if not symbol or not name:
            continue

        rows.append(
            {
                "symbol": symbol,
                "name": name,
                "market": "kr",
                "category": "KR Stocks",
                "source": "krx-kind",
                "currency": "KRW",
                "exchange": exchange,
            }
        )
    if not rows:
        raise ValueError("KRX KIND corporation list has no KOSPI/KOSDAQ rows")
    return rows


def _kr_assets() -> list[dict]:
    def loader() -> list[dict]:
        try:
            rows = _kind_kr_assets()
        except Exception:
            rows = []
            for market in ("KOSPI", "KOSDAQ"):
                for ticker in stock.get_market_ticker_list(market=market):
                    rows.append(
                        {
                            "symbol": ticker,
                            "name": stock.get_market_ticker_name(ticker) or ticker,
                            "market": "kr",
                            "category": "KR Stocks",
                            "source": "pykrx",
                            "currency": "KRW",
                            "exchange": market,
                        }
                    )

        try:
            for ticker in stock.get_etf_ticker_list():
                rows.append(
                    {
                        "symbol": ticker,
                        "name": stock.get_etf_ticker_name(ticker) or ticker,
                        "market": "etf",
                        "category": "ETF",
                        "source": "pykrx",
                        "currency": "KRW",
                        "exchange": "KRX ETF",
                    }
                )
        except Exception:
            pass

        return rows

    return _cached("kr-assets", loader)


def search_kr(query: str, limit: int) -> list[AssetSearchResult]:
    results: list[AssetSearchResult] = []
    try:
        assets = _kr_assets()
    except Exception:
        assets = [
            {
                **asset,
                "source": "sample",
                "currency": "KRW",
            }
            for asset in KR_FALLBACKS
        ]

    for asset in assets:
        score = _score(query, asset["symbol"], asset["name"])
        for alias in asset.get("aliases", []):
            score = max(score, _score(query, asset["symbol"], alias))
        if score:
            payload = {key: value for key, value in asset.items() if key != "aliases"}
            results.append(AssetSearchResult(**payload, score=score))
    return _sort_and_limit(results, limit)


def _yahoo_quotes(query: str, limit: int) -> list[dict]:
    def loader() -> list[dict]:
        response = requests.get(
            YAHOO_SEARCH_URL,
            params={"q": query, "quotesCount": max(limit * 3, 20), "newsCount": 0},
            timeout=8,
        )
        response.raise_for_status()
        return response.json().get("quotes", [])

    try:
        return loader()
    except Exception:
        q = query.casefold()
        return [
            row
            for row in [*YAHOO_FALLBACKS, *INDEX_FALLBACKS]
            if q in row["symbol"].casefold() or q in row["name"].casefold()
        ]


def search_yahoo(query: str, limit: int) -> list[AssetSearchResult]:
    results: list[AssetSearchResult] = []
    for quote in _yahoo_quotes(query, limit):
        symbol = quote.get("symbol")
        name = quote.get("longname") or quote.get("shortname") or quote.get("name") or symbol
        quote_type = (quote.get("quoteType") or "").upper()
        if not symbol or not name:
            continue
        if quote_type == "ETF":
            market, category, currency = "etf", "ETF", quote.get("currency") or "USD"
        elif quote_type == "INDEX" or symbol.startswith("^"):
            market, category, currency = "index", "Global Indices", quote.get("currency") or "USD"
        elif quote_type in {"EQUITY", "STOCK"}:
            market, category, currency = "us", "US Stocks", quote.get("currency") or "USD"
        else:
            continue
        score = _score(query, symbol, name)
        results.append(
            AssetSearchResult(
                symbol=symbol,
                name=name,
                market=market,
                category=category,
                source="yahoo",
                currency=currency,
                exchange=quote.get("exchange") or quote.get("exchDisp"),
                score=score or 50,
            )
        )
    return _sort_and_limit(results, limit)


def _binance_symbols() -> list[dict]:
    def loader() -> list[dict]:
        response = requests.get(f"{BINANCE_BASE}/exchangeInfo", timeout=10)
        response.raise_for_status()
        rows: list[dict] = []
        for item in response.json().get("symbols", []):
            if item.get("status") != "TRADING" or item.get("quoteAsset") != "USDT" or not item.get("isSpotTradingAllowed"):
                continue
            base = item["baseAsset"].upper()
            symbol = item["symbol"].upper()
            rows.append(
                {
                    "symbol": symbol,
                    "base": base,
                    "name": CRYPTO_NAMES.get(base, base),
                    "market": "crypto",
                    "category": "Crypto",
                    "source": "binance",
                    "currency": "USDT",
                    "exchange": "Binance Spot",
                }
            )
        return rows

    return _cached("binance-usdt-symbols", loader)


def search_crypto(query: str, limit: int) -> list[AssetSearchResult]:
    try:
        assets = _binance_symbols()
    except Exception:
        assets = [
            {
                "symbol": "BTCUSDT",
                "base": "BTC",
                "name": "Bitcoin",
                "market": "crypto",
                "category": "Crypto",
                "source": "sample",
                "currency": "USDT",
                "exchange": "Binance Spot",
            }
        ]

    results: list[AssetSearchResult] = []
    for asset in assets:
        score = max(_score(query, asset["symbol"], asset["name"]), _score(query, asset["base"], asset["name"]))
        if score:
            payload = {key: value for key, value in asset.items() if key != "base"}
            results.append(AssetSearchResult(**payload, score=score))
    return _sort_and_limit(results, limit)


def search_assets(query: str, markets: str | None = None, limit: int = 10) -> list[AssetSearchResult]:
    q = query.strip()
    if len(q) < 1:
        return []

    filters = MarketFilters.from_csv(markets)
    per_source_limit = max(limit, 10)
    results: list[AssetSearchResult] = []
    if filters.kr or filters.etf:
        kr_results = search_kr(q, per_source_limit)
        results.extend([item for item in kr_results if (item.market == "kr" and filters.kr) or (item.market == "etf" and filters.etf)])
    if filters.us or filters.etf or filters.index:
        yahoo_results = search_yahoo(q, per_source_limit)
        results.extend(
            [
                item
                for item in yahoo_results
                if (item.market == "us" and filters.us)
                or (item.market == "etf" and filters.etf)
                or (item.market == "index" and filters.index)
            ]
        )
    if filters.crypto:
        results.extend(search_crypto(q, per_source_limit))
    return _sort_and_limit(results, limit)

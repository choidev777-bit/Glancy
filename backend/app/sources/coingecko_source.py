"""CoinGecko public metadata endpoints."""

import requests

COINGECKO_BASE = "https://api.coingecko.com/api/v3"


def get_top_coins(limit: int = 20) -> list[dict]:
    response = requests.get(
        f"{COINGECKO_BASE}/coins/markets",
        params={
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": limit,
            "page": 1,
            "sparkline": "false",
        },
        timeout=10,
    )
    response.raise_for_status()

    return [
        {
            "id": coin["id"],
            "symbol": coin["symbol"].upper(),
            "name": coin["name"],
            "market_cap_rank": coin.get("market_cap_rank"),
            "market_cap": coin.get("market_cap"),
            "image": coin.get("image"),
            "current_price": coin.get("current_price"),
            "binance_symbol": f"{coin['symbol'].upper()}USDT",
        }
        for coin in response.json()
    ]


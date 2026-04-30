# Kiwoom REST Provider Skill

## Purpose

Use this skill when the user wants Korean stock quotes or charts to use Kiwoom REST API instead of only pykrx/KRX data.

Kiwoom is optional. The dashboard must continue to work without Kiwoom credentials.

## Provider Modes

| Mode | Behavior |
|------|----------|
| `pykrx` | Default. KRX KIND search, pykrx OHLCV chart, latest daily candle for displayed price. |
| `kiwoom_rest` | Use Kiwoom REST API for quote and chart. If it fails, surface the failure and fallback where configured. |
| `auto` | Prefer Kiwoom REST when env is complete; otherwise use pykrx/KRX without blocking. |

## User Must Configure

AI cannot complete these steps for the user:

1. Apply for Kiwoom REST API access.
2. Issue mock or account App Key and App Secret.
3. Register the backend outbound public IP in the Kiwoom portal.
4. Store secrets in `backend/.env`, never in frontend `.env.local`.
5. Restart the backend after changing env values.

Expected local env keys:

```env
KIWOOM_MODE=mock
KIWOOM_PROVIDER_MODE=auto
KIWOOM_APP_KEY=...
KIWOOM_APP_SECRET=...
KIWOOM_ACCOUNT_NO=...
KIWOOM_API_BASE_URL=https://mockapi.kiwoom.com
```

## AI Must Implement

- Read Kiwoom env only from the backend process.
- Never ask the user to paste App Secret into chat.
- Use OAuth client credentials to obtain and cache an access token.
- Use `api-id` headers for TR calls.
- Use quote data to update current price, change rate, and volume.
- Keep KRX KIND search as the Korean ticker universe.
- Keep pykrx/KRX fallback for judge-safe demos.
- Label UI data source clearly: Kiwoom quote, daily/delayed data, cache, or sample.

## Official REST Shape

Official Kiwoom REST docs describe:

- Token: `POST /oauth2/token`
- Production domain: `https://api.kiwoom.com`
- Mock domain: `https://mockapi.kiwoom.com`
- Token body: `grant_type=client_credentials`, `appkey`, `secretkey`
- TR calls: `authorization: Bearer ...`, `api-id: <TR>`
- Stock info TR: `ka10001`
- Daily chart TR: `ka10081`

## Failure Policy

- Missing env: report `missing_env` in health and use pykrx/KRX.
- Token or API failure: do not crash the dashboard.
- Quote failure: keep existing MarketData-derived price.
- Chart failure in `auto`: fallback to pykrx OHLCV.
- Chart failure in `kiwoom_rest`: surface error so configuration problems are visible during setup.

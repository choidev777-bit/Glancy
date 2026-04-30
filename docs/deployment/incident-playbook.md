# Incident Playbook

## External API Down

Symptom: a category fails to load live market data.

Action:
1. Confirm the UI shows fallback/sample data rather than a blank state.
2. Check Railway logs for the failing provider.
3. Keep `ENABLE_SAMPLE_FALLBACK=true`.
4. Continue the judge demo with the sample fallback explanation.

## CORS Error

Symptom: Vercel loads, but API calls fail in the browser console.

Action:
1. Add the exact Vercel production URL to Railway `ALLOWED_ORIGINS`.
2. Redeploy or restart the Railway service.
3. Hard refresh the browser or retry in incognito.

## DART Key Missing

Symptom: Korean fundamentals fail or return incomplete data.

Action:
1. Verify `DART_API_KEY` in Railway variables.
2. Keep technical analysis and price charts available through fallback mode.
3. Re-run `/health` after updating variables.

## Vercel Build Failure

Symptom: Vercel deployment fails during TypeScript or Vite build.

Action:
1. Reproduce locally with `npm run build`.
2. Fix the first TypeScript error before retrying.
3. Confirm `VITE_API_BASE_URL` is set in Vercel.
4. Redeploy production.

## Railway Health Check Failure

Symptom: Railway deployment reports unhealthy.

Action:
1. Open `/health` from the Railway public URL.
2. Confirm `PORT` is passed to the uvicorn start command.
3. Check `backend/railway.json` start command.
4. Restart the service after environment changes.

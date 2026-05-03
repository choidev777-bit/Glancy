$proxyVars = @(
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "GIT_HTTP_PROXY",
    "GIT_HTTPS_PROXY"
)

foreach ($name in $proxyVars) {
    Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue
}

.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

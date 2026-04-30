from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    dart_api_key: str = ""
    allowed_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174,"
        "http://localhost:5175,http://127.0.0.1:5175"
    )
    port: int = 8000
    enable_sample_fallback: bool = True
    cache_ttl_seconds: int = 300
    kiwoom_mode: str = "mock"
    kiwoom_provider_mode: str = "pykrx"
    kiwoom_app_key: str = ""
    kiwoom_app_secret: str = ""
    kiwoom_account_no: str = ""
    kiwoom_api_base_url: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def effective_kiwoom_base_url(self) -> str:
        if self.kiwoom_api_base_url:
            return self.kiwoom_api_base_url.rstrip("/")
        if self.kiwoom_mode.lower() == "mock":
            return "https://mockapi.kiwoom.com"
        return "https://api.kiwoom.com"


settings = Settings()

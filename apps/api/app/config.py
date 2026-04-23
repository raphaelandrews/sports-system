from pathlib import Path

from pydantic_settings import BaseSettings

_env_file = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/sports"
    SECRET_KEY: str = "change-me"
    FRONTEND_URL: str = "http://localhost:3001"
    BACKEND_PUBLIC_URL: str = "http://localhost:3000"
    PORT: int = 3000
    TIMEZONE: str = "America/Sao_Paulo"
    DEBUG: bool = True
    AUTO_SIMULATE: bool = True
    LLM_API_KEY: str = ""
    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""
    GITHUB_OAUTH_CLIENT_ID: str = ""
    GITHUB_OAUTH_CLIENT_SECRET: str = ""

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    model_config = {"env_file": str(_env_file)}


settings = Settings()

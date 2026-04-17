from pathlib import Path

from pydantic_settings import BaseSettings

_env_file = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/sports"
    SECRET_KEY: str = "change-me"
    FRONTEND_URL: str = "http://localhost:3001"
    PORT: int = 3000
    TIMEZONE: str = "America/Sao_Paulo"

    model_config = {"env_file": str(_env_file)}


settings = Settings()

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/sports"
    SECRET_KEY: str = "change-me"
    FRONTEND_URL: str = "http://localhost:3001"
    PORT: int = 3000

    model_config = {"env_file": ".env"}


settings = Settings()

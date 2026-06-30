import os


class Settings:
    PROJECT_NAME: str = "FRIDAY AI"
    API_V1_STR: str = "/api/v1"

    # Ollama settings
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "phi3:latest")

    # SQLite Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./friday.db")


settings = Settings()

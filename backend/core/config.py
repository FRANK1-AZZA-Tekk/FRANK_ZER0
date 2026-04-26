import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    # API Keys (7 APIs + Anthropic)
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    PERPLEXITY_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # Infrastructure (Redis Sentinel + Postgres Vector)
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_SENTINEL_NODES: List[str] = ["localhost:26379"]
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/frank_db"
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    
    # App Config (Production)
    APP_ENV: str = "production"
    DEBUG: bool = False
    SENTRY_DSN: Optional[str] = None
    LANGFUSE_PUBLIC_KEY: Optional[str] = None
    LANGFUSE_SECRET_KEY: Optional[str] = None
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"
    
    # Performance
    GUNICORN_WORKERS: int = 8
    NVME_CACHE_PATH: str = "/tmp/frank_cache"
    
    # BLE / Voice
    BLE_MTU: int = 512
    OPUS_BITRATE: int = 24000
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

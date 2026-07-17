import os
import json
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Journey Planner API"
    
    # Parse CORS string correctly depending on how it's provided
    raw_cors: str = os.getenv("CORS_ORIGINS", '["*"]')
    try:
        BACKEND_CORS_ORIGINS: list[str] = json.loads(raw_cors)
    except Exception:
        BACKEND_CORS_ORIGINS: list[str] = ["*"]
        
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

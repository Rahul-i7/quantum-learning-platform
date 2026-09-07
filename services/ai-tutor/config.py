"""
Configuration settings for AI Tutor service.
"""
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    # Default model: gemini-3.7-flash with graceful fallback to gemini-3.5-flash-lite
    default_model: str = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
    fallback_models: list[str] = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
    simulation_service_url: str = os.getenv("SIMULATION_SERVICE_URL", "http://localhost:8000")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        or os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
        or os.getenv("SUPABASE_ANON_KEY", "")
    )
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8001"))
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]


settings = Settings()

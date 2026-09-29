"""
Configuration settings for AI Tutor service.
"""
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(override=True)  # .env wins over stale OS environment variables


class Settings(BaseModel):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    # Default model: gemini-2.5-flash with graceful fallback list when high demand/rate limits occur
    default_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    # Tried in order when the primary model is overloaded, rate-limited (429), or unavailable (503/404)
    fallback_models: list[str] = [
        m.strip()
        for m in os.getenv(
            "GEMINI_FALLBACK_MODELS",
            "gemini-2.5-flash,gemini-2.5-flash-lite,gemini-1.5-flash,gemini-2.0-flash,gemini-2.5-pro"
        ).split(",")
        if m.strip()
    ]
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
"""
Configuration settings for the Content, Auth & Progress Service (Role 5).
"""
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_publishable_key: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    simulation_service_url: str = os.getenv("SIMULATION_SERVICE_URL", "http://localhost:8000")

    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8002"))

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]

    # When Supabase isn't configured yet (local dev, demos before the project
    # exists), the service falls back to an in-memory store seeded with the
    # same demo content as supabase/seed.sql. This lets Roles 1/2/4 build
    # against this service before Supabase credentials exist.
    @property
    def supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and (
                self.supabase_service_role_key
                or self.supabase_publishable_key
                or self.supabase_anon_key
            )
        )


settings = Settings()

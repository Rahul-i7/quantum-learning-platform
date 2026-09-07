"""
Minimal PostgREST client for talking to Supabase from the backend.

Deliberately dependency-light (httpx only, same as the ai-tutor and
simulation services) instead of pulling in the full supabase-py SDK.
Uses the service-role key, so RLS policies defined in supabase/schema.sql
do not apply to these calls — that's expected: this service IS the trusted
backend the RLS policies are written to keep everyone else out of.
"""
from __future__ import annotations
import logging
from typing import Any, Optional

import httpx

from config import settings

logger = logging.getLogger("content-progress.supabase")


class SupabaseError(RuntimeError):
    pass


def _headers(prefer: Optional[str] = None) -> dict[str, str]:
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _base_url(table: str) -> str:
    return f"{settings.supabase_url.rstrip('/')}/rest/v1/{table}"


def select(table: str, params: dict[str, Any], timeout: float = 8.0) -> list[dict]:
    try:
        res = httpx.get(_base_url(table), headers=_headers(), params=params, timeout=timeout)
        res.raise_for_status()
        return res.json()
    except httpx.HTTPError as e:
        logger.error(f"Supabase select failed for {table}: {e}")
        raise SupabaseError(str(e)) from e


def insert(table: str, rows: list[dict] | dict, returning: bool = True, timeout: float = 8.0) -> list[dict]:
    prefer = "return=representation" if returning else "return=minimal"
    try:
        res = httpx.post(_base_url(table), headers=_headers(prefer), json=rows, timeout=timeout)
        res.raise_for_status()
        return res.json() if returning else []
    except httpx.HTTPError as e:
        logger.error(f"Supabase insert failed for {table}: {e}")
        raise SupabaseError(str(e)) from e


def upsert(table: str, rows: list[dict] | dict, on_conflict: str, timeout: float = 8.0) -> list[dict]:
    try:
        res = httpx.post(
            _base_url(table),
            headers=_headers("resolution=merge-duplicates,return=representation"),
            params={"on_conflict": on_conflict},
            json=rows,
            timeout=timeout,
        )
        res.raise_for_status()
        return res.json()
    except httpx.HTTPError as e:
        logger.error(f"Supabase upsert failed for {table}: {e}")
        raise SupabaseError(str(e)) from e


def update(table: str, params: dict[str, Any], patch: dict, timeout: float = 8.0) -> list[dict]:
    try:
        res = httpx.patch(
            _base_url(table),
            headers=_headers("return=representation"),
            params=params,
            json=patch,
            timeout=timeout,
        )
        res.raise_for_status()
        return res.json()
    except httpx.HTTPError as e:
        logger.error(f"Supabase update failed for {table}: {e}")
        raise SupabaseError(str(e)) from e

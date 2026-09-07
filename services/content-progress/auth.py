"""
Auth helpers for the Content, Auth & Progress Service.

Supabase Auth issues a JWT to the browser client on login/signup (see
apps/web/lib/supabase/client.ts). The frontend sends it as
`Authorization: Bearer <token>` on requests that touch a specific
learner's data. This module verifies that token and extracts the user id.

Dev-mode fallback: if SUPABASE_JWT_SECRET isn't set (no Supabase project
yet, or local development), we trust the `user_id` field in the request
body instead of requiring a valid token. This keeps the service usable by
the rest of the team before Supabase is fully wired up. Never ship this
fallback path to a real deployment — set SUPABASE_JWT_SECRET there.
"""
from __future__ import annotations
import logging
from typing import Optional

import jwt
from fastapi import Header, HTTPException

from config import settings

logger = logging.getLogger("content-progress.auth")


def verify_token(authorization: Optional[str]) -> Optional[str]:
    """Returns the authenticated user id from a bearer token, or None if no
    token was supplied. Raises HTTPException if a token was supplied but is
    invalid."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1]

    if not settings.supabase_jwt_secret:
        logger.warning("SUPABASE_JWT_SECRET not set — skipping signature verification (dev mode).")
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
        except jwt.PyJWTError as e:
            raise HTTPException(status_code=401, detail=f"Malformed token: {e}") from e
        return payload.get("sub")

    try:
        payload = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}") from e
    return payload.get("sub")


async def get_authenticated_user_id(
    authorization: Optional[str] = Header(default=None),
) -> Optional[str]:
    """FastAPI dependency. Returns the verified user id if a bearer token
    was sent, else None (callers fall back to a body-supplied user_id in
    dev mode — see resolve_user_id below)."""
    return verify_token(authorization)


def resolve_user_id(token_user_id: Optional[str], body_user_id: str) -> str:
    """If a verified token identified a user, that identity wins even if the
    body claims a different user_id — prevents one learner from writing
    another's progress. If there's no token (dev mode / service-to-service
    calls with SUPABASE_JWT_SECRET unset), fall back to the body value."""
    if token_user_id and token_user_id != body_user_id:
        logger.info(f"Body user_id ({body_user_id}) overridden by authenticated identity ({token_user_id}).")
        return token_user_id
    return token_user_id or body_user_id

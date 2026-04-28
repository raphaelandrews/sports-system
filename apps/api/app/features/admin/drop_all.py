"""Drop all tables in the database. Use with caution.

Usage (from apps/api directory):
    uv run python -c "import asyncio; from app.features.admin.drop_all import drop_all; asyncio.run(drop_all())"
"""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

logger = logging.getLogger(__name__)


def _async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


DROP_ALL_SQL = """
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers to avoid FK check errors during drop
    FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
    END LOOP;
END $$;
"""


async def drop_all() -> None:
    """Drop every table in the public schema."""
    engine = create_async_engine(_async_url(settings.DATABASE_URL))
    async with engine.begin() as conn:
        await conn.execute(text(DROP_ALL_SQL))
    await engine.dispose()
    logger.info("drop_all: all tables dropped")


if __name__ == "__main__":
    import asyncio

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    asyncio.run(drop_all())

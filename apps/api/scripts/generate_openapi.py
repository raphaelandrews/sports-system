#!/usr/bin/env python3
"""Generate openapi.json without running the full app (no DB required)."""

import json
import sys
from pathlib import Path

# Patch alembic and seeding before importing app
import app.main as main_module

main_module._run_migrations = lambda: None
main_module.seed_sports = lambda: None

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.main import app as real_app

# Build a clean app with same routes but no lifespan/middleware
app = FastAPI(title=real_app.title, version=real_app.version)
for route in real_app.routes:
    app.routes.append(route)

schema = app.openapi()

out_path = Path(__file__).resolve().parents[1] / "openapi.json"
out_path.write_text(json.dumps(schema, indent=2), encoding="utf-8")
print(f"Generated {out_path}")

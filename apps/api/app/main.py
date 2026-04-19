import logging
import logging.config
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import uvicorn
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.scheduler import setup_scheduler
from app.routers import admin, auth, health, users
from app.routers.athletes import router as athletes_router
from app.routers.delegations import invites_router, router as delegations_router
from app.routers.enrollments import router as enrollments_router
from app.routers.events import events_router, matches_router
from app.routers.sports import modalities_router, router as sports_router
from app.routers.weeks import router as weeks_router
from app.services.seed_service import seed_sports


def _configure_logging() -> None:
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
                    "datefmt": "%Y-%m-%dT%H:%M:%S",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                }
            },
            "root": {"handlers": ["console"], "level": "INFO"},
            "loggers": {
                "uvicorn.access": {"level": "WARNING"},
                "apscheduler": {"level": "WARNING"},
            },
        }
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    _configure_logging()
    await seed_sports()
    sched = setup_scheduler()
    sched.start()
    logging.getLogger(__name__).info("scheduler_started")
    yield
    sched.shutdown(wait=False)
    logging.getLogger(__name__).info("scheduler_stopped")


app = FastAPI(title="Sports System API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "detail": exc.detail,
            "code": str(exc.status_code),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "detail": exc.errors(),
            "code": "422",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logging.getLogger(__name__).exception("unhandled_error path=%s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "detail": "An unexpected error occurred.",
            "code": "500",
        },
    )


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(delegations_router)
app.include_router(invites_router)
app.include_router(sports_router)
app.include_router(modalities_router)
app.include_router(athletes_router)
app.include_router(weeks_router)
app.include_router(events_router)
app.include_router(matches_router)
app.include_router(enrollments_router)
app.include_router(admin.router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

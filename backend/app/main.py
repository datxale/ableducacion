from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
import threading
from typing import List

from app.config import settings
from app.database import create_tables, apply_safe_schema_updates
from app.routers import (
    academic_groups,
    auth,
    users,
    grades,
    subjects,
    months,
    weeks,
    activities,
    activity_submissions,
    planning,
    live_classes,
    enrollments,
    notifications,
    progress,
    reports,
    testimonials,
    news,
    chat,
    uploads,
)
from app.services.live_class_recordings import start_live_class_recording_sync_loop

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_cors_origins() -> List[str]:
    configured_origins = os.getenv("CORS_ORIGINS", "").strip()
    if configured_origins:
        origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
        if origins:
            return origins

    return [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://portal.inaci.edu.pe",
        "https://portal.inaci.edu.pe",
        "http://pontealdia.ableducacion.com",
        "https://pontealdia.ableducacion.com",
    ]


cors_origins = get_cors_origins()
logger.info("CORS origins configurados: %s", cors_origins)

app = FastAPI(
    title="ABLEducacion API",
    description="Plataforma educativa para estudiantes de 6 a 11 años",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(academic_groups.router)
app.include_router(grades.router)
app.include_router(subjects.router)
app.include_router(months.router)
app.include_router(weeks.router)
app.include_router(activities.router)
app.include_router(activity_submissions.router)
app.include_router(planning.router)
app.include_router(live_classes.router)
app.include_router(enrollments.router)
app.include_router(notifications.router)
app.include_router(progress.router)
app.include_router(reports.router)
app.include_router(testimonials.router)
app.include_router(news.router)
app.include_router(chat.router)
app.include_router(uploads.router)


@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando ABLEducacion API...")
    try:
        create_tables()
        apply_safe_schema_updates()
        logger.info("Tablas de base de datos verificadas/creadas correctamente")
        if settings.google_meet_enabled:
            stop_event = threading.Event()
            app.state.live_class_recording_sync_stop_event = stop_event
            app.state.live_class_recording_sync_thread = start_live_class_recording_sync_loop(stop_event)
    except Exception as e:
        logger.error(f"Error al crear tablas: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    stop_event = getattr(app.state, "live_class_recording_sync_stop_event", None)
    sync_thread = getattr(app.state, "live_class_recording_sync_thread", None)
    if stop_event is not None:
        stop_event.set()
    if sync_thread is not None:
        sync_thread.join(timeout=5)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "ABLEducacion API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "ableducacion-api"}

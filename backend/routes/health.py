from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from db.database import get_db
from scheduler.scheduler import get_scheduler_status
from datetime import datetime

router = APIRouter()


@router.get("/")
def root():
    return {
        "service": "Procura API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "procura-api",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": db_status,
        "service": "procura-api",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health/scheduler")
def scheduler_health():
    status = get_scheduler_status()
    return {
        "status": "running" if status["running"] else "stopped",
        "scheduler": status,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health/full")
def full_health_check(db: Session = Depends(get_db)):
    db_status = False
    try:
        db.execute(text("SELECT 1"))
        db_status = True
    except Exception:
        pass

    scheduler_status = get_scheduler_status()

    return {
        "status": "healthy" if db_status else "degraded",
        "checks": {
            "database": "passed" if db_status else "failed",
            "scheduler": "running" if scheduler_status["running"] else "stopped",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

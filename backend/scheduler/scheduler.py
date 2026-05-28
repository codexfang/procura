import logging
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from scheduler.jobs import run_full_pipeline

logger = logging.getLogger(__name__)

INTERVAL_MINUTES = int(os.getenv("SCHEDULER_INTERVAL_MINUTES", "15"))

scheduler = BackgroundScheduler()


def start_scheduler():
    if scheduler.running:
        logger.warning("Scheduler already running")
        return

    scheduler.add_job(
        run_full_pipeline,
        trigger=IntervalTrigger(minutes=INTERVAL_MINUTES),
        id="rfp_pipeline",
        name="RFP ingestion and matching pipeline",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        "Background scheduler started with %d-minute interval",
        INTERVAL_MINUTES,
    )


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")


def get_scheduler_status() -> dict:
    jobs = scheduler.get_jobs()
    return {
        "running": scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": str(job.next_run_time) if job.next_run_time else None,
            }
            for job in jobs
        ],
    }

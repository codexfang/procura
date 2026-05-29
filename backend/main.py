import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.migrations import run_migrations
from scheduler.scheduler import start_scheduler, stop_scheduler
from scheduler.jobs import run_full_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Procura API server")
    run_migrations()
    start_scheduler()
    logger.info("Running initial pipeline...")
    run_full_pipeline()
    yield
    stop_scheduler()
    logger.info("Procura API server stopped")


app = FastAPI(
    title="Procura API",
    description="AI-assisted RFP monitoring and response drafting system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://codexfang.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes.health import router as health_router
from routes.users import router as users_router
from routes.rfps import router as rfps_router
from routes.matches import router as matches_router
from routes.drafts import router as drafts_router
from routes.responses import router as responses_router

app.include_router(health_router)
app.include_router(users_router)
app.include_router(rfps_router)
app.include_router(matches_router)
app.include_router(drafts_router)
app.include_router(responses_router)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)

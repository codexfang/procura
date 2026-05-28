import logging
from datetime import datetime
from db.database import SessionLocal
from services.rfp_ingestion import fetch_rfp_listings
from services.matching_engine import run_matching_for_all_users

logger = logging.getLogger(__name__)


def ingest_new_rfps():
    db = SessionLocal()
    try:
        new_listings = fetch_rfp_listings(db)
        logger.info(
            "RFP ingestion completed: %d new listings imported",
            len(new_listings),
        )
        return len(new_listings)
    except Exception as e:
        logger.error("RFP ingestion failed: %s", str(e))
        return 0
    finally:
        db.close()


def update_match_scores():
    db = SessionLocal()
    try:
        results = run_matching_for_all_users(db)
        total_matches = sum(results.values())
        logger.info(
            "Match score update completed: %d users processed, %d total matches",
            len(results),
            total_matches,
        )
        return results
    except Exception as e:
        logger.error("Match score update failed: %s", str(e))
        return {}
    finally:
        db.close()


def run_full_pipeline():
    start = datetime.utcnow()
    logger.info("Starting full pipeline run at %s", start.isoformat())

    new_count = ingest_new_rfps()
    match_results = update_match_scores()

    elapsed = (datetime.utcnow() - start).total_seconds()
    logger.info(
        "Pipeline completed in %.2fs: %d new RFPs, %d user matches processed",
        elapsed,
        new_count,
        len(match_results),
    )

    return {
        "new_rfps": new_count,
        "users_matched": len(match_results),
        "elapsed_seconds": elapsed,
    }

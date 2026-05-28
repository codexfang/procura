import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.match import Match
from models.rfp_listing import RFPListing
from services.matching_engine import get_user_matches, get_match_by_id

router = APIRouter(prefix="/api/matches", tags=["matches"])


class MatchResponse(BaseModel):
    id: str
    user_id: str
    rfp_id: str
    relevance_score: float
    match_reasons: List[str]
    keyword_matches: List[str]
    capability_matches: List[str]
    score_breakdown: dict
    status: str
    is_read: bool
    rfp: Optional[dict] = None
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True


@router.get("", response_model=dict)
def list_matches(
    user_id: uuid.UUID = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    min_score: float = Query(0, ge=0, le=100),
    db: Session = Depends(get_db),
):
    matches = get_user_matches(db, user_id, skip, limit, min_score)
    total = db.query(Match).filter(
        Match.user_id == user_id,
        Match.relevance_score >= min_score,
    ).count()

    return {
        "total": total,
        "items": [_format_match(m, db) for m in matches],
        "skip": skip,
        "limit": limit,
    }


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: uuid.UUID, db: Session = Depends(get_db)):
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return _format_match(match, db)


@router.patch("/{match_id}/read", response_model=MatchResponse)
def mark_as_read(match_id: uuid.UUID, db: Session = Depends(get_db)):
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match.is_read = True
    db.commit()
    db.refresh(match)
    return _format_match(match, db)


@router.patch("/{match_id}/status", response_model=MatchResponse)
def update_match_status(
    match_id: uuid.UUID,
    status: str = Query(...),
    db: Session = Depends(get_db),
):
    valid_statuses = ["pending", "reviewed", "accepted", "rejected", "archived"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match.status = status
    db.commit()
    db.refresh(match)
    return _format_match(match, db)


def _format_match(match: Match, db: Session) -> dict:
    rfp = db.query(RFPListing).filter(RFPListing.id == match.rfp_id).first()
    rfp_data = None
    if rfp:
        rfp_data = {
            "id": str(rfp.id),
            "title": rfp.title,
            "agency": rfp.agency,
            "description": rfp.description,
            "naics_code": rfp.naics_code,
            "set_aside": rfp.set_aside,
            "posted_date": rfp.posted_date.isoformat() if rfp.posted_date else None,
            "response_deadline": rfp.response_deadline.isoformat() if rfp.response_deadline else None,
            "award_amount": rfp.award_amount,
            "status": rfp.status,
            "categories": rfp.categories or [],
            "requirements": rfp.requirements or [],
        }

    return {
        "id": str(match.id),
        "user_id": str(match.user_id),
        "rfp_id": str(match.rfp_id),
        "relevance_score": match.relevance_score,
        "match_reasons": match.match_reasons or [],
        "keyword_matches": match.keyword_matches or [],
        "capability_matches": match.capability_matches or [],
        "score_breakdown": match.score_breakdown or {},
        "status": match.status,
        "is_read": match.is_read,
        "rfp": rfp_data,
        "created_at": match.created_at.isoformat() if match.created_at else None,
        "updated_at": match.updated_at.isoformat() if match.updated_at else None,
    }

import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.rfp_listing import RFPListing
from services.rfp_ingestion import get_active_listings, get_listing_by_id, get_total_listing_count

router = APIRouter(prefix="/api/rfps", tags=["rfps"])


class RFPResponse(BaseModel):
    id: str
    title: str
    agency: Optional[str]
    description: Optional[str]
    naics_code: Optional[str]
    set_aside: Optional[str]
    posted_date: Optional[str]
    response_deadline: Optional[str]
    award_amount: Optional[float]
    status: str
    categories: List[str]
    requirements: List[str]
    contact_info: dict
    is_active: bool
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True


@router.get("", response_model=dict)
def list_rfps(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    agency: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(RFPListing).filter(RFPListing.is_active == True)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.text(
                "title ILIKE :search OR description ILIKE :search OR agency ILIKE :search"
            ).bindparams(search=search_term)
        )

    if status:
        query = query.filter(RFPListing.status == status)

    if agency:
        query = query.filter(RFPListing.agency.ilike(f"%{agency}%"))

    total = query.count()
    listings = query.order_by(RFPListing.posted_date.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [_format_listing(l) for l in listings],
        "skip": skip,
        "limit": limit,
    }


@router.get("/{rfp_id}", response_model=RFPResponse)
def get_rfp(rfp_id: uuid.UUID, db: Session = Depends(get_db)):
    listing = get_listing_by_id(db, rfp_id)
    if not listing:
        raise HTTPException(status_code=404, detail="RFP listing not found")
    return _format_listing(listing)


@router.get("/stats/summary", response_model=dict)
def get_rfp_stats(db: Session = Depends(get_db)):
    total = get_total_listing_count(db)
    open_count = db.query(RFPListing).filter(
        RFPListing.is_active == True,
        RFPListing.status == "open",
    ).count()

    return {
        "total": total,
        "open": open_count,
        "agencies": db.query(RFPListing.agency).distinct().count(),
    }


def _format_listing(l: RFPListing) -> dict:
    return {
        "id": str(l.id),
        "title": l.title,
        "agency": l.agency,
        "description": l.description,
        "naics_code": l.naics_code,
        "set_aside": l.set_aside,
        "posted_date": l.posted_date.isoformat() if l.posted_date else None,
        "response_deadline": l.response_deadline.isoformat() if l.response_deadline else None,
        "award_amount": l.award_amount,
        "status": l.status,
        "categories": l.categories or [],
        "requirements": l.requirements or [],
        "contact_info": l.contact_info or {},
        "is_active": l.is_active,
        "created_at": l.created_at.isoformat() if l.created_at else None,
        "updated_at": l.updated_at.isoformat() if l.updated_at else None,
    }

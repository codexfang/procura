import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.user import User
from models.rfp_listing import RFPListing
from models.match import Match
from models.draft import GeneratedDraft
from services.draft_generator import generate_draft, get_draft_by_id, get_user_drafts, update_draft

router = APIRouter(prefix="/api/drafts", tags=["drafts"])


class DraftRequest(BaseModel):
    user_id: str
    rfp_id: str
    match_id: Optional[str] = None


class DraftUpdate(BaseModel):
    overview: Optional[str] = None
    capability_mapping: Optional[dict] = None
    compliance_checklist: Optional[list] = None
    suggested_sections: Optional[list] = None
    full_draft: Optional[str] = None
    status: Optional[str] = None


class DraftResponse(BaseModel):
    id: str
    user_id: str
    rfp_id: str
    match_id: Optional[str]
    overview: Optional[str]
    capability_mapping: dict
    compliance_checklist: list
    suggested_sections: list
    full_draft: Optional[str]
    status: str
    source: str
    is_edited: bool
    rfp: Optional[dict] = None
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True


@router.post("", response_model=DraftResponse, status_code=201)
def create_draft(data: DraftRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == uuid.UUID(data.user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    rfp = db.query(RFPListing).filter(RFPListing.id == uuid.UUID(data.rfp_id)).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP listing not found")

    match = None
    if data.match_id:
        match = db.query(Match).filter(Match.id == uuid.UUID(data.match_id)).first()

    draft = generate_draft(db, user, rfp, match)
    return _format_draft(draft, rfp)


@router.get("", response_model=dict)
def list_drafts(
    user_id: uuid.UUID = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    drafts = get_user_drafts(db, user_id, skip, limit)
    total = db.query(GeneratedDraft).filter(
        GeneratedDraft.user_id == user_id
    ).count()

    return {
        "total": total,
        "items": [_format_draft(d, None) for d in drafts],
        "skip": skip,
        "limit": limit,
    }


@router.get("/{draft_id}", response_model=DraftResponse)
def get_draft(draft_id: uuid.UUID, db: Session = Depends(get_db)):
    draft = get_draft_by_id(db, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    rfp = db.query(RFPListing).filter(RFPListing.id == draft.rfp_id).first()
    return _format_draft(draft, rfp)


@router.put("/{draft_id}", response_model=DraftResponse)
def update_draft_endpoint(
    draft_id: uuid.UUID,
    data: DraftUpdate,
    db: Session = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    draft = update_draft(db, draft_id, update_data)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    rfp = db.query(RFPListing).filter(RFPListing.id == draft.rfp_id).first()
    return _format_draft(draft, rfp)


def _format_draft(draft: GeneratedDraft, rfp: Optional[RFPListing]) -> dict:
    rfp_data = None
    if rfp:
        rfp_data = {
            "id": str(rfp.id),
            "title": rfp.title,
            "agency": rfp.agency,
            "description": rfp.description,
            "naics_code": rfp.naics_code,
            "set_aside": rfp.set_aside,
            "response_deadline": rfp.response_deadline.isoformat() if rfp.response_deadline else None,
            "award_amount": rfp.award_amount,
            "categories": rfp.categories or [],
            "requirements": rfp.requirements or [],
        }

    return {
        "id": str(draft.id),
        "user_id": str(draft.user_id),
        "rfp_id": str(draft.rfp_id),
        "match_id": str(draft.match_id) if draft.match_id else None,
        "overview": draft.overview,
        "capability_mapping": draft.capability_mapping or {},
        "compliance_checklist": draft.compliance_checklist or [],
        "suggested_sections": draft.suggested_sections or [],
        "full_draft": draft.full_draft,
        "status": draft.status,
        "source": draft.source,
        "is_edited": draft.is_edited,
        "rfp": rfp_data,
        "created_at": draft.created_at.isoformat() if draft.created_at else None,
        "updated_at": draft.updated_at.isoformat() if draft.updated_at else None,
    }

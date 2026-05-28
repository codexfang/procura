import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.saved_response import SavedResponse

router = APIRouter(prefix="/api/responses", tags=["responses"])


class ResponseCreate(BaseModel):
    user_id: str
    rfp_id: str
    draft_id: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    sections: List[dict] = []


class ResponseUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    sections: Optional[List[dict]] = None
    status: Optional[str] = None


class ResponseResponse(BaseModel):
    id: str
    user_id: str
    draft_id: Optional[str]
    rfp_id: str
    title: Optional[str]
    content: Optional[str]
    sections: list
    status: str
    version: int
    submitted_at: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True


@router.post("", response_model=ResponseResponse, status_code=201)
def create_response(data: ResponseCreate, db: Session = Depends(get_db)):
    response = SavedResponse(
        id=uuid.uuid4(),
        user_id=uuid.UUID(data.user_id),
        rfp_id=uuid.UUID(data.rfp_id),
        draft_id=uuid.UUID(data.draft_id) if data.draft_id else None,
        title=data.title,
        content=data.content,
        sections=data.sections,
        status="in_progress",
        version=1,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return _format_response(response)


@router.get("", response_model=dict)
def list_responses(
    user_id: uuid.UUID = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    responses = (
        db.query(SavedResponse)
        .filter(SavedResponse.user_id == user_id)
        .order_by(SavedResponse.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(SavedResponse).filter(
        SavedResponse.user_id == user_id
    ).count()

    return {
        "total": total,
        "items": [_format_response(r) for r in responses],
        "skip": skip,
        "limit": limit,
    }


@router.get("/{response_id}", response_model=ResponseResponse)
def get_response(response_id: uuid.UUID, db: Session = Depends(get_db)):
    response = db.query(SavedResponse).filter(
        SavedResponse.id == response_id
    ).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    return _format_response(response)


@router.put("/{response_id}", response_model=ResponseResponse)
def update_response(
    response_id: uuid.UUID,
    data: ResponseUpdate,
    db: Session = Depends(get_db),
):
    response = db.query(SavedResponse).filter(
        SavedResponse.id == response_id
    ).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(response, key, value)

    response.version += 1
    db.commit()
    db.refresh(response)
    return _format_response(response)


@router.delete("/{response_id}", status_code=204)
def delete_response(response_id: uuid.UUID, db: Session = Depends(get_db)):
    response = db.query(SavedResponse).filter(
        SavedResponse.id == response_id
    ).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    db.delete(response)
    db.commit()


def _format_response(response: SavedResponse) -> dict:
    return {
        "id": str(response.id),
        "user_id": str(response.user_id),
        "draft_id": str(response.draft_id) if response.draft_id else None,
        "rfp_id": str(response.rfp_id),
        "title": response.title,
        "content": response.content,
        "sections": response.sections or [],
        "status": response.status,
        "version": response.version,
        "submitted_at": response.submitted_at.isoformat() if response.submitted_at else None,
        "created_at": response.created_at.isoformat() if response.created_at else None,
        "updated_at": response.updated_at.isoformat() if response.updated_at else None,
    }

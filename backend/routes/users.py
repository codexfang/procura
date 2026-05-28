import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.user import User

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    email: str
    company_name: Optional[str] = None
    industry: Optional[str] = None
    capabilities: List[str] = []
    keywords: List[str] = []
    tags: List[str] = []


class UserUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    capabilities: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    settings: Optional[dict] = None


class UserResponse(BaseModel):
    id: str
    email: str
    company_name: Optional[str]
    industry: Optional[str]
    capabilities: List[str]
    keywords: List[str]
    tags: List[str]
    settings: dict
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.post("", response_model=UserResponse, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="User with this email already exists")

    user = User(
        id=uuid.uuid4(),
        email=data.email,
        company_name=data.company_name,
        industry=data.industry,
        capabilities=data.capabilities or [],
        keywords=data.keywords or [],
        tags=data.tags or [],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _format_user(user)


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [_format_user(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _format_user(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return _format_user(user)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


def _format_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "company_name": user.company_name,
        "industry": user.industry,
        "capabilities": user.capabilities or [],
        "keywords": user.keywords or [],
        "tags": user.tags or [],
        "settings": user.settings or {},
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }

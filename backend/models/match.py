import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rfp_id = Column(UUID(as_uuid=True), ForeignKey("rfp_listings.id"), nullable=False)
    relevance_score = Column(Float, default=0.0)
    match_reasons = Column(JSON, default=list)
    keyword_matches = Column(JSON, default=list)
    capability_matches = Column(JSON, default=list)
    score_breakdown = Column(JSON, default=dict)
    status = Column(String(50), default="pending")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

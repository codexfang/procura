import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class SavedResponse(Base):
    __tablename__ = "saved_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    draft_id = Column(UUID(as_uuid=True), ForeignKey("generated_drafts.id"), nullable=True)
    rfp_id = Column(UUID(as_uuid=True), ForeignKey("rfp_listings.id"), nullable=False)
    title = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    sections = Column(JSON, default=list)
    status = Column(String(50), default="in_progress")
    version = Column(Integer, default=1)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

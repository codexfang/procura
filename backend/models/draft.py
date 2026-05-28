import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class GeneratedDraft(Base):
    __tablename__ = "generated_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rfp_id = Column(UUID(as_uuid=True), ForeignKey("rfp_listings.id"), nullable=False)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id"), nullable=True)
    overview = Column(Text, nullable=True)
    capability_mapping = Column(JSON, default=dict)
    compliance_checklist = Column(JSON, default=list)
    suggested_sections = Column(JSON, default=list)
    full_draft = Column(Text, nullable=True)
    status = Column(String(50), default="draft")
    source = Column(String(50), default="template")
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

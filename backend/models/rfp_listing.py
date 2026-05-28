import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, Float, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class RFPListing(Base):
    __tablename__ = "rfp_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String(255), unique=True, nullable=True)
    title = Column(String(500), nullable=False)
    agency = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    naics_code = Column(String(50), nullable=True)
    set_aside = Column(String(100), nullable=True)
    posted_date = Column(DateTime, nullable=True)
    response_deadline = Column(DateTime, nullable=True)
    award_amount = Column(Float, nullable=True)
    status = Column(String(50), default="open")
    source_url = Column(Text, nullable=True)
    categories = Column(JSON, default=list)
    requirements = Column(JSON, default=list)
    contact_info = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models.user import User
from models.rfp_listing import RFPListing
from models.match import Match
from models.draft import GeneratedDraft
from services.openai_service import generate_draft_with_openai, is_openai_available


TEMPLATE_SECTIONS = [
    {
        "heading": "Executive Summary",
        "prompt": "Provide a concise executive summary highlighting key qualifications and approach.",
        "content": "",
    },
    {
        "heading": "Technical Approach",
        "prompt": "Describe the methodology and technical approach for fulfilling the requirements.",
        "content": "",
    },
    {
        "heading": "Capability Statement",
        "prompt": "Detail relevant capabilities, certifications, and past performance examples.",
        "content": "",
    },
    {
        "heading": "Key Personnel",
        "prompt": "List key personnel with relevant qualifications and experience.",
        "content": "",
    },
    {
        "heading": "Project Management Plan",
        "prompt": "Outline project management approach, timeline, and deliverables.",
        "content": "",
    },
    {
        "heading": "Compliance Matrix",
        "prompt": "Map each requirement to the proposed approach and compliance status.",
        "content": "",
    },
    {
        "heading": "Pricing Summary",
        "prompt": "Provide a high-level pricing structure and justification.",
        "content": "",
    },
]


def generate_compliance_checklist(rfp: RFPListing) -> list:
    checklist = []
    requirements = rfp.requirements or []
    for req in requirements:
        checklist.append(
            {
                "requirement": req,
                "status": "not_addressed",
                "notes": "",
            }
        )
    standard_items = [
        "SAM.gov registration active",
        "Unique Entity ID (UEI) obtained",
        "Business size certification current",
        "NAICS code classification verified",
        "Past performance references available",
    ]
    for item in standard_items:
        checklist.append(
            {
                "requirement": item,
                "status": "not_addressed",
                "notes": "",
            }
        )
    return checklist


def generate_capability_mapping(
    rfp: RFPListing,
    user: User,
) -> Dict[str, Any]:
    mapping = {}
    user_capabilities = user.capabilities or []
    rfp_categories = rfp.categories or []

    for cap in user_capabilities:
        matched_categories = []
        for cat in rfp_categories:
            if cap.lower() in cat.lower() or cat.lower() in cap.lower():
                matched_categories.append(cat)
        mapping[cap] = {
            "matched_categories": matched_categories,
            "relevance": "high" if matched_categories else "medium",
        }

    return mapping


def generate_draft(
    db: Session,
    user: User,
    rfp: RFPListing,
    match: Optional[Match] = None,
) -> GeneratedDraft:
    capability_mapping = generate_capability_mapping(rfp, user)
    compliance_checklist = generate_compliance_checklist(rfp)

    overview = f"""Proposal response for {rfp.title} issued by {rfp.agency}.

This draft outlines the approach, capabilities, and qualifications for fulfilling the requirements outlined in the solicitation. The response is structured to demonstrate strong alignment with the agency's needs and objectives."""

    openai_draft = None
    source = "template"

    if is_openai_available():
        openai_draft = generate_draft_with_openai(
            rfp_title=rfp.title,
            rfp_description=rfp.description or "",
            user_capabilities=user.capabilities or [],
        )
        if openai_draft:
            source = "ai_generated"

    draft = GeneratedDraft(
        id=uuid.uuid4(),
        user_id=user.id,
        rfp_id=rfp.id,
        match_id=match.id if match else None,
        overview=overview,
        capability_mapping=capability_mapping,
        compliance_checklist=compliance_checklist,
        suggested_sections=TEMPLATE_SECTIONS,
        full_draft=openai_draft or overview,
        status="draft",
        source=source,
    )

    db.add(draft)
    db.commit()
    db.refresh(draft)

    return draft


def get_draft_by_id(
    db: Session,
    draft_id: uuid.UUID,
) -> Optional[GeneratedDraft]:
    return db.query(GeneratedDraft).filter(GeneratedDraft.id == draft_id).first()


def get_user_drafts(
    db: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> list:
    return (
        db.query(GeneratedDraft)
        .filter(GeneratedDraft.user_id == user_id)
        .order_by(GeneratedDraft.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_draft(
    db: Session,
    draft_id: uuid.UUID,
    updates: Dict[str, Any],
) -> Optional[GeneratedDraft]:
    draft = get_draft_by_id(db, draft_id)
    if not draft:
        return None

    for key, value in updates.items():
        if hasattr(draft, key):
            setattr(draft, key, value)

    draft.is_edited = True
    draft.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(draft)
    return draft

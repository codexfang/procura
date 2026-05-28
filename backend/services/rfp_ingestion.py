import uuid
import hashlib
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.rfp_listing import RFPListing


SAMPLE_RFPS = [
    {
        "title": "Enterprise Cloud Infrastructure Modernization Services",
        "agency": "Department of Homeland Security",
        "description": "The Department of Homeland Security seeks qualified vendors to provide enterprise cloud infrastructure modernization services, including migration planning, implementation, and ongoing management of cloud-based systems for mission-critical applications.",
        "naics_code": "541512",
        "set_aside": "Small Business",
        "categories": ["cloud", "infrastructure", "cybersecurity", "IT services"],
        "requirements": ["SOC 2 compliance", "FedRAMP certification", "CMMC Level 3"],
        "response_deadline_days": 45,
        "award_amount_range": (5000000, 15000000),
    },
    {
        "title": "AI-Powered Document Processing and Workflow Automation Platform",
        "agency": "General Services Administration",
        "description": "GSA requires an AI-powered document processing and workflow automation platform capable of handling large volumes of government forms, extracting structured data, and integrating with existing federal record management systems.",
        "naics_code": "541511",
        "set_aside": "8(a)",
        "categories": ["AI", "machine learning", "document processing", "automation"],
        "requirements": ["FedRAMP Moderate", "Section 508 compliance", "FIPS 140-2"],
        "response_deadline_days": 60,
        "award_amount_range": (3000000, 8000000),
    },
    {
        "title": "Cybersecurity Risk Assessment and Penetration Testing Services",
        "agency": "Department of Defense",
        "description": "The DoD is seeking cybersecurity risk assessment and penetration testing services for its network infrastructure, including vulnerability assessments, threat modeling, and remediation planning across classified and unclassified environments.",
        "naics_code": "541690",
        "set_aside": "Service-Disabled Veteran-Owned",
        "categories": ["cybersecurity", "penetration testing", "risk assessment", "defense"],
        "requirements": ["Top Secret clearance", "CISSP-certified staff", "NIST SP 800-53 compliance"],
        "response_deadline_days": 30,
        "award_amount_range": (2000000, 5000000),
    },
    {
        "title": "Healthcare Data Interoperability and FHIR API Integration Platform",
        "agency": "Department of Veterans Affairs",
        "description": "The VA requires a healthcare data interoperability platform using FHIR standards to enable seamless data exchange between VA medical facilities, community care providers, and third-party health applications.",
        "naics_code": "541512",
        "set_aside": "Small Business",
        "categories": ["healthcare", "data interoperability", "FHIR", "API"],
        "requirements": ["HIPAA compliance", "FHIR R4 certification", "HITRUST CSF"],
        "response_deadline_days": 50,
        "award_amount_range": (4000000, 12000000),
    },
    {
        "title": "Geospatial Intelligence Data Analytics Platform",
        "agency": "National Geospatial-Intelligence Agency",
        "description": "NGA seeks a geospatial intelligence data analytics platform that processes satellite imagery, sensor data, and open-source intelligence to provide actionable insights for national security missions.",
        "naics_code": "541360",
        "set_aside": None,
        "categories": ["geospatial", "intelligence", "data analytics", "satellite"],
        "requirements": ["TS/SCI clearance", "GDEL framework experience", "Cloud-based deployment"],
        "response_deadline_days": 45,
        "award_amount_range": (10000000, 25000000),
    },
    {
        "title": "IT Service Management and Help Desk Support Solutions",
        "agency": "Department of the Treasury",
        "description": "The Treasury Department requires IT service management solutions including enterprise help desk support, incident management, change management, and IT asset management following ITIL best practices.",
        "naics_code": "541519",
        "set_aside": "HUBZone",
        "categories": ["ITSM", "help desk", "ITIL", "service management"],
        "requirements": ["ITIL 4 certification", "ISO 20000", "Tier 1-3 support capability"],
        "response_deadline_days": 35,
        "award_amount_range": (1500000, 4000000),
    },
    {
        "title": "Zero Trust Architecture Implementation and Network Modernization",
        "agency": "Department of Energy",
        "description": "The DOE is seeking vendors to design and implement a Zero Trust Architecture across its national laboratory network, including identity management, micro-segmentation, continuous monitoring, and automated threat response.",
        "naics_code": "541512",
        "set_aside": "Small Business",
        "categories": ["zero trust", "network security", "identity management", "cybersecurity"],
        "requirements": ["Zero Trust Maturity Model expertise", "FedRAMP High", "NIST 800-207"],
        "response_deadline_days": 55,
        "award_amount_range": (6000000, 18000000),
    },
]


def fetch_rfp_listings(db: Session) -> List[RFPListing]:
    new_listings = []
    for sample in SAMPLE_RFPS:
        content_hash = hashlib.sha256(
            f"{sample['title']}{sample['agency']}".encode()
        ).hexdigest()

        existing = db.query(RFPListing).filter(
            RFPListing.external_id == content_hash
        ).first()

        if existing:
            continue

        from datetime import timedelta

        listing = RFPListing(
            id=uuid.uuid4(),
            external_id=content_hash,
            title=sample["title"],
            agency=sample["agency"],
            description=sample["description"],
            naics_code=sample["naics_code"],
            set_aside=sample["set_aside"],
            posted_date=datetime.utcnow(),
            response_deadline=datetime.utcnow()
            + timedelta(days=sample["response_deadline_days"]),
            award_amount=sample["award_amount_range"][1],
            status="open",
            categories=sample["categories"],
            requirements=sample["requirements"],
            is_active=True,
        )
        db.add(listing)
        new_listings.append(listing)

    if new_listings:
        db.commit()

    return new_listings


def get_active_listings(db: Session, skip: int = 0, limit: int = 50) -> List[RFPListing]:
    return (
        db.query(RFPListing)
        .filter(RFPListing.is_active == True)
        .order_by(RFPListing.posted_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_listing_by_id(db: Session, listing_id: uuid.UUID) -> Optional[RFPListing]:
    return db.query(RFPListing).filter(RFPListing.id == listing_id).first()


def get_total_listing_count(db: Session) -> int:
    return db.query(func.count(RFPListing.id)).filter(RFPListing.is_active == True).scalar()

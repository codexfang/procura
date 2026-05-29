import uuid
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.rfp_listing import RFPListing


AGENCIES = [
    "Department of Homeland Security",
    "Department of Defense",
    "General Services Administration",
    "Department of Veterans Affairs",
    "Department of Energy",
    "Department of the Treasury",
    "Department of Health and Human Services",
    "Department of Transportation",
    "Department of Commerce",
    "Department of Justice",
    "Department of State",
    "Department of the Interior",
    "Department of Agriculture",
    "Department of Education",
    "Department of Housing and Urban Development",
    "National Aeronautics and Space Administration",
    "National Security Agency",
    "Federal Bureau of Investigation",
    "Environmental Protection Agency",
    "Social Security Administration",
    "United States Postal Service",
    "National Institutes of Health",
    "Centers for Disease Control and Prevention",
    "Federal Aviation Administration",
    "National Oceanic and Atmospheric Administration",
]

NAICS_CODES = [
    ("541512", "Computer Systems Design Services"),
    ("541511", "Custom Computer Programming Services"),
    ("541690", "Other Scientific and Technical Consulting Services"),
    ("541519", "Other Computer Related Services"),
    ("541360", "Geophysical Surveying and Mapping Services"),
    ("541611", "Administrative Management and General Management Consulting Services"),
    ("541620", "Environmental Consulting Services"),
    ("541330", "Engineering Services"),
    ("541990", "All Other Professional, Scientific, and Technical Services"),
    ("561210", "Facilities Support Services"),
    ("561110", "Office Administrative Services"),
    ("611420", "Computer Training"),
    ("811210", "Electronic and Precision Equipment Repair and Maintenance"),
    ("334111", "Electronic Computer Manufacturing"),
    ("334210", "Telephone Apparatus Manufacturing"),
    ("335931", "Current-Carrying Wiring Device Manufacturing"),
    ("423430", "Computer and Computer Peripheral Equipment and Software Merchant Wholesalers"),
    ("517111", "Wired Telecommunications Carriers"),
    ("518210", "Data Processing, Hosting, and Related Services"),
    ("541715", "Research and Development in the Physical, Engineering, and Life Sciences"),
]

SET_ASIDES = [
    "Small Business",
    "8(a)",
    "Service-Disabled Veteran-Owned",
    "HUBZone",
    "Women-Owned Small Business",
    None,
]

CATEGORY_POOLS = {
    "cloud": ["cloud", "infrastructure", "devops", "containerization", "AWS", "Azure", "GCP"],
    "cybersecurity": ["cybersecurity", "penetration testing", "risk assessment", "zero trust", "IAM", "encryption", "threat intelligence"],
    "ai": ["AI", "machine learning", "deep learning", "NLP", "computer vision", "predictive analytics", "LLM"],
    "data": ["data analytics", "data engineering", "data visualization", "ETL", "data warehouse", "big data", "data governance"],
    "healthcare": ["healthcare", "health IT", "FHIR", "HIPAA", "electronic health records", "telehealth", "medical devices"],
    "defense": ["defense", "national security", "intelligence", "C4ISR", "electronic warfare", "mission systems"],
    "network": ["network", "telecommunications", "5G", "satellite", "SD-WAN", "optical", "broadband"],
    "software": ["software development", "web applications", "mobile apps", "API", "microservices", "DevSecOps"],
    "infrastructure": ["physical security", "facilities", "construction", "HVAC", "electrical", "civil engineering"],
    "training": ["training", "workforce development", "e-learning", "simulation", "VR/AR training", "certification"],
}

SAMPLE_REQUIREMENTS_POOL = [
    "FedRAMP Moderate certification",
    "FedRAMP High certification",
    "SOC 2 Type II compliance",
    "ISO 27001 certification",
    "HIPAA compliance",
    "NIST SP 800-53 compliance",
    "NIST SP 800-171 compliance",
    "CMMC Level 2 certification",
    "CMMC Level 3 certification",
    "FIPS 140-2 compliance",
    "Section 508 compliance",
    "ITIL 4 certification",
    "Top Secret security clearance",
    "TS/SCI security clearance",
    "DOE Q clearance",
    "CISSP-certified staff",
    "PMP-certified project manager",
    "AWS Certified Solutions Architect",
    "HITRUST CSF certification",
    "FISMA compliance",
    "DIACAP compliance",
    "RMF certification",
    "Six Sigma Black Belt",
    "LEED certification",
    "OSHA 30-hour certification",
]

TITLE_TEMPLATES = [
    "{category} {modifier} {focus} for {agency_short}",
    "{modifier} {category} {focus} Services",
    "Enterprise {category} {modifier} {focus} Platform",
    "{focus} {modifier} System - {category}",
    "Nationwide {category} {modifier} Program",
    "{category} {focus} and {focus2} Solutions",
    "Strategic {category} {modifier} Support Services",
    "Comprehensive {category} {focus} Initiative",
    "{modifier} {focus} for Federal {category} Operations",
    "Integrated {category} {focus} Platform",
]

MODIFIERS = [
    "Modernization", "Digital Transformation", "Next-Generation",
    "Advanced", "Integrated", "Enterprise-Wide", "Scalable",
    "Secure", "Automated", "Optimized", "Resilient",
    "Cloud-Native", "AI-Enabled", "Real-Time", "Comprehensive",
]

FOCUS_AREAS = [
    "Infrastructure", "Operations", "Platform", "Framework",
    "Management", "Delivery", "Implementation", "Analytics",
    "Integration", "Automation", "Monitoring", "Optimization",
    "Migration", "Support", "Assessment", "Deployment",
]

FOCUS_AREAS_2 = [
    "Maintenance", "Consulting", "Engineering", "Architecture",
    "Design", "Planning", "Evaluation", "Reporting",
]

DESCRIPTION_TEMPLATES = [
    "The {agency} requires {modifier} {category} services to support {focus} operations across multiple facilities nationwide. The contractor will be responsible for delivering comprehensive solutions that align with federal standards and mission requirements.",
    "This opportunity seeks qualified vendors to provide {modifier} {category} capabilities for {focus} initiatives. The selected contractor will implement scalable solutions ensuring compliance with all applicable federal regulations.",
    "The {agency} is seeking proposals for a {modifier} {category} platform to enhance {focus} capabilities. This initiative requires proven experience in federal environments and the ability to deliver results within established timelines.",
    "The {agency} announces this solicitation for {modifier} {category} services to support critical {focus} functions. The contractor must demonstrate expertise in similar-scale federal implementations.",
    "This procurement is for {modifier} {category} solutions to address {focus} requirements across the {agency}'s enterprise environment. The solution must integrate with existing systems and support future scalability.",
]


def _generate_rfp(i: int) -> dict:
    import random
    rng = random.Random(i * 7919 + 42)

    agency = rng.choice(AGENCIES)
    naics_code, naics_name = rng.choice(NAICS_CODES)
    set_aside = rng.choice(SET_ASIDES)

    cat_key = rng.choice(list(CATEGORY_POOLS.keys()))
    categories = [cat_key] + rng.sample(
        [c for ck in CATEGORY_POOLS for c in CATEGORY_POOLS[ck]
         if c not in CATEGORY_POOLS[cat_key]],
        min(rng.randint(1, 3), 3)
    )[:4]

    modifier = rng.choice(MODIFIERS)
    focus = rng.choice(FOCUS_AREAS)
    focus2 = rng.choice(FOCUS_AREAS_2)

    title_template = rng.choice(TITLE_TEMPLATES)
    title = title_template.format(
        category=cat_key.title(),
        modifier=modifier,
        focus=focus,
        focus2=focus2,
        agency_short=agency.split()[-1] if len(agency.split()) <= 3 else agency.split()[-1],
    )
    if len(title) > 120:
        title = title[:117] + "..."

    desc_template = rng.choice(DESCRIPTION_TEMPLATES)
    description = desc_template.format(
        agency=agency,
        modifier=modifier.lower(),
        category=cat_key,
        focus=focus.lower(),
    )

    num_reqs = rng.randint(2, 5)
    requirements = rng.sample(SAMPLE_REQUIREMENTS_POOL, num_reqs)

    response_days = rng.randint(14, 90)
    award_min = rng.randint(1, 50) * 100000
    award_max = award_min + rng.randint(1, 50) * 500000

    status = rng.choices(
        ["open", "open", "open", "open", "closed", "awarded"],
        weights=[50, 20, 15, 10, 3, 2],
    )[0]

    posted_days_ago = rng.randint(1, 120)

    return {
        "title": title,
        "agency": agency,
        "description": description,
        "naics_code": naics_code,
        "set_aside": set_aside,
        "categories": categories[:4],
        "requirements": requirements,
        "response_deadline_days": response_days,
        "award_amount_range": (award_min, award_max),
        "posted_days_ago": posted_days_ago,
        "status": status,
    }


SAMPLE_RFPS = [_generate_rfp(i) for i in range(105)]


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

        listing = RFPListing(
            id=uuid.uuid4(),
            external_id=content_hash,
            title=sample["title"],
            agency=sample["agency"],
            description=sample["description"],
            naics_code=sample["naics_code"],
            set_aside=sample["set_aside"],
            posted_date=datetime.utcnow() - timedelta(days=sample["posted_days_ago"]),
            response_deadline=datetime.utcnow()
            + timedelta(days=sample["response_deadline_days"]),
            award_amount=sample["award_amount_range"][1],
            status=sample["status"],
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

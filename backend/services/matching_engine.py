import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models.user import User
from models.rfp_listing import RFPListing
from models.match import Match


def calculate_relevance_score(
    rfp: RFPListing,
    user_profile: User,
) -> Dict[str, Any]:
    score = 0.0
    breakdown = {}
    keyword_matches = []
    capability_matches = []
    match_reasons = []

    user_keywords = set(k.lower() for k in (user_profile.keywords or []))
    user_capabilities = set(c.lower() for c in (user_profile.capabilities or []))
    user_tags = set(t.lower() for t in (user_profile.tags or []))
    user_industry = (user_profile.industry or "").lower()

    rfp_categories = set(c.lower() for c in (rfp.categories or []))
    rfp_description = (rfp.description or "").lower()
    rfp_title = (rfp.title or "").lower()

    keyword_score = 0.0
    for keyword in user_keywords:
        if keyword in rfp_title or keyword in rfp_description or keyword in rfp_categories:
            keyword_matches.append(keyword)
            keyword_score += 15.0
    keyword_score = min(keyword_score, 35.0)
    breakdown["keyword_match"] = keyword_score
    score += keyword_score

    if keyword_matches:
        match_reasons.append(f"Keywords matched: {', '.join(keyword_matches[:3])}")

    capability_score = 0.0
    for capability in user_capabilities:
        if capability in rfp_description or capability in rfp_categories:
            capability_matches.append(capability)
            capability_score += 12.0
    capability_score = min(capability_score, 30.0)
    breakdown["capability_match"] = capability_score
    score += capability_score

    if capability_matches:
        match_reasons.append(f"Capabilities matched: {', '.join(capability_matches[:3])}")

    industry_score = 0.0
    if user_industry and user_industry in rfp_categories:
        industry_score = 10.0
        breakdown["industry_match"] = industry_score
        score += industry_score
        match_reasons.append("Industry category matches")

    tag_score = 0.0
    for tag in user_tags:
        if tag in rfp_title or tag in rfp_description:
            tag_score += 8.0
    tag_score = min(tag_score, 15.0)
    breakdown["tag_match"] = tag_score
    score += tag_score

    if tag_score > 0:
        match_reasons.append("Tag relevance detected")

    if rfp.award_amount:
        amount_score = min((rfp.award_amount / 500000) * 2, 10.0)
        breakdown["award_potential"] = amount_score
        score += amount_score

    set_aside_bonus = 0.0
    if rfp.set_aside and user_profile.capabilities:
        for cap in user_profile.capabilities:
            if cap.lower() in (rfp.set_aside or "").lower():
                set_aside_bonus = 5.0
                break
    breakdown["set_aside"] = set_aside_bonus
    score += set_aside_bonus

    final_score = min(round(score, 1), 100.0)

    return {
        "relevance_score": final_score,
        "score_breakdown": breakdown,
        "keyword_matches": keyword_matches,
        "capability_matches": capability_matches,
        "match_reasons": match_reasons,
    }


def run_matching_for_user(
    db: Session,
    user: User,
    rfp_listings: Optional[List[RFPListing]] = None,
) -> List[Match]:
    if rfp_listings is None:
        rfp_listings = (
            db.query(RFPListing)
            .filter(RFPListing.is_active == True)
            .all()
        )

    new_matches = []
    for rfp in rfp_listings:
        existing = (
            db.query(Match)
            .filter(
                Match.user_id == user.id,
                Match.rfp_id == rfp.id,
            )
            .first()
        )

        if existing:
            result = calculate_relevance_score(rfp, user)
            existing.relevance_score = result["relevance_score"]
            existing.match_reasons = result["match_reasons"]
            existing.keyword_matches = result["keyword_matches"]
            existing.capability_matches = result["capability_matches"]
            existing.score_breakdown = result["score_breakdown"]
            existing.updated_at = func.now()
            new_matches.append(existing)
        else:
            result = calculate_relevance_score(rfp, user)
            match = Match(
                id=uuid.uuid4(),
                user_id=user.id,
                rfp_id=rfp.id,
                relevance_score=result["relevance_score"],
                match_reasons=result["match_reasons"],
                keyword_matches=result["keyword_matches"],
                capability_matches=result["capability_matches"],
                score_breakdown=result["score_breakdown"],
                status="pending",
            )
            db.add(match)
            new_matches.append(match)

    db.commit()
    return new_matches


def run_matching_for_all_users(db: Session) -> Dict[str, int]:
    users = db.query(User).all()
    active_rfps = (
        db.query(RFPListing)
        .filter(RFPListing.is_active == True)
        .all()
    )

    results = {}
    for user in users:
        matches = run_matching_for_user(db, user, active_rfps)
        results[str(user.id)] = len(matches)

    return results


def get_user_matches(
    db: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
    min_score: float = 0,
) -> List[Match]:
    query = (
        db.query(Match)
        .filter(
            Match.user_id == user_id,
            Match.relevance_score >= min_score,
        )
        .order_by(desc(Match.relevance_score))
    )
    return query.offset(skip).limit(limit).all()


def get_match_by_id(
    db: Session,
    match_id: uuid.UUID,
) -> Optional[Match]:
    return db.query(Match).filter(Match.id == match_id).first()

from datetime import datetime
from typing import List

from .data import funding_rounds, investors, investor_news


def get_funding_timeline(sector: str, stage: str) -> List[dict]:
    matches = []
    for record in funding_rounds:
        if record["startup_sector"].lower() == sector.lower() or record["stage"].lower() == stage.lower():
            matches.extend(record["rounds"])
    if not matches:
        matches.append(
            {
                "year": datetime.now().year,
                "round": stage,
                "amount": "$1.5M",
                "lead": "Emerging Ventures",
            }
        )
    return sorted(matches, key=lambda item: item["year"])


def compute_match_score(startup_sector: str, stage: str, revenue_range: str, investor: dict) -> int:
    score = 0
    sector = startup_sector.lower()
    stage_lower = stage.lower()

    if sector in [focus.lower() for focus in investor["focus"]]:
        score += 40
    if any(stage_lower in sf.lower() for sf in investor["stage_focus"]):
        score += 30
    if "growth" in revenue_range.lower() or "series b" in stage_lower:
        score += 20 if "growth" in [sf.lower() for sf in investor["stage_focus"]] else 0
    score += min(10, max(0, 10 - len(investor["portfolio"])))
    return min(100, score)


def score_investors(startup_sector: str, stage: str, revenue_range: str) -> List[dict]:
    scored = []
    for investor in investors:
        score = compute_match_score(startup_sector, stage, revenue_range, investor)
        match_text = []
        if startup_sector.lower() in [focus.lower() for focus in investor["focus"]]:
            match_text.append("Sector fit")
        if any(stage.lower() in sf.lower() for sf in investor["stage_focus"]):
            match_text.append("Stage fit")
        if match_text:
            match_text.append("Portfolio relevance")
        scored.append(
            {
                "name": investor["name"],
                "score": score,
                "focus": ", ".join(investor["focus"]),
                "stage_focus": ", ".join(investor["stage_focus"]),
                "portfolio": ", ".join(investor["portfolio"]),
                "latest_news": investor["latest_news"],
                "contact": investor["contact"],
                "fit_tags": ", ".join(match_text) if match_text else "Emerging fit",
            }
        )
    return sorted(scored, key=lambda item: item["score"], reverse=True)


def generate_weekly_digest(startup_name: str, sector: str, stage: str, revenue_range: str) -> str:
    top_investors = score_investors(sector, stage, revenue_range)[:3]
    top_names = ", ".join([inv["name"] for inv in top_investors])
    digest_lines = [
        f"Weekly Funding Opportunity Digest for {startup_name}",
        "", 
        f"Sector: {sector}",
        f"Stage: {stage}",
        f"Revenue Range: {revenue_range}",
        "", 
        "Key findings:",
        f"- {top_investors[0]['name']} is the strongest match due to {top_investors[0]['fit_tags']}.",
        f"- Recent investor news includes: {investor_news[0]['headline']} ({investor_news[0]['source']}).",
        "", 
        "Recommended next steps:",
        "1. Reach out to the top-fit investors with a custom executive summary.",
        "2. Highlight market traction and use of funds aligned to investor focus.",
        "3. Schedule follow-up calls around sector-specific diligence topics.",
        "", 
        "Top investor matches:",
    ]
    for investor in top_investors:
        digest_lines.append(f"- {investor['name']}: Fit score {investor['score']} / 100")
        digest_lines.append(f"  Portfolio: {investor['portfolio']}")
        digest_lines.append(f"  Contact: {investor['contact']}")
    digest_lines.append("",)
    digest_lines.append("Need help refining investor outreach? Reply to subscribe to our startup funding intelligence alerts.")
    return "\n".join(digest_lines)


def recent_investor_news() -> List[dict]:
    return sorted(investor_news, key=lambda item: item["date"], reverse=True)

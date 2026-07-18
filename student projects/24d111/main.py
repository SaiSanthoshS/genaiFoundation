"""
Scholar's Archive — FastAPI Backend
Integrates: OpenAlex, Semantic Scholar, Crossref, Unpaywall, arXiv, and Gemini LLM.
All files remain within the 24d111 folder.
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import httpx
import uvicorn
import os
import json
import re
from dotenv import load_dotenv
from google import genai

# Load environment
load_dotenv()

app = FastAPI(title="Scholar's Archive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Gemini Client ----------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
gemini_client = None
if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_KEY_HERE":
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# ---------- Serve frontend ----------
@app.get("/")
def read_index():
    return FileResponse("index.html")


# =====================================================================
#  PHASE 1: Paper Discovery — OpenAlex + Semantic Scholar + Crossref
# =====================================================================

async def fetch_openalex(topic: str, year_min: int, year_max: int, domain: str, client: httpx.AsyncClient):
    """Fetch papers from OpenAlex API."""
    filters = [
        f"publication_year:{year_min}-{year_max}",
        "has_abstract:true"
    ]
    search_query = topic
    if domain != "All domains":
        search_query = f"{topic} {domain}".strip()

    params = {
        "filter": ",".join(filters),
        "per-page": 15,
        "mailto": "scholar-archive@example.com"  # polite pool
    }
    if search_query:
        params["search"] = search_query

    try:
        resp = await client.get("https://api.openalex.org/works", params=params, timeout=15.0)
        resp.raise_for_status()
        return resp.json().get("results", [])
    except Exception as e:
        print(f"[OpenAlex] Error: {e}")
        return []


async def fetch_semantic_scholar(topic: str, year_min: int, year_max: int, client: httpx.AsyncClient):
    """Fetch papers from Semantic Scholar Graph API."""
    params = {
        "query": topic,
        "limit": 15,
        "year": f"{year_min}-{year_max}",
        "fields": "paperId,title,abstract,authors,year,venue,citationCount,externalIds,url,referenceCount,citationCount,fieldsOfStudy"
    }
    try:
        resp = await client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params=params, timeout=15.0
        )
        resp.raise_for_status()
        return resp.json().get("data", [])
    except Exception as e:
        print(f"[SemanticScholar] Error: {e}")
        return []


async def validate_crossref(doi: str, client: httpx.AsyncClient):
    """Validate metadata via Crossref REST API."""
    if not doi:
        return None
    try:
        resp = await client.get(
            f"https://api.crossref.org/works/{doi}",
            timeout=10.0,
            headers={"User-Agent": "ScholarArchive/1.0 (mailto:scholar-archive@example.com)"}
        )
        resp.raise_for_status()
        return resp.json().get("message", {})
    except Exception:
        return None


async def fetch_pdf_link(doi: str, client: httpx.AsyncClient):
    """Try to find an open-access PDF via Unpaywall, then arXiv fallback."""
    pdf_url = None

    # Try Unpaywall first
    if doi:
        try:
            resp = await client.get(
                f"https://api.unpaywall.org/v2/{doi}",
                params={"email": "scholar-archive@example.com"},
                timeout=8.0
            )
            if resp.status_code == 200:
                data = resp.json()
                best_oa = data.get("best_oa_location", {})
                if best_oa:
                    pdf_url = best_oa.get("url_for_pdf") or best_oa.get("url")
        except Exception:
            pass

    return pdf_url


def reconstruct_abstract(inverted_index: dict) -> str:
    """Reconstruct abstract from OpenAlex inverted index format."""
    if not inverted_index:
        return ""
    words = []
    for word, positions in inverted_index.items():
        for pos in positions:
            words.append((pos, word))
    words.sort()
    return " ".join(w[1] for w in words)


def normalize_paper(oa_work=None, ss_paper=None, crossref_data=None, pdf_url=None):
    """Normalize a paper from any source into a common format."""
    paper = {
        "id": "",
        "doi": "",
        "domain": "General",
        "title": "Untitled",
        "authors": [],
        "year": 0,
        "venue": "Unknown Venue",
        "citations": 0,
        "abstract": "",
        "contributions": [],
        "keywords": [],
        "related": [],
        "pdf_url": pdf_url or "",
        "source": ""
    }

    if oa_work:
        paper["id"] = oa_work.get("id", "").replace("https://openalex.org/", "")
        paper["doi"] = (oa_work.get("doi") or "").replace("https://doi.org/", "")
        paper["title"] = oa_work.get("title") or "Untitled"
        paper["year"] = oa_work.get("publication_year", 0)
        paper["citations"] = oa_work.get("cited_by_count", 0)
        paper["abstract"] = reconstruct_abstract(oa_work.get("abstract_inverted_index"))
        paper["source"] = "openalex"

        # Authors
        for auth in oa_work.get("authorships", [])[:5]:
            name = auth.get("author", {}).get("display_name")
            if name:
                paper["authors"].append(name)

        # Venue
        loc = oa_work.get("primary_location") or {}
        src = loc.get("source") or {}
        paper["venue"] = src.get("display_name") or "Unknown Venue"

        # Keywords from concepts
        paper["keywords"] = [c.get("display_name", "") for c in oa_work.get("concepts", [])[:4] if c.get("display_name")]

        # Related works (OpenAlex IDs)
        paper["related"] = [r.replace("https://openalex.org/", "") for r in oa_work.get("related_works", [])[:5]]

        # Domain from topics
        for topic in oa_work.get("topics", [])[:1]:
            if topic.get("display_name"):
                paper["domain"] = topic["display_name"]
                break

    elif ss_paper:
        paper["id"] = ss_paper.get("paperId", "")
        paper["title"] = ss_paper.get("title") or "Untitled"
        paper["year"] = ss_paper.get("year", 0)
        paper["citations"] = ss_paper.get("citationCount", 0)
        paper["abstract"] = ss_paper.get("abstract") or ""
        paper["venue"] = ss_paper.get("venue") or "Unknown Venue"
        paper["source"] = "semanticscholar"
        paper["doi"] = (ss_paper.get("externalIds") or {}).get("DOI", "")

        for auth in ss_paper.get("authors", [])[:5]:
            if auth.get("name"):
                paper["authors"].append(auth["name"])

        for field in ss_paper.get("fieldsOfStudy", [])[:1]:
            paper["domain"] = field

        paper["keywords"] = ss_paper.get("fieldsOfStudy", [])[:4]

    # Crossref enrichment
    if crossref_data:
        if crossref_data.get("title"):
            titles = crossref_data["title"]
            if isinstance(titles, list) and titles:
                paper["title"] = titles[0]
        if crossref_data.get("container-title"):
            venues = crossref_data["container-title"]
            if isinstance(venues, list) and venues:
                paper["venue"] = venues[0]

    if not paper["authors"]:
        paper["authors"] = ["Unknown Author"]

    return paper


# =====================================================================
#  PHASE 2: LLM Synthesis — Gemini
# =====================================================================

async def llm_synthesize(papers: list, query: str):
    """Use Gemini to generate key contributions and gap analysis."""
    if not gemini_client or not papers:
        # Return papers as-is with placeholder contributions
        for p in papers:
            if not p.get("contributions") or p["contributions"] == []:
                p["contributions"] = [p["abstract"][:150] + "..." if p.get("abstract") else "No abstract available."]
        return papers, None

    # Build prompt for Gemini
    paper_summaries = []
    for i, p in enumerate(papers[:15]):
        paper_summaries.append(
            f"Paper {i+1}: \"{p['title']}\" ({p['year']})\n"
            f"  Authors: {', '.join(p['authors'][:3])}\n"
            f"  Citations: {p['citations']}\n"
            f"  Abstract: {p['abstract'][:500]}\n"
        )

    prompt = f"""You are an academic research assistant analyzing papers for the query: "{query}"

Here are the papers found:

{"".join(paper_summaries)}

Please respond in valid JSON format with exactly this structure:
{{
  "papers": [
    {{
      "contributions": ["bullet point 1", "bullet point 2"],
      "relevance_score": 0.95
    }}
  ],
  "gap_analysis": "A 2-3 sentence analysis of what research gap or blind spot exists across these papers."
}}

Rules:
- The "papers" array must have exactly the same number of items as the papers provided, in the exact same order.
- "contributions": exactly 2 bullet points summarizing its KEY contributions. Each 15-25 words.
- "relevance_score": a float between 0.0 and 1.0 indicating how strictly relevant the paper is to the query "{query}".
- The gap_analysis should identify a genuine pattern or gap across the full set.
- Return ONLY the JSON, no markdown fences, no commentary.
"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        
        # Clean markdown fences if present
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        
        result = json.loads(text)

        papers_data = result.get("papers", [])
        gap = result.get("gap_analysis", None)

        for i, p in enumerate(papers[:15]):
            if i < len(papers_data):
                p["contributions"] = papers_data[i].get("contributions", [p["abstract"][:150] + "..."])
                p["llm_score"] = papers_data[i].get("relevance_score", 0.5)
            else:
                p["contributions"] = [p["abstract"][:150] + "..."] if p.get("abstract") else ["No contribution extracted."]
                p["llm_score"] = 0.5

        return papers, gap

    except Exception as e:
        print(f"[Gemini] Error: {e}")
        for p in papers:
            if not p.get("contributions") or p["contributions"] == []:
                p["contributions"] = [p["abstract"][:150] + "..." if p.get("abstract") else "No abstract available."]
        return papers, None


# =====================================================================
#  MAIN SEARCH ENDPOINT
# =====================================================================

@app.get("/api/search")
async def search_papers(
    topic: str = Query("", description="Search topic"),
    yearMin: int = Query(2000, description="Minimum publication year"),
    yearMax: int = Query(2026, description="Maximum publication year"),
    domain: str = Query("All domains", description="Domain filter")
):
    if not topic.strip():
        return {"results": [], "gap": None}

    async with httpx.AsyncClient() as client:
        # Step 1: Fetch from OpenAlex + Semantic Scholar in parallel
        oa_results = await fetch_openalex(topic, yearMin, yearMax, domain, client)
        ss_results = await fetch_semantic_scholar(topic, yearMin, yearMax, client)

        # Step 2: Normalize all results, dedup by title similarity
        seen_titles = set()
        all_papers = []

        for work in oa_results:
            paper = normalize_paper(oa_work=work)
            title_key = paper["title"].lower().strip()[:60]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                all_papers.append(paper)

        for sp in ss_results:
            paper = normalize_paper(ss_paper=sp)
            title_key = paper["title"].lower().strip()[:60]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                all_papers.append(paper)

        # Step 3: Wait, we will sort purely by citations initially just to cap at 20 before the LLM step,
        # but since we removed the strict citation sort from OpenAlex, the list is now a mix of relevance 
        # from OpenAlex and Semantic Scholar. We will keep top 15 based on a heuristic:
        all_papers.sort(key=lambda p: (p.get("citations", 0) * 0.1), reverse=True) # weak citation sort just to deduplicate heavy tails
        all_papers = all_papers[:15]  # cap at 15 for the LLM

        # Step 4: Validate top papers via Crossref & fetch PDF links
        for paper in all_papers:
            if paper.get("doi"):
                crossref_data = await validate_crossref(paper["doi"], client)
                if crossref_data:
                    # Enrich venue if missing
                    if paper["venue"] == "Unknown Venue" and crossref_data.get("container-title"):
                        venues = crossref_data["container-title"]
                        if isinstance(venues, list) and venues:
                            paper["venue"] = venues[0]

                pdf = await fetch_pdf_link(paper["doi"], client)
                if pdf:
                    paper["pdf_url"] = pdf

        # Step 5: LLM synthesis (contributions + gap + relevance_score)
        all_papers, gap_text = await llm_synthesize(all_papers, topic)
        # Step 5b: Calculate blended score for ranking
        # Weights: 50% Title Match, 30% LLM Relevance, 20% Citation Strength
        topic_words = set(re.findall(r'\w+', topic.lower())) if topic else set()
        
        for p in all_papers:
            # 1. Title Score
            title_words = set(re.findall(r'\w+', p.get("title", "").lower()))
            title_score = 0.0
            if topic_words:
                match_count = sum(1 for w in topic_words if w in title_words)
                title_score = match_count / len(topic_words)
            
            # 2. LLM Score
            llm_score = p.get("llm_score", 0.5)
            
            # 3. Citation Score (normalized to max 1.0 at 1000+ citations)
            cite_score = min(p.get("citations", 0) / 1000.0, 1.0)
            
            # Blended
            blended = (title_score * 0.5) + (llm_score * 0.3) + (cite_score * 0.2)
            p["final_score"] = blended
            p["title_score"] = title_score

        # Re-sort by the blended score
        all_papers.sort(key=lambda p: p.get("final_score", 0), reverse=True)

        # Step 6: Build scored results
        results = []
        for p in all_papers:
            score = p.get("final_score", 0)
            results.append({
                "paper": p,
                "score": round(score, 2),
                "matchScore": round(p.get("title_score", 0), 2)
            })

        return {"results": results, "gap": gap_text}


# =====================================================================
#  RELATED PAPERS ENDPOINT (for citation graph)
# =====================================================================

@app.get("/api/related/{paper_id}")
async def get_related(paper_id: str):
    """Fetch related papers for the citation graph."""
    async with httpx.AsyncClient() as client:
        # Try Semantic Scholar first (better citation data)
        try:
            resp = await client.get(
                f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}",
                params={"fields": "title,authors,year,citationCount,citations.title,citations.year,citations.citationCount,references.title,references.year,references.citationCount"},
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                related = []

                # Mix citations and references for the graph
                for cite in (data.get("citations") or [])[:3]:
                    if cite and cite.get("title"):
                        related.append({
                            "id": cite.get("paperId", ""),
                            "title": cite["title"],
                            "year": cite.get("year", 0),
                            "citations": cite.get("citationCount", 0),
                            "type": "cited_by"
                        })
                for ref in (data.get("references") or [])[:3]:
                    if ref and ref.get("title"):
                        related.append({
                            "id": ref.get("paperId", ""),
                            "title": ref["title"],
                            "year": ref.get("year", 0),
                            "citations": ref.get("citationCount", 0),
                            "type": "references"
                        })

                return {"center": {"title": data.get("title", ""), "year": data.get("year", 0)}, "related": related}
        except Exception as e:
            print(f"[SemanticScholar Related] Error: {e}")

        # Fallback: try OpenAlex
        try:
            resp = await client.get(
                f"https://api.openalex.org/works/{paper_id}",
                params={"mailto": "scholar-archive@example.com"},
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                related_ids = data.get("related_works", [])[:6]

                related = []
                for rid in related_ids:
                    try:
                        r2 = await client.get(rid, params={"mailto": "scholar-archive@example.com"}, timeout=5.0)
                        if r2.status_code == 200:
                            rd = r2.json()
                            related.append({
                                "id": rd.get("id", "").replace("https://openalex.org/", ""),
                                "title": rd.get("title", "Untitled"),
                                "year": rd.get("publication_year", 0),
                                "citations": rd.get("cited_by_count", 0),
                                "type": "related"
                            })
                    except Exception:
                        continue

                return {
                    "center": {"title": data.get("title", ""), "year": data.get("publication_year", 0)},
                    "related": related
                }
        except Exception as e:
            print(f"[OpenAlex Related] Error: {e}")

        return {"center": {}, "related": []}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

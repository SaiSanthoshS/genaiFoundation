import httpx

r = httpx.get(
    "http://127.0.0.1:8000/api/search",
    params={"topic": "large language models", "yearMin": 2020, "yearMax": 2025, "domain": "All domains"},
    timeout=30
)
d = r.json()

print(f"Status: {r.status_code}")
print(f"Results: {len(d.get('results', []))}")
print(f"Gap: {d.get('gap', 'None')}")
print()

for i, p in enumerate(d.get("results", [])[:5]):
    paper = p["paper"]
    print(f"  {i+1}. {paper['title'][:70]}")
    print(f"     Year: {paper['year']} | Citations: {paper['citations']} | Source: {paper.get('source','?')}")
    print(f"     PDF: {paper.get('pdf_url','N/A')}")
    print(f"     Contributions: {paper.get('contributions',['N/A'])[0][:80]}")
    print()

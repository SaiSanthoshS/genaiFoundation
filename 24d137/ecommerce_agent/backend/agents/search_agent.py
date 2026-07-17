import time
import re
from typing import List, Dict, Any
from serpapi import GoogleSearch

from backend.core.config import SERPAPI_KEY
from backend.core.state import AgentContext

# Simple in-memory cache for SerpApi results
_CACHE = {}
CACHE_TTL = 600  # 10 minutes (600 seconds)

def run_search_agent(context: AgentContext) -> AgentContext:
    """
    Search Agent: Calls SerpApi's Google Shopping endpoint.
    Normalizes the raw SerpApi response into a consistent shape.
    """
    query = context.original_query
    
    # 1. Check cache
    now = time.time()
    if query in _CACHE and (now - _CACHE[query]['timestamp']) < CACHE_TTL:
        print(f"Using cached SerpApi results for query: '{query}'")
        raw_results = _CACHE[query]['data']
    else:
        print(f"Calling SerpApi for query: '{query}'")
        if not SERPAPI_KEY:
            print("Error: SERPAPI_KEY not set.")
            raw_results = []
        else:
            try:
                params = {
                    "engine": "google_shopping",
                    "q": query,
                    "api_key": SERPAPI_KEY,
                    "hl": "en",
                    "gl": "us"
                }
                search = GoogleSearch(params)
                results = search.get_dict()
                raw_results = results.get("shopping_results", [])
                
                # Update cache
                _CACHE[query] = {
                    'timestamp': now,
                    'data': raw_results
                }
            except Exception as e:
                print(f"SerpApi call failed: {e}")
                raw_results = []

    # 2. Normalize results
    normalized = []
    for item in raw_results:
        price = item.get("extracted_price", item.get("price", 0.0))
        
        # Parse shipping from the "delivery" string
        shipping = 0.0
        delivery_str = item.get("delivery", "")
        if "$" in delivery_str:
            matches = re.findall(r'\$([0-9\.]+)', delivery_str)
            if matches:
                try:
                    shipping = float(matches[0])
                except ValueError:
                    pass
                    
        rating = item.get("rating", 0.0)
        
        normalized.append({
            "store": item.get("source", "Unknown Store"),
            "title": item.get("title", ""),
            "price": float(price),
            "shipping": shipping,
            "rating": float(rating),
            "url": item.get("link", "")
        })
        
    context.search_results = normalized
    return context

if __name__ == "__main__":
    # Test script for isolated testing
    ctx = AgentContext("cheap 128GB iPhone 15")
    ctx = run_search_agent(ctx)
    print(f"Found {len(ctx.search_results)} results.")
    for r in ctx.search_results[:3]:
        print(r)

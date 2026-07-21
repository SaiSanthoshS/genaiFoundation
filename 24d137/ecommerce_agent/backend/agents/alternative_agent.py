from backend.core.state import AgentContext
from backend.agents.search_agent import run_search_agent
import os
from google import genai
from backend.core.config import GEMINI_KEY

client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

def run_alternative_agent(context: AgentContext) -> AgentContext:
    """
    Alternative Agent: Runs only if viable is False.
    Uses Gemini to relax the search query, then re-runs the search agent.
    """
    if context.viable:
        return context
        
    print("No viable results found. Running Alternative Agent...")
    
    relaxed_query = context.original_query
    
    if client:
        try:
            prompt = f"The user searched for '{context.original_query}' but no good results were found. Provide a slightly relaxed or more general search query (e.g. remove specific storage size, or suggest a similar model) to find better results. Return ONLY the new search query string, nothing else."
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )
            if response and response.text:
                relaxed_query = response.text.strip().strip("'").strip('"')
        except Exception as e:
            print(f"Gemini relaxation failed: {e}")
            # simple fallback
            words = context.original_query.split()
            relaxed_query = " ".join(words[:max(1, len(words)-1)]) 
            
    print(f"Alternative query: {relaxed_query}")
    
    # Re-run search agent with new query
    temp_context = AgentContext(relaxed_query)
    temp_context = run_search_agent(temp_context)
    
    context.alternative_results = temp_context.search_results
    
    # Rank alternatives
    if context.alternative_results:
        for r in context.alternative_results:
            r['total_cost'] = r.get('price', 0.0) + r.get('shipping', 0.0)
            r['inflated_discount'] = False
        context.alternative_results = sorted(context.alternative_results, key=lambda x: x['total_cost'])
        
    return context

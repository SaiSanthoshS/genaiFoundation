import json
import os
from google import genai
from backend.core.config import GEMINI_KEY
from backend.core.state import AgentContext

client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def run_query_extraction_agent(context: AgentContext) -> AgentContext:
    if not client:
        return context
        
    print(f"Running Query Extraction Agent on: '{context.original_query}'")
    
    try:
        prompt = f"""
From this shopping request: '{context.original_query}', extract two things and return as JSON:
(1) 'product_query': the core product name/specs only, suitable for a shopping search engine. If the request is unclear or garbled, set this to "UNCLEAR".
(2) 'constraints': an object capturing any conditions mentioned, such as max_budget, min_rating, delivery_by (e.g. 'tomorrow', 'within 2 days'), preferred_brand, or other. Only include constraint keys that are actually mentioned. If no constraints are mentioned, return an empty object for 'constraints'.

Return only valid JSON, no explanation.
Example: {{"product_query": "football", "constraints": {{"delivery_by": "tomorrow"}}}}
"""
        
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt
        )
        if response and response.text:
            cleaned_text = clean_json_response(response.text)
            try:
                data = json.loads(cleaned_text)
                extracted = data.get("product_query", "UNCLEAR").strip()
                constraints = data.get("constraints", {})
                
                if extracted == "UNCLEAR" or extracted.startswith("UNCLEAR"):
                    context.status = "unclear_query"
                    context.message = "Couldn't understand that as a product search — try something like 'cheapest wireless earbuds under 2000'"
                    context.viable = False
                else:
                    print(f"Extracted clean query: '{extracted}', Constraints: {constraints}")
                    context.original_query = extracted
                    context.constraints = constraints
            except json.JSONDecodeError:
                print(f"Failed to parse JSON from extraction agent: {cleaned_text}")
                context.status = "unclear_query"
                context.message = "Couldn't parse the search extraction."
                context.viable = False
        else:
            context.status = "unclear_query"
            context.message = "Couldn't understand that as a product search — try something like 'cheapest wireless earbuds under 2000'"
            context.viable = False
            
    except Exception as e:
        print(f"Query Extraction failed: {e}")
        
    return context

import os
from google import genai
from backend.core.config import GEMINI_KEY
from backend.core.state import AgentContext

client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

def run_explainer_agent(context: AgentContext) -> AgentContext:
    """
    Explainer Agent: Calls Gemini to generate a short recommendation.
    Falls back to template on failure.
    """
    if not context.viable or not context.ranked_results:
        context.explanation = "No viable options found to recommend."
        return context
        
    top_options = context.ranked_results[:3]
    
    if client:
        try:
            prompt = f"You are a helpful shopping assistant. The user is looking for '{context.original_query}'. "
            
            if context.constraints:
                prompt += f"The user has the following constraints: {context.constraints}. Factor this into your recommendation and explicitly mention whether each top option can meet it. "
                
            prompt += "Here are the top options we found based on total cost (price + shipping):\n\n"
            for i, opt in enumerate(top_options):
                prompt += f"{i+1}. Store: {opt['store']}, Total Cost: ${opt['total_cost']:.2f}, Rating: {opt['rating']}\n"
                if opt.get('delivery'):
                    prompt += f"   Delivery/Shipping: {opt['delivery']}\n"
                if opt.get('inflated_discount'):
                    prompt += "   Warning: This store may have an inflated original price.\n"
                    
            prompt += "\nProvide a short, plain-language recommendation (2-3 sentences max) comparing these options. Focus on price, rating, and any tradeoffs. Do not use markdown."
            
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )
            if response and response.text:
                context.explanation = response.text.strip()
        except Exception as e:
            print(f"Gemini call failed: {e}")
            context.explanation = "We found some good options, ranked by total cost below."
    else:
        context.explanation = "Here are the top options sorted by lowest total cost."
        
    return context

from backend.core.state import AgentContext
import random

def run_coupon_agent(context: AgentContext) -> AgentContext:
    """
    Coupon Agent: Searches for currently active coupon codes for the winning store.
    Applies the best valid code to the total, returns before/after price.
    (Mocks a web search / coupon API for demonstration purposes)
    """
    if not context.viable or not context.ranked_results:
        return context
        
    # We take the best option from comparison (or alternative if used)
    results_to_use = context.alternative_results if context.alternative_results else context.ranked_results
    if not results_to_use:
        return context
        
    winning_store = results_to_use[0]
    store_name = winning_store['store']
    
    # Mock coupon logic
    # In a real app, we could call an external API or scrape a coupon site
    has_coupon = random.random() < 0.5 # 50% chance to find a coupon
    
    context.winning_store = dict(winning_store)
    
    if has_coupon:
        discount_percent = random.choice([0.05, 0.10, 0.15])
        discount_amount = context.winning_store['total_cost'] * discount_percent
        new_price = context.winning_store['total_cost'] - discount_amount
        
        context.coupon_applied = True
        context.winning_store['coupon_code'] = f"SAVE{int(discount_percent*100)}"
        context.winning_store['discount_amount'] = discount_amount
        context.winning_store['final_cost'] = new_price
    else:
        context.coupon_applied = False
        context.winning_store['final_cost'] = context.winning_store['total_cost']
        
    return context

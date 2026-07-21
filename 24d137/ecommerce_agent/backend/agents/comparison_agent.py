from backend.core.state import AgentContext
from backend.database import SessionLocal, PriceSnapshot
from datetime import datetime

def run_comparison_agent(context: AgentContext) -> AgentContext:
    """
    Comparison Agent: 
    - Computes total_cost = price + shipping
    - Ranks stores by total cost (ascending)
    - Checks stored price_snapshots history
    - Returns viable: True/False and ranked results
    """
    results = context.search_results
    
    if not results:
        context.viable = False
        context.ranked_results = []
        return context
        
    # Calculate total cost
    for r in results:
        r['total_cost'] = r.get('price', 0.0) + r.get('shipping', 0.0)
        
    max_budget = context.constraints.get('max_budget')
    if max_budget is not None:
        try:
            # handle cases where gemini returns "$500"
            max_budget = float(str(max_budget).replace('$', '').replace(',', ''))
        except ValueError:
            max_budget = None
            
    min_rating = context.constraints.get('min_rating')
    if min_rating is not None:
        try:
            min_rating = float(min_rating)
        except ValueError:
            min_rating = None
            
    filtered_results = []
    for r in results:
        # Check delivery
        if 'delivery_by' in context.constraints:
            r['delivery'] = r.get('delivery') or "unknown"
            
        # Check budget
        if max_budget is not None and r['total_cost'] > max_budget:
            continue
            
        # Check rating
        if min_rating is not None and (r.get('rating') is None or float(r['rating']) < min_rating):
            continue
            
        filtered_results.append(r)
        
    # Sort by total cost ascending
    ranked = sorted(filtered_results, key=lambda x: x['total_cost'])
    
    db = SessionLocal()
    query = context.original_query
    
    for r in ranked:
        r['inflated_discount'] = False
        old_price = r.get('old_price')

        # Check historical prices for this store and product
        history = db.query(PriceSnapshot).filter(
            PriceSnapshot.product_id == query,
            PriceSnapshot.store == r['store']
        ).all()
        
        if history:
            historical_max = max([h.price for h in history])
            if old_price and old_price > historical_max * 1.1:
                r['inflated_discount'] = True
                
        # Write snapshot
        snap = PriceSnapshot(
            product_id=query,
            store=r['store'],
            price=r['price'],
            shipping=r['shipping'],
            rating=r['rating'],
            timestamp=datetime.utcnow()
        )
        db.add(snap)
        
    db.commit()
    db.close()
        
    context.viable = len(ranked) > 0
    context.ranked_results = ranked
    
    return context

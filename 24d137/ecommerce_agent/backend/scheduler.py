from apscheduler.schedulers.background import BackgroundScheduler
from backend.database import SessionLocal, Watchlist
from backend.core.state import AgentContext
from backend.agents.search_agent import run_search_agent
from backend.agents.comparison_agent import run_comparison_agent

def check_watchlist_prices():
    print("Running background watchlist check...")
    db = SessionLocal()
    try:
        items = db.query(Watchlist).all()
        checked_products = set()
        
        for item in items:
            if item.product_id in checked_products:
                continue
                
            checked_products.add(item.product_id)
            print(f"Checking price for watchlisted product: {item.product_id}")
            
            ctx = AgentContext(item.product_id)
            ctx = run_search_agent(ctx)
            # The comparison agent automatically writes new snapshots to the DB
            ctx = run_comparison_agent(ctx)
            
        print("Background check complete.")
    except Exception as e:
        print(f"Error in background job: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_watchlist_prices, 'interval', minutes=15)

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.core.state import AgentContext
from backend.agents.search_agent import run_search_agent
from backend.agents.comparison_agent import run_comparison_agent
from backend.agents.query_extraction_agent import run_query_extraction_agent
from backend.agents.image_recognition_agent import run_image_recognition
from contextlib import asynccontextmanager
from backend.scheduler import scheduler, check_watchlist_prices

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="Multi-Agent E-Commerce API", lifespan=lifespan)

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    prompt: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

from backend.agents.explainer_agent import run_explainer_agent
from backend.agents.coupon_agent import run_coupon_agent
from backend.agents.alternative_agent import run_alternative_agent

@app.post("/search")
def search_product(req: SearchRequest):
    ctx = AgentContext(req.prompt)
    
    ctx = run_query_extraction_agent(ctx)
    if ctx.status == "unclear_query":
        return ctx.to_dict()
        
    ctx = run_search_agent(ctx)
    ctx = run_comparison_agent(ctx)
    ctx = run_alternative_agent(ctx)
    ctx = run_explainer_agent(ctx)
    ctx = run_coupon_agent(ctx)
    
    return ctx.to_dict()

@app.post("/search-by-image")
async def search_by_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    product_name = run_image_recognition(image_bytes, file.content_type)
    
    ctx = AgentContext(product_name)
    ctx.identified_product = product_name
    
    if product_name == "UNCLEAR" or product_name.startswith("UNCLEAR"):
        ctx.status = "unclear_image"
        ctx.message = "Couldn't identify a clear product in that image — try a clearer photo showing the brand or label"
        ctx.viable = False
        return ctx.to_dict()
        
    # Send through normal pipeline starting with extraction as a safety pass
    ctx = run_query_extraction_agent(ctx)
    if ctx.status == "unclear_query":
        return ctx.to_dict()
        
    ctx = run_search_agent(ctx)
    ctx = run_comparison_agent(ctx)
    ctx = run_alternative_agent(ctx)
    ctx = run_explainer_agent(ctx)
    ctx = run_coupon_agent(ctx)
    
    return ctx.to_dict()

from backend.agents.action_agent import run_action_agent, ProceedRequest
from backend.database import SessionLocal, PriceSnapshot

@app.post("/proceed")
def proceed(req: ProceedRequest):
    return run_action_agent(req)

@app.get("/price-history/{product_id}")
def get_price_history(product_id: str):
    db = SessionLocal()
    history = db.query(PriceSnapshot).filter(PriceSnapshot.product_id == product_id).order_by(PriceSnapshot.timestamp.asc()).all()
    db.close()
    
    formatted = {}
    for h in history:
        date_str = h.timestamp.strftime("%m-%d %H:%M")
        if date_str not in formatted:
            formatted[date_str] = {"date": date_str}
        formatted[date_str][h.store] = h.price
        
    return list(formatted.values())

from backend.database import Watchlist

class WatchlistRequest(BaseModel):
    user_id: str
    product_id: str
    threshold_price: float

@app.post("/watchlist")
def add_watchlist(req: WatchlistRequest):
    db = SessionLocal()
    item = Watchlist(user_id=req.user_id, product_id=req.product_id, threshold_price=req.threshold_price)
    db.add(item)
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/watchlist/{user_id}")
def get_watchlist(user_id: str):
    db = SessionLocal()
    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    
    results = []
    for item in items:
        latest = db.query(PriceSnapshot).filter(PriceSnapshot.product_id == item.product_id).order_by(PriceSnapshot.timestamp.desc()).first()
        current_price = latest.price if latest else None
        
        results.append({
            "id": item.id,
            "product_id": item.product_id,
            "threshold_price": item.threshold_price,
            "current_price": current_price,
            "price_drop_met": current_price is not None and current_price <= item.threshold_price
        })
        
    db.close()
    return results

@app.post("/webhook/price-check")
def trigger_price_check():
    check_watchlist_prices()
    return {"status": "triggered"}

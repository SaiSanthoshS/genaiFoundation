from fastapi import APIRouter
from app.api.endpoints import journey

api_router = APIRouter()
api_router.include_router(journey.router, prefix="/journey", tags=["journey"])

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.schemas.journey import RouteOption, DelayInfo, PlanRequest, ReminderRequest, Reminder, DelayRequest
from app.services.journey_service import JourneyService

router = APIRouter()

@router.post("/plan", response_model=List[RouteOption])
def plan_journey(req: PlanRequest):
    return JourneyService.plan_journey(req)

@router.get("/routes", response_model=List[RouteOption])
def get_routes():
    return JourneyService.get_all_routes()

@router.post("/fare")
def get_fare(req: DelayRequest):
    return JourneyService.get_fare(req.route_id)

@router.post("/delay")
def get_delay_prediction(req: DelayRequest):
    return JourneyService.get_delay_for_route(req.route_id)

@router.get("/occupancy/{vehicle_id}")
def get_occupancy(vehicle_id: str):
    return JourneyService.get_occupancy(vehicle_id)

@router.post("/reroute", response_model=RouteOption)
def reroute(req: DelayRequest):
    return JourneyService.get_reroute(req.route_id)

@router.post("/reminder", response_model=Reminder)
def create_reminder(req: ReminderRequest):
    return JourneyService.create_reminder(req)

# Added to easily fetch delays mirroring frontend mock delayService
@router.get("/delays", response_model=List[DelayInfo])
def get_all_delays():
    return JourneyService.get_delays()

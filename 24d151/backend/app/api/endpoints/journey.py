from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.schemas.journey import RouteOption, DelayInfo, PlanRequest, ReminderRequest, Reminder, DelayRequest, ReminderUpdateRequest
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

@router.get("/reminders", response_model=List[Reminder])
def get_reminders():
    return JourneyService.get_all_reminders()

@router.put("/reminder/{reminder_id}", response_model=Reminder)
def update_reminder(reminder_id: str, req: ReminderUpdateRequest):
    rem = JourneyService.update_reminder(reminder_id, req.dict(exclude_unset=True))
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return rem

@router.delete("/reminder/{reminder_id}")
def delete_reminder(reminder_id: str):
    success = JourneyService.delete_reminder(reminder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"status": "success"}

# Added to easily fetch delays mirroring frontend mock delayService
@router.get("/delays", response_model=List[DelayInfo])
def get_all_delays():
    return JourneyService.get_delays()

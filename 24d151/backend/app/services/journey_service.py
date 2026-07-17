from typing import List, Dict, Any
import time
from app.schemas.journey import RouteOption, DelayInfo, PlanRequest, ReminderRequest, Reminder
from app.services.mock_data import ROUTES, DELAYS
import uuid

# In-memory storage for reminders
ACTIVE_REMINDERS = []

class JourneyService:
    @staticmethod
    def plan_journey(req: PlanRequest) -> List[RouteOption]:
        # Simple logic: if 'jfk' in origin/dest, return specific, else default
        is_airport = 'jfk' in req.destination.lower() or 'jfk' in req.origin.lower()
        base = ROUTES["specific"] if is_airport else ROUTES["default"]
        
        # Apply filters (mock)
        processed = []
        for r in base:
            d = dict(r)
            if req.ecoFriendly and d['ecoFriendly']:
                d['confidence'] = min(d['confidence'] + 1, 100)
            if req.avoidCrowds and d['occupancy'] == 'low':
                d['reliability'] = min(d['reliability'] + 1, 100)
            processed.append(RouteOption(**d))
        return processed

    @staticmethod
    def get_all_routes() -> List[RouteOption]:
        return [RouteOption(**r) for r in ROUTES["default"]]

    @staticmethod
    def get_delays() -> List[DelayInfo]:
        return [DelayInfo(**d) for d in DELAYS]
    
    @staticmethod
    def get_delay_for_route(route_id: str) -> Dict[str, Any]:
        # Return predicted delay probability
        for r in ROUTES["default"] + ROUTES["specific"]:
            if r["id"] == route_id:
                # Just mock a probability based on the route delayMinutes
                return {
                    "route_id": route_id,
                    "probability": 0.85 if r["delayMinutes"] > 0 else 0.10,
                    "expected_duration": r["delayMinutes"]
                }
        return {"route_id": route_id, "probability": 0.05, "expected_duration": 0}

    @staticmethod
    def get_fare(route_id: str) -> Dict[str, Any]:
        for r in ROUTES["default"] + ROUTES["specific"]:
            if r["id"] == route_id:
                return {
                    "route_id": route_id,
                    "estimated_fare": r["cost"],
                    "breakdown": [
                        {"segment": "Base Fare", "amount": r["cost"] * 0.8},
                        {"segment": "Taxes/Fees", "amount": r["cost"] * 0.2},
                    ]
                }
        return {"error": "Route not found"}

    @staticmethod
    def get_occupancy(vehicle_id: str) -> Dict[str, Any]:
        return {
            "vehicle_id": vehicle_id,
            "status": "Medium",
            "capacity_percentage": 65
        }

    @staticmethod
    def get_reroute(route_id: str) -> RouteOption:
        # For mock, just return route-2 if available
        for r in ROUTES["default"]:
            if r["id"] == "route-2":
                return RouteOption(**r)
        return RouteOption(**ROUTES["default"][0])

    @staticmethod
    def create_reminder(req: ReminderRequest) -> Reminder:
        rem = Reminder(
            id=f"rem-{str(uuid.uuid4())[:8]}",
            routeName=req.routeName,
            from_station=req.from_station,
            to_station=req.to_station,
            departureTime=req.departureTime,
            mode=req.mode,
            status="active",
            minutesBefore=req.minutesBefore,
            type=req.type,
            repeat=req.repeat,
            enabled=req.enabled
        )
        ACTIVE_REMINDERS.append(rem)
        return rem

    @staticmethod
    def get_all_reminders() -> List[Reminder]:
        return ACTIVE_REMINDERS
        
    @staticmethod
    def update_reminder(reminder_id: str, updates: Dict[str, Any]) -> Reminder:
        for rem in ACTIVE_REMINDERS:
            if rem.id == reminder_id:
                if "status" in updates and updates["status"] is not None:
                    rem.status = updates["status"]
                if "enabled" in updates and updates["enabled"] is not None:
                    rem.enabled = updates["enabled"]
                return rem
        return None

    @staticmethod
    def delete_reminder(reminder_id: str) -> bool:
        global ACTIVE_REMINDERS
        initial_len = len(ACTIVE_REMINDERS)
        ACTIVE_REMINDERS[:] = [r for r in ACTIVE_REMINDERS if r.id != reminder_id]
        return len(ACTIVE_REMINDERS) < initial_len

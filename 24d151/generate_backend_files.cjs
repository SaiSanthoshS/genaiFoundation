const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');

const files = {
  'requirements.txt': `fastapi==0.110.0\nuvicorn==0.27.1\npydantic==2.6.3\npydantic-settings==2.2.1\n`,
  '.env.example': `API_V1_STR=/api/v1\nPROJECT_NAME="Journey API"\nCORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]\n`,
  'README.md': `# Journey API\n\nFastAPI backend for Journey application.\n\n## Setup\n\n1. \`python -m venv venv\`\n2. \`venv\\Scripts\\activate\`\n3. \`pip install -r requirements.txt\`\n4. \`uvicorn app.main:app --reload\`\n`,
  'app/core/config.py': `import os
import json
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Journey Planner API"
    
    # Parse CORS string correctly depending on how it's provided
    raw_cors: str = os.getenv("CORS_ORIGINS", '["*"]')
    try:
        BACKEND_CORS_ORIGINS: list[str] = json.loads(raw_cors)
    except Exception:
        BACKEND_CORS_ORIGINS: list[str] = ["*"]
        
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
`,
  'app/schemas/journey.py': `from pydantic import BaseModel
from typing import List, Optional

class RouteSegment(BaseModel):
    mode: str
    name: str
    lineCode: Optional[str] = None
    color: Optional[str] = None
    duration: int
    stops: int
    distance: float

class RouteOption(BaseModel):
    id: str
    name: str
    totalDuration: int
    startTime: str
    endTime: str
    segments: List[RouteSegment]
    cost: float
    co2Saved: float
    occupancy: str
    confidence: int
    reliability: int
    delayMinutes: int
    ecoFriendly: bool
    smartest: bool
    fastest: bool
    cheapest: bool

class DelayInfo(BaseModel):
    id: str
    line: str
    route: str
    status: str
    delayMinutes: int
    reason: str
    alternativeRouteId: str
    aiAnalysis: str
    active: bool

class Reminder(BaseModel):
    id: str
    routeName: str
    from_station: str
    to_station: str
    departureTime: str
    mode: str
    status: str
    minutesBefore: int
    type: str

class PlanRequest(BaseModel):
    origin: str
    destination: str
    ecoFriendly: bool = False
    avoidCrowds: bool = False
    cheapest: bool = False
    fastest: bool = True

class ReminderRequest(BaseModel):
    routeName: str
    from_station: str
    to_station: str
    departureTime: str
    mode: str
    minutesBefore: int
    type: str

class DelayRequest(BaseModel):
    route_id: str
`,
  'app/services/mock_data.py': `ROUTES = {
  "default": [
    {
      "id": "route-1", "name": "Nexus Subway Line 4 & Green Line Bus", "totalDuration": 28, "startTime": "08:05 AM", "endTime": "08:33 AM",
      "segments": [
        { "mode": "walk", "name": "Walk to Grand Central", "duration": 5, "stops": 0, "distance": 0.4 },
        { "mode": "subway", "name": "Nexus Subway Line 4", "lineCode": "N4", "color": "#004ac6", "duration": 15, "stops": 4, "distance": 8.2 },
        { "mode": "tram", "name": "Green Line Tram", "lineCode": "GL", "color": "#006c49", "duration": 6, "stops": 2, "distance": 2.1 },
        { "mode": "walk", "name": "Walk to destination", "duration": 2, "stops": 0, "distance": 0.1 }
      ], "cost": 2.75, "co2Saved": 3.4, "occupancy": "low", "confidence": 98, "reliability": 99, "delayMinutes": 0, "ecoFriendly": True, "smartest": True, "fastest": True, "cheapest": False
    },
    {
      "id": "route-2", "name": "Rapid Express Commuter Rail", "totalDuration": 32, "startTime": "08:10 AM", "endTime": "08:42 AM",
      "segments": [
        { "mode": "walk", "name": "Walk to Penn Station", "duration": 8, "stops": 0, "distance": 0.6 },
        { "mode": "train", "name": "Commuter Rail Line M1", "lineCode": "M1", "color": "#784b00", "duration": 20, "stops": 1, "distance": 12.5 },
        { "mode": "walk", "name": "Walk to destination", "duration": 4, "stops": 0, "distance": 0.3 }
      ], "cost": 5.50, "co2Saved": 2.8, "occupancy": "medium", "confidence": 94, "reliability": 95, "delayMinutes": 3, "ecoFriendly": False, "smartest": False, "fastest": False, "cheapest": False
    },
    {
      "id": "route-3", "name": "Metro City Bus 42 & Walk", "totalDuration": 45, "startTime": "07:55 AM", "endTime": "08:40 AM",
      "segments": [
        { "mode": "walk", "name": "Walk to Bus Stop 12", "duration": 3, "stops": 0, "distance": 0.2 },
        { "mode": "bus", "name": "Metro Bus 42", "lineCode": "B42", "color": "#ff9900", "duration": 38, "stops": 12, "distance": 6.8 },
        { "mode": "walk", "name": "Walk to destination", "duration": 4, "stops": 0, "distance": 0.3 }
      ], "cost": 1.50, "co2Saved": 4.2, "occupancy": "low", "confidence": 89, "reliability": 91, "delayMinutes": 0, "ecoFriendly": True, "smartest": False, "fastest": False, "cheapest": True
    }
  ],
  "specific": [
    {
      "id": "route-jfk", "name": "JFK AirTrain & Subway Line E", "totalDuration": 42, "startTime": "10:15 AM", "endTime": "10:57 AM",
      "segments": [
        { "mode": "subway", "name": "Subway Line E", "lineCode": "E", "color": "#004ac6", "duration": 25, "stops": 8, "distance": 14.2 },
        { "mode": "train", "name": "JFK AirTrain Red", "lineCode": "AIR", "color": "#737686", "duration": 12, "stops": 3, "distance": 6.5 },
        { "mode": "walk", "name": "Walk to Terminal 4", "duration": 5, "stops": 0, "distance": 0.4 }
      ], "cost": 11.25, "co2Saved": 5.8, "occupancy": "medium", "confidence": 96, "reliability": 97, "delayMinutes": 0, "ecoFriendly": True, "smartest": True, "fastest": True, "cheapest": False
    }
  ]
}

DELAYS = [
  { "id": "delay-1", "line": "Nexus Subway Line 4", "route": "Grand Central to Wall Street Plaza", "status": "minor", "delayMinutes": 3, "reason": "Signal maintenance at Union Square", "alternativeRouteId": "route-2", "aiAnalysis": "The 3-minute delay is stabilizing. Headway is returning to nominal levels.", "active": True },
  { "id": "delay-2", "line": "Metro Bus 104", "route": "Central Park West to Times Square", "status": "major", "delayMinutes": 14, "reason": "Street construction on Broadway", "alternativeRouteId": "route-1", "aiAnalysis": "Severe congestion surrounding 48th St. Commuter bus transit speed is down to 4 km/h.", "active": True },
  { "id": "delay-3", "line": "Rapid Rail Commuter Line M1", "route": "Hoboken to Penn Station", "status": "critical", "delayMinutes": 28, "reason": "Switch malfunction near Tunnel East", "alternativeRouteId": "route-3", "aiAnalysis": "Relay issues have bottlenecked all inbound transit on this corridor.", "active": True }
]
`,
  'app/services/journey_service.py': `from typing import List, Dict, Any
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
            type=req.type
        )
        ACTIVE_REMINDERS.append(rem)
        return rem
`,
  'app/api/endpoints/journey.py': `from fastapi import APIRouter, HTTPException
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
`,
  'app/api/api.py': `from fastapi import APIRouter
from app.api.endpoints import journey

api_router = APIRouter()
api_router.include_router(journey.router, prefix="/journey", tags=["journey"])
`,
  'app/main.py': `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}

app.include_router(api_router, prefix=settings.API_V1_STR)
`
};

for (const [file, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(backendDir, file), content, 'utf8');
}

console.log('Backend files generated.');

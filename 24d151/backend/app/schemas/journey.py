from pydantic import BaseModel
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

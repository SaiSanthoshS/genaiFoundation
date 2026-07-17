const fs = require('fs');
const path = require('path');

const schemasPath = path.join(__dirname, 'backend', 'app', 'schemas', 'journey.py');
let schemasContent = fs.readFileSync(schemasPath, 'utf8');

// Replace Reminder and ReminderRequest
schemasContent = schemasContent.replace(/class Reminder\(BaseModel\):[\s\S]*?class PlanRequest/m, `class Reminder(BaseModel):
    id: str
    routeName: str
    from_station: str
    to_station: str
    departureTime: str
    mode: str
    status: str
    minutesBefore: int
    type: str
    repeat: Optional[str] = "once"
    enabled: Optional[bool] = True

class PlanRequest`);

schemasContent = schemasContent.replace(/class ReminderRequest\(BaseModel\):[\s\S]*?class DelayRequest/m, `class ReminderRequest(BaseModel):
    routeName: str
    from_station: str
    to_station: str
    departureTime: str
    mode: str
    minutesBefore: int
    type: str
    repeat: Optional[str] = "once"
    enabled: Optional[bool] = True

class ReminderUpdateRequest(BaseModel):
    status: Optional[str] = None
    enabled: Optional[bool] = None

class DelayRequest`);
fs.writeFileSync(schemasPath, schemasContent, 'utf8');


const servicePath = path.join(__dirname, 'backend', 'app', 'services', 'journey_service.py');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

// Replace create_reminder and add CRUD
serviceContent = serviceContent.replace(/def create_reminder[\s\S]*?return rem/m, `def create_reminder(req: ReminderRequest) -> Reminder:
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
        return len(ACTIVE_REMINDERS) < initial_len`);
        
// Need to import Dict if not there
if (!serviceContent.includes('Dict')) {
    serviceContent = serviceContent.replace('from typing import List, Any', 'from typing import List, Dict, Any');
}

fs.writeFileSync(servicePath, serviceContent, 'utf8');

const endpointsPath = path.join(__dirname, 'backend', 'app', 'api', 'endpoints', 'journey.py');
let endpointsContent = fs.readFileSync(endpointsPath, 'utf8');

// Add ReminderUpdateRequest
endpointsContent = endpointsContent.replace('Reminder, DelayRequest', 'Reminder, DelayRequest, ReminderUpdateRequest');

// Add CRUD endpoints
endpointsContent = endpointsContent.replace(/def create_reminder\(req: ReminderRequest\):\n    return JourneyService.create_reminder\(req\)/m, `def create_reminder(req: ReminderRequest):
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
    return {"status": "success"}`);

fs.writeFileSync(endpointsPath, endpointsContent, 'utf8');
console.log('Backend patched for Reminder CRUD.');

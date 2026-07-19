# Travel Planner Quick Start Guide

## Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Open http://localhost:3000 in your browser
2. Fill in the trip planning form:
   - Add travelers' emails (comma-separated)
   - Add departing cities (comma-separated)
   - Set budget per person
   - Set trip duration and dates
   - Select vibes/preferences (optional)
3. Click "Plan My Trip" and wait for AI analysis
4. Review the 3 recommended destinations
5. Select your preferred option
6. Review the detailed itinerary
7. Generate a pitch email to send to your group

## API Testing

### Test with cURL

Plan a trip:
```bash
curl -X POST http://localhost:5000/api/plan-trip \
  -H "Content-Type: application/json" \
  -d '{
    "travelers": ["alice@email.com", "bob@email.com"],
    "departingCities": ["New York", "San Francisco"],
    "budget": 2000,
    "tripDuration": 5,
    "startDate": "2024-06-01",
    "endDate": "2024-06-06",
    "preferences": ["beach", "city"]
  }'
```

Get destinations:
```bash
curl "http://localhost:5000/api/destinations?preferences=beach&departingCities=NYC&budget=2000&duration=5"
```

Get weather:
```bash
curl "http://localhost:5000/api/weather?destination=Barcelona&date=2024-06-01"
```

## Architecture

```
User Browser (React Frontend)
        ↓
   Vite Dev Server (Port 3000)
        ↓
   Express Backend (Port 5000)
        ↓
   Claude API (Tool Calling Agent)
        ↓
   Travel Data Service (Mock APIs)
```

## Key Features

✈️ **AI Agent** - Claude with tools for intelligent trip planning
🏨 **Hotel Integration** - Mock hotel availability data
💰 **Budget Tracking** - Cost breakdown per person
📧 **Email Generation** - AI-written trip pitch emails
🎨 **Modern UI** - Beautiful React frontend with animations
🌍 **Multi-City Support** - Handles travelers from different cities

Enjoy planning your group trips!

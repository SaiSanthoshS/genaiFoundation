# Smart Public Transit Journey Planner

A production-ready full-stack application designed to revolutionize urban commute tracking, AI-assisted routing, and environmental accountability.

## Features
- **Smart Journey Planning**: AI-driven route combinations (Fastest, Cheapest, Eco-Friendly).
- **Live GPS Telemetry Map**: Interactive Vector Map via Leaflet tracking real-time vehicle carriage coordinates.
- **Dynamic Re-Routing Engine**: Automatic active itinerary swapping upon detection of municipal network disruptions.
- **Push Notification Departure Reminders**: Robust alarm system with background polling connected directly to OS-level Browser Notifications.
- **Eco Analytics Dashboard**: Tracks weekly CO2 offsets and visualizes commute impact via Recharts.

## Technology Stack
**Frontend:**
- React 19, TypeScript, Vite
- TailwindCSS v4
- React Router v7
- React Leaflet (OpenStreetMap)
- Vitest (Unit Testing)

**Backend:**
- Python 3.9+
- FastAPI, Uvicorn
- Pydantic (Type Validation)

## Setup & Installation

### 1. Clone & Environment
```bash
# Create a .env file from the example
cp .env.example .env
```

### 2. Run the FastAPI Backend
The backend utilizes an in-memory cache to handle routing, delays, and reminder persistence.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
> Visit http://localhost:8000/docs for full Swagger UI API Documentation.

### 3. Run the React Frontend
```bash
npm install
npm run dev
```
> Visit http://localhost:3000 to launch the app!

## Production Deployment
```bash
# Build the optimized static assets
npm run build
```

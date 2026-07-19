# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Browser                              │
│                  (React Frontend App)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Input Form   │  │ Comparison   │  │ Itinerary Selector   │  │
│  │              │→ │ Grid (3 top  │→ │ + Booking Preview    │  │
│  │ Preferences  │  │ destinations)│  │ + Email Generation   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         ↓                    ↓                    ↓              │
└─────────────────────────────────────────────────────────────────┘
              ↓
     HTTP / REST API
              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Backend Server (Express.js)                        │
│                  (Port 5000)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Express Routes                          │ │
│  │  - POST /api/plan-trip                                     │ │
│  │  - GET  /api/session/:sessionId                            │ │
│  │  - POST /api/session/:sessionId/select-itinerary           │ │
│  │  - POST /api/session/:sessionId/generate-pitch             │ │
│  │  - POST /api/flights                                       │ │
│  │  - POST /api/hotels                                        │ │
│  │  - GET  /api/weather                                       │ │
│  │  - GET  /api/destinations                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Travel Planning Agent (Claude API)              │ │
│  │                                                             │ │
│  │  - Uses Claude 3.5 Sonnet with Tool Calling                │ │
│  │  - Orchestrates tool calls for analysis                    │ │
│  │  - Generates recommendations and rankings                  │ │
│  │  - Creates AI-powered pitch emails                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Travel Data Service                           │ │
│  │                                                             │ │
│  │  Tools Available:                                           │ │
│  │  - get_destination_recommendations                          │ │
│  │  - analyze_flights                                          │ │
│  │  - analyze_accommodations                                   │ │
│  │  - check_weather                                            │ │
│  │  - generate_itinerary                                       │ │
│  │  - calculate_total_cost                                     │ │
│  │                                                             │ │
│  │  Data Sources (Mock):                                       │ │
│  │  - Flight Pricing Database                                 │ │
│  │  - Hotel Availability Database                             │ │
│  │  - Weather Information                                      │ │
│  │  - Destination Recommendations                             │ │
│  │  - Activity Itineraries                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
              ↓
     (In production, would integrate with)
              ↓
┌─────────────────────────────────────────────────────────────────┐
│              External APIs (Optional)                           │
├─────────────────────────────────────────────────────────────────┤
│  - Amadeus / Skyscanner (Flight APIs)                           │
│  - Booking.com / Airbnb (Hotel APIs)                            │
│  - OpenWeatherMap (Weather API)                                 │
│  - Google Maps (Location Services)                              │
│  - Tripadvisor (Activities & Reviews)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Trip Planning Request Flow

```
User Input
    ↓
POST /api/plan-trip
    ↓
Backend receives request
    ↓
Call planGroupTrip(tripRequest)
    ↓
Claude Agent Agentic Loop:
    ├─ get_destination_recommendations
    ├─ analyze_flights (for each city)
    ├─ analyze_accommodations
    ├─ check_weather
    ├─ generate_itinerary
    └─ calculate_total_cost
    ↓
Process results & rank top 3
    ↓
Return session with 3 options
    ↓
Frontend displays comparison grid
```

### 2. Itinerary Selection Flow

```
User selects itinerary
    ↓
POST /api/session/:sessionId/select-itinerary
    ↓
Store selection in session
    ↓
Display detailed itinerary
    ↓
User proceeds to booking
```

### 3. Email Generation Flow

```
User requests pitch email
    ↓
POST /api/session/:sessionId/generate-pitch
    ↓
Generate pitch using Claude API
    ↓
Return email + booking links
    ↓
User can copy and send to group
```

## Component Interaction

### Frontend Components

```
App.jsx (Main Controller)
├── InputForm.jsx
│   └─ Collects user preferences
│      └→ Calls /api/plan-trip
├── ComparisonGrid.jsx
│   └─ Displays 3 destinations
│      └→ Calls /api/session/:id/select-itinerary
├── ItinerarySelector.jsx
│   └─ Shows day-by-day activities
│      └→ Proceeds to booking
└── BookingPreviewModal.jsx
    └─ Shows booking links & email
       └→ Calls /api/session/:id/generate-pitch
```

### Backend Services

```
server.js (Express)
├── Routes Handler
├── Session Manager (in-memory)
└── Error Handler

travelAgent.js (Claude Agent)
├── planGroupTrip()
├── generateTripPitchEmail()
├── Agentic Loop with Tool Calling
└── Tool Processor

travelDataService.js (Data Provider)
├── getFlightQuote()
├── getHotelAvailability()
├── getWeatherData()
├── getDestinationRecommendations()
├── generateItinerary()
├── calculateCentralDestination()
└── getBookingLinks()
```

## Agent Interaction Pattern

```
┌─────────────────────────────────────────────────────┐
│         User's Trip Planning Request                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│      Claude Agent (claude-3-5-sonnet)               │
│                                                     │
│  STEP 1: Analyze trip requirements                  │
│  STEP 2: Call get_destination_recommendations()     │
│  STEP 3: For each destination, call:                │
│    - analyze_flights()                              │
│    - analyze_accommodations()                       │
│    - check_weather()                                │
│    - generate_itinerary()                           │
│  STEP 4: Process results & rank destinations        │
│  STEP 5: Generate final analysis with reasoning     │
│                                                     │
│  Agentic Loop:                                      │
│  - Sends message with tools available               │
│  - Receives tool calls (stop_reason: 'tool_use')    │
│  - Executes tools & sends results back              │
│  - Repeats until stop_reason: 'end_turn'            │
│  - Returns final text response                      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│   Processed Results (3 Ranked Itineraries)          │
│                                                     │
│   Option 1: Barcelona                               │
│   - Cost: $2,500/person                             │
│   - Weather: Sunny & 22°C                           │
│   - Activities: Beach, Culture, Food                │
│                                                     │
│   Option 2: Bali                                    │
│   - Cost: $1,800/person                             │
│   - Weather: Tropical & 28°C                        │
│   - Activities: Beach, Culture, Adventure           │
│                                                     │
│   Option 3: Tokyo                                   │
│   - Cost: $2,800/person                             │
│   - Weather: Clear & 18°C                           │
│   - Activities: City, Culture, Technology           │
└─────────────────────────────────────────────────────┘
```

## Deployment

### Development
- Frontend: `http://localhost:3000` (Vite dev server)
- Backend: `http://localhost:5000` (Express dev server)

### Production (Docker)
```bash
docker-compose up -d
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### Cloud Deployment Options
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Heroku, AWS Lambda, Google Cloud Run, Azure Container Instances
- **Database** (optional): MongoDB, PostgreSQL

## Performance Considerations

1. **Agent Calls**: Each trip plan triggers 3-5 Claude API calls
   - Typical latency: 3-8 seconds
   - Cost: ~0.02-0.05 per trip plan

2. **Session Storage**: Currently in-memory
   - Recommended: Redis for scalability
   - Database: MongoDB for persistence

3. **Caching**: Implement destination/weather caching
   - Reduce redundant API calls
   - Faster response times

## Security

- API key stored in environment variables (never in code)
- CORS enabled for frontend access
- Input validation on all endpoints
- Rate limiting recommended for production
- HTTPS recommended for production

## Testing

### Manual Testing
- Use provided cURL examples
- Test each component independently
- Verify agent tool calling

### Automated Testing (Future)
- Jest for unit tests
- Cypress for E2E tests
- Load testing with Artillery

## Monitoring & Logging

Recommended additions:
- Winston for logging
- Sentry for error tracking
- Datadog/New Relic for performance monitoring
- CloudWatch for AWS deployments

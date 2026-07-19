# Collaborative Travel & Itinerary Planner

An AI-powered web application that helps groups plan collaborative trips. The application uses Claude API agents to analyze flights, accommodations, weather, and create personalized itineraries.

## Features

- **AI Agent Backend**: Uses Claude with tool calling to:
  - Analyze multiple destination options
  - Fetch flight quotes from multiple departure cities
  - Check hotel availability and pricing
  - Get weather information
  - Generate day-by-day itineraries
  - Rank top 3 destinations by cost and preferences

- **Frontend Interface**:
  - **Input Form**: Collect group preferences, budget, travel dates, and vibes
  - **Comparison Grid**: Visual matrix showing flight costs, durations, weather for 3 cities
  - **Itinerary Selector**: Day-by-day breakdown of the selected trip
  - **Booking Preview Modal**: Aggregated booking links and AI-generated trip pitch email

## Project Structure

```
travel-planner-app/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js              # Express server & API endpoints
│   ├── travelAgent.js         # Claude agent with tools
│   └── travelDataService.js   # Travel data and mock APIs
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       │   ├── InputForm.jsx
│       │   ├── ComparisonGrid.jsx
│       │   ├── ItinerarySelector.jsx
│       │   └── BookingPreviewModal.jsx
│       └── styles/
│           ├── InputForm.css
│           ├── ComparisonGrid.css
│           ├── ItinerarySelector.css
│           └── BookingPreviewModal.css
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key (get it from https://console.anthropic.com)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Anthropic API key to `.env`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   PORT=5000
   NODE_ENV=development
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

   The server will run at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run at `http://localhost:3000`

## API Endpoints

### Plan Trip
**POST** `/api/plan-trip`

Request body:
```json
{
  "travelers": ["john@email.com", "jane@email.com"],
  "departingCities": ["New York", "Los Angeles"],
  "budget": 2000,
  "tripDuration": 5,
  "startDate": "2024-06-01",
  "endDate": "2024-06-06",
  "preferences": ["beach", "city", "culture"]
}
```

Response:
```json
{
  "sessionId": "uuid",
  "topItineraries": [...],
  "agentInsights": "Agent analysis text..."
}
```

### Get Session
**GET** `/api/session/:sessionId`

Returns complete trip planning session data.

### Select Itinerary
**POST** `/api/session/:sessionId/select-itinerary`

Request body:
```json
{
  "itineraryId": "uuid"
}
```

### Generate Pitch Email
**POST** `/api/session/:sessionId/generate-pitch`

Returns AI-generated trip pitch email and booking links.

### Get Flight Quotes
**POST** `/api/flights`

### Get Hotel Availability
**POST** `/api/hotels`

### Get Weather
**GET** `/api/weather?destination=Barcelona&date=2024-06-01`

### Get Destinations
**GET** `/api/destinations?preferences=beach&departingCities=NYC&budget=2000&duration=5`

## How It Works

1. **User Inputs Trip Requirements**
   - Travelers' emails/names
   - Departure cities
   - Budget per person
   - Travel dates and duration
   - Preferred vibes/interests

2. **Agent Analyzes Options**
   - Uses Claude to orchestrate tool calls
   - Fetches flight quotes from each departure city
   - Checks hotel availability
   - Retrieves weather data
   - Generates personalized itineraries
   - Calculates costs and ranks destinations

3. **User Selects Destination**
   - Views comparison grid with top 3 options
   - Compares costs, weather, and travel times
   - Selects preferred destination

4. **Detailed Itinerary Review**
   - Day-by-day activity breakdown
   - Cost breakdown per person
   - Meal and activity suggestions

5. **Booking Confirmation**
   - Aggregated booking links
   - AI-generated trip pitch email
   - Send to group or export

## Technology Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Claude API** - AI Agent with tool calling
- **Axios** - HTTP client
- **UUID** - Unique ID generation

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **CSS3** - Styling

## Customization

### Mock Data
The `travelDataService.js` contains mock travel data. To integrate real APIs:

1. Replace `getFlightQuote()` with real flight API (e.g., Amadeus, Skyscanner)
2. Replace `getHotelAvailability()` with real booking API (e.g., Booking.com, Airbnb API)
3. Replace `getWeatherData()` with real weather API (e.g., OpenWeatherMap)

### Destinations
Update the `mockDestinations` array in `travelDataService.js` to include more cities.

### Agent Behavior
Modify the system prompt and tools in `travelAgent.js` to change how the agent analyzes trips.

## Environment Variables

```
ANTHROPIC_API_KEY=your_anthropic_api_key
PORT=5000 (backend port)
NODE_ENV=development
```

## Future Enhancements

- [ ] Real flight/hotel API integrations
- [ ] User authentication and saved trips
- [ ] Payment integration
- [ ] Group chat and discussion feature
- [ ] Calendar sync for bookings
- [ ] Travel insurance recommendations
- [ ] Visa requirement checking
- [ ] Budget tracking and splitting
- [ ] Real-time availability updates
- [ ] Multi-language support

## Troubleshooting

### Backend errors
- Ensure ANTHROPIC_API_KEY is set correctly
- Check that port 5000 is not in use
- Verify Node.js version is 18+

### Frontend not connecting to backend
- Ensure backend is running on port 5000
- Check CORS is enabled (it is by default)
- Verify proxy setting in vite.config.js

### Agent not responding
- Check API key is valid
- Review Claude API rate limits
- Check browser console for errors

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on the repository.

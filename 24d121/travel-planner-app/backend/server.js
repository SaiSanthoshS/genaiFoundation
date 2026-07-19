import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { planGroupTrip, generateTripPitchEmail } from './travelAgent.js';
import {
  getFlightQuote,
  getHotelAvailability,
  getWeatherData,
  getDestinationRecommendations,
  generateItinerary,
  getBookingLinks
} from './travelDataService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Store for trip planning sessions
const tripSessions = {};

// Helper function to store trip analysis
async function analyzeTripOptions(tripRequest) {
  try {
    const analysis = await planGroupTrip(tripRequest);
    
    // Parse the agent's analysis to extract top 3 destinations
    // In production, you'd parse this more carefully
    const topDestinations = getDestinationRecommendations(
      tripRequest.preferences,
      tripRequest.departingCities,
      tripRequest.budget,
      tripRequest.tripDuration
    ).slice(0, 3);

    const itineraries = await Promise.all(
      topDestinations.map(async (dest) => {
        const itinerary = generateItinerary(
          dest.city,
          tripRequest.tripDuration,
          tripRequest.preferences
        );
        
        const flights = tripRequest.departingCities.map(city =>
          getFlightQuote(city, dest.city, tripRequest.travelers, tripRequest.startDate)
        );
        
        const hotels = getHotelAvailability(
          dest.city,
          tripRequest.startDate,
          tripRequest.endDate,
          tripRequest.travelers
        );
        
        const totalFlightCost = flights.reduce((sum, f) => sum + f.price, 0);
        
        return {
          id: uuidv4(),
          destination: dest.city,
          country: dest.country,
          vibes: dest.vibe,
          score: dest.score,
          flights: flights,
          totalFlightCost,
          hotels: hotels,
          itinerary: itinerary,
          weather: getWeatherData(dest.city, tripRequest.startDate),
          costBreakdown: {
            flightsTotal: totalFlightCost,
            flightsPerPerson: Math.round(totalFlightCost / tripRequest.travelers.length),
            hotelTotal: hotels.totalPrice,
            hotelPerPerson: Math.round(hotels.totalPrice / tripRequest.travelers.length),
            grandTotal: totalFlightCost + hotels.totalPrice,
            grandTotalPerPerson: Math.round((totalFlightCost + hotels.totalPrice) / tripRequest.travelers.length)
          },
          bookingLinks: getBookingLinks(
            dest.city,
            hotels.hotels[0],
            flights[0],
            { start: tripRequest.startDate, end: tripRequest.endDate }
          )
        };
      })
    );

    return {
      agentAnalysis: analysis,
      topItineraries: itineraries
    };
  } catch (error) {
    console.error('Error analyzing trip:', error);
    throw error;
  }
}

// Routes

/**
 * POST /api/plan-trip
 * Initiates trip planning with user preferences
 */
app.post('/api/plan-trip', async (req, res) => {
  try {
    const {
      travelers,
      departingCities,
      budget,
      tripDuration,
      startDate,
      endDate,
      preferences
    } = req.body;

    // Validate input
    if (!travelers || !departingCities || !budget || !tripDuration || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionId = uuidv4();
    
    const tripRequest = {
      travelers,
      departingCities,
      budget,
      tripDuration,
      startDate,
      endDate,
      preferences: preferences || []
    };

    // Analyze trip options (this calls the agent)
    const analysis = await analyzeTripOptions(tripRequest);
    
    tripSessions[sessionId] = {
      id: sessionId,
      tripRequest,
      analysis,
      createdAt: new Date(),
      selectedItinerary: null,
      pitchEmail: null
    };

    res.json({
      sessionId,
      topItineraries: analysis.topItineraries,
      agentInsights: analysis.agentAnalysis
    });
  } catch (error) {
    console.error('Error planning trip:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/session/:sessionId
 * Retrieve trip planning session details
 */
app.get('/api/session/:sessionId', (req, res) => {
  const session = tripSessions[req.params.sessionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.id,
    tripRequest: session.tripRequest,
    topItineraries: session.analysis.topItineraries,
    selectedItinerary: session.selectedItinerary,
    pitchEmail: session.pitchEmail
  });
});

/**
 * POST /api/session/:sessionId/select-itinerary
 * Select one of the top 3 itineraries
 */
app.post('/api/session/:sessionId/select-itinerary', (req, res) => {
  const session = tripSessions[req.params.sessionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { itineraryId } = req.body;
  const itinerary = session.analysis.topItineraries.find(it => it.id === itineraryId);

  if (!itinerary) {
    return res.status(400).json({ error: 'Itinerary not found' });
  }

  session.selectedItinerary = itinerary;

  res.json({
    message: 'Itinerary selected successfully',
    selectedItinerary: itinerary
  });
});

/**
 * POST /api/session/:sessionId/generate-pitch
 * Generate trip pitch email
 */
app.post('/api/session/:sessionId/generate-pitch', async (req, res) => {
  try {
    const session = tripSessions[req.params.sessionId];
    
    if (!session || !session.selectedItinerary) {
      return res.status(400).json({ error: 'No itinerary selected for this session' });
    }

    const tripDetails = {
      destination: session.selectedItinerary.destination,
      startDate: session.tripRequest.startDate,
      endDate: session.tripRequest.endDate,
      costPerPerson: session.selectedItinerary.costBreakdown.grandTotalPerPerson,
      highlights: session.selectedItinerary.itinerary
        .slice(0, 3)
        .map(day => day.title),
      bookingInfo: 'Flight + Hotel bookings will be shared separately'
    };

    const pitchEmail = await generateTripPitchEmail(tripDetails);
    session.pitchEmail = pitchEmail;

    res.json({
      email: pitchEmail,
      bookingLinks: session.selectedItinerary.bookingLinks,
      costBreakdown: session.selectedItinerary.costBreakdown,
      participants: session.tripRequest.travelers
    });
  } catch (error) {
    console.error('Error generating pitch:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/flights
 * Get flight quotes for specific routes
 */
app.post('/api/flights', (req, res) => {
  try {
    const { departure, destination, travelers, date } = req.body;
    
    if (!departure || !destination || !travelers || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quote = getFlightQuote(departure, destination, travelers, date);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/hotels
 * Get hotel availability and pricing
 */
app.post('/api/hotels', (req, res) => {
  try {
    const { destination, checkIn, checkOut, travelers } = req.body;
    
    if (!destination || !checkIn || !checkOut || !travelers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const availability = getHotelAvailability(destination, checkIn, checkOut, travelers);
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/weather
 * Get weather information for a destination
 */
app.get('/api/weather', (req, res) => {
  try {
    const { destination, date } = req.query;
    
    if (!destination || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const weather = getWeatherData(destination, date);
    
    if (!weather) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/destinations
 * Get recommended destinations based on preferences
 */
app.get('/api/destinations', (req, res) => {
  try {
    const { preferences, departingCities, budget, duration } = req.query;
    
    if (!preferences || !departingCities || !budget || !duration) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const prefs = typeof preferences === 'string' ? [preferences] : preferences;
    const cities = typeof departingCities === 'string' ? [departingCities] : departingCities;

    const recommendations = getDestinationRecommendations(
      prefs,
      cities,
      parseFloat(budget),
      parseInt(duration)
    );

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/itinerary
 * Generate a day-by-day itinerary
 */
app.post('/api/itinerary', (req, res) => {
  try {
    const { destination, duration, preferences } = req.body;
    
    if (!destination || !duration || !preferences) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const itinerary = generateItinerary(destination, duration, preferences);
    res.json(itinerary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Travel Planner API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Travel Planner API server running on http://localhost:${PORT}`);
  console.log('Make sure GROQ_API_KEY is set in .env file');
});

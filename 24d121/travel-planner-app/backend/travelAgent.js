// Travel Planning Agent using Groq API
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import {
  getFlightQuote,
  getHotelAvailability,
  getWeatherData,
  getDestinationRecommendations,
  calculateCentralDestination,
  generateItinerary,
  getBookingLinks
} from './travelDataService.js';

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Define tools for the agent
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_destination_recommendations',
      description: 'Get recommended destinations based on traveler preferences, departure cities, budget, and trip duration',
      parameters: {
        type: 'object',
        properties: {
          preferences: {
            type: 'array',
            items: { type: 'string' },
            description: 'Travel preferences (beach, city, culture, adventure, nightlife, romantic)'
          },
          departure_cities: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of cities travelers are departing from'
          },
          budget: {
            type: 'number',
            description: 'Total budget per person in USD'
          },
          duration_days: {
            type: 'number',
            description: 'Number of days for the trip'
          }
        },
        required: ['preferences', 'departure_cities', 'budget', 'duration_days']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_flights',
      description: 'Get flight quotes from departure cities to a specific destination',
      parameters: {
        type: 'object',
        properties: {
          departure_cities: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of departure cities'
          },
          destination: {
            type: 'string',
            description: 'Target destination city'
          },
          travelers: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of traveler names or emails'
          },
          date: {
            type: 'string',
            description: 'Departure date (YYYY-MM-DD)'
          }
        },
        required: ['departure_cities', 'destination', 'travelers', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_accommodations',
      description: 'Get hotel/Airbnb availability and pricing for a destination',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'Target destination city'
          },
          check_in: {
            type: 'string',
            description: 'Check-in date (YYYY-MM-DD)'
          },
          check_out: {
            type: 'string',
            description: 'Check-out date (YYYY-MM-DD)'
          },
          travelers: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of travelers'
          }
        },
        required: ['destination', 'check_in', 'check_out', 'travelers']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_weather',
      description: 'Get weather information for a destination on a specific date',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'Destination city'
          },
          date: {
            type: 'string',
            description: 'Date to check weather (YYYY-MM-DD)'
          }
        },
        required: ['destination', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_itinerary',
      description: 'Generate a day-by-day itinerary for a destination',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'Destination city'
          },
          duration_days: {
            type: 'number',
            description: 'Number of days'
          },
          preferences: {
            type: 'array',
            items: { type: 'string' },
            description: 'Travel preferences'
          }
        },
        required: ['destination', 'duration_days', 'preferences']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_total_cost',
      description: 'Calculate total trip cost breakdown',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'Destination city'
          },
          flight_cost: {
            type: 'number',
            description: 'Total flight cost'
          },
          hotel_cost: {
            type: 'number',
            description: 'Total hotel cost'
          },
          travelers_count: {
            type: 'number',
            description: 'Number of travelers'
          }
        },
        required: ['destination', 'flight_cost', 'hotel_cost', 'travelers_count']
      }
    }
  }
];

// Process tool calls
function processToolCall(toolName, toolInput) {
  switch (toolName) {
    case 'get_destination_recommendations':
      return getDestinationRecommendations(
        toolInput.preferences,
        toolInput.departure_cities,
        toolInput.budget,
        toolInput.duration_days
      );
    
    case 'analyze_flights':
      return toolInput.departure_cities.map(city => ({
        from: city,
        ...getFlightQuote(city, toolInput.destination, toolInput.travelers, toolInput.date)
      }));
    
    case 'analyze_accommodations':
      return getHotelAvailability(
        toolInput.destination,
        toolInput.check_in,
        toolInput.check_out,
        toolInput.travelers
      );
    
    case 'check_weather':
      return getWeatherData(toolInput.destination, toolInput.date);
    
    case 'generate_itinerary':
      return generateItinerary(
        toolInput.destination,
        toolInput.duration_days,
        toolInput.preferences
      );
    
    case 'calculate_total_cost':
      const perPerson = (toolInput.flight_cost + toolInput.hotel_cost) / toolInput.travelers_count;
      return {
        destination: toolInput.destination,
        flight_cost: toolInput.flight_cost,
        hotel_cost: toolInput.hotel_cost,
        total_cost: toolInput.flight_cost + toolInput.hotel_cost,
        cost_per_person: Math.round(perPerson),
        breakdown: {
          flights: Math.round(toolInput.flight_cost / toolInput.travelers_count),
          accommodation: Math.round(toolInput.hotel_cost / toolInput.travelers_count)
        }
      };
    
    default:
      return { error: 'Unknown tool' };
  }
}

export async function planGroupTrip(tripRequest) {
  const {
    travelers,
    departingCities,
    budget,
    tripDuration,
    startDate,
    endDate,
    preferences
  } = tripRequest;

  const prompt = `You are an expert travel planner AI agent. Your task is to help plan an optimal group trip.

Group Details:
- Travelers: ${travelers.join(', ')}
- Departing Cities: ${departingCities.join(', ')}
- Budget per person: $${budget}
- Trip Duration: ${tripDuration} days
- Travel Dates: ${startDate} to ${endDate}
- Preferences: ${preferences.join(', ')}

Please analyze potential destinations and create the top 3 itinerary options. For each option:
1. Use get_destination_recommendations to find suitable destinations
2. Analyze flights from all departure cities using analyze_flights
3. Check accommodations using analyze_accommodations
4. Check weather conditions using check_weather
5. Generate detailed itineraries using generate_itinerary
6. Calculate total costs using calculate_total_cost

After gathering all information, provide your analysis and rank the top 3 destination options with detailed reasoning and cost breakdowns.`;

  const messages = [{ role: 'user', content: prompt }];
  let response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4096,
    tools: tools,
    messages: messages
  });

  // Agentic loop - handle tool calls
  while (response.choices[0].finish_reason === 'tool_calls') {
    const assistantMessage = response.choices[0].message;
    messages.push({
      role: 'assistant',
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls
    });

    const toolCalls = assistantMessage.tool_calls || [];
    const toolResults = [];

    for (const toolCall of toolCalls) {
      const result = processToolCall(toolCall.function.name, JSON.parse(toolCall.function.arguments));
      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    messages.push(...toolResults);

    response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      tools: tools,
      messages: messages
    });
  }

  // Extract final text response
  const finalResponse = response.choices[0].message.content || '';

  return finalResponse;
}

export async function generateTripPitchEmail(tripDetails) {
  const prompt = `Write a compelling group trip invitation email for the following trip:
  
Destination: ${tripDetails.destination}
Dates: ${tripDetails.startDate} to ${tripDetails.endDate}
Total Cost per Person: $${tripDetails.costPerPerson}
Highlights: ${tripDetails.highlights.join(', ')}
Booking Details: ${tripDetails.bookingInfo}

Make it exciting, include all important details, and encourage everyone to confirm.`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content || '';
}

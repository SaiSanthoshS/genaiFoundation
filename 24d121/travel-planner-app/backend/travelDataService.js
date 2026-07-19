// Mock travel data service for fetching flights, hotels, and weather info
// In a production app, these would call real APIs

const mockDestinations = [
  {
    city: 'Barcelona',
    country: 'Spain',
    vibe: ['beach', 'city', 'culture'],
    weather: { temp: 22, condition: 'Sunny' },
    coordinates: { lat: 41.3851, lon: 2.1734 }
  },
  {
    city: 'Bali',
    country: 'Indonesia',
    vibe: ['beach', 'culture', 'adventure'],
    weather: { temp: 28, condition: 'Tropical' },
    coordinates: { lat: -8.6705, lon: 115.2126 }
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    vibe: ['city', 'culture', 'technology'],
    weather: { temp: 18, condition: 'Clear' },
    coordinates: { lat: 35.6762, lon: 139.6503 }
  },
  {
    city: 'Miami',
    country: 'USA',
    vibe: ['beach', 'city', 'nightlife'],
    weather: { temp: 26, condition: 'Sunny' },
    coordinates: { lat: 25.7617, lon: -80.1918 }
  },
  {
    city: 'Paris',
    country: 'France',
    vibe: ['city', 'culture', 'romantic'],
    weather: { temp: 15, condition: 'Cloudy' },
    coordinates: { lat: 48.8566, lon: 2.3522 }
  },
  {
    city: 'Bangkok',
    country: 'Thailand',
    vibe: ['city', 'culture', 'adventure'],
    weather: { temp: 30, condition: 'Hot & Humid' },
    coordinates: { lat: 13.7563, lon: 100.5018 }
  }
];

export function getFlightQuote(departure, destination, travelers, date) {
  // Mock flight pricing based on distance and travelers
  const basePrice = Math.random() * 600 + 200;
  const multiplier = travelers.length;
  const totalPrice = Math.round(basePrice * multiplier);
  
  return {
    departure,
    destination,
    date,
    travelers: travelers.length,
    price: totalPrice,
    pricePerPerson: Math.round(totalPrice / travelers.length),
    airline: ['United', 'Delta', 'American', 'Southwest'][Math.floor(Math.random() * 4)],
    duration: Math.floor(Math.random() * 12) + 2, // 2-14 hours
    stops: Math.random() > 0.6 ? 0 : 1
  };
}

export function getHotelAvailability(destination, checkIn, checkOut, travelers) {
  const nights = Math.floor((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const roomsNeeded = Math.ceil(travelers.length / 2);
  const pricePerNight = Math.random() * 200 + 80;
  const totalPrice = Math.round(pricePerNight * nights * roomsNeeded);
  
  return {
    destination,
    checkIn,
    checkOut,
    nights,
    rooms: roomsNeeded,
    pricePerNight: Math.round(pricePerNight),
    totalPrice,
    hotels: [
      {
        name: 'Luxury Resort ' + destination,
        stars: 5,
        price: Math.round(totalPrice * 1.5),
        amenities: ['Pool', 'Spa', 'Restaurant', 'Gym']
      },
      {
        name: 'Boutique Hotel ' + destination,
        stars: 4,
        price: totalPrice,
        amenities: ['WiFi', 'Restaurant', 'Room Service']
      },
      {
        name: 'Budget Inn ' + destination,
        stars: 3,
        price: Math.round(totalPrice * 0.6),
        amenities: ['WiFi', 'Breakfast']
      }
    ]
  };
}

export function getWeatherData(destination, date) {
  const dest = mockDestinations.find(d => d.city === destination);
  if (!dest) return null;
  
  const tempVariation = (Math.random() - 0.5) * 5;
  
  return {
    destination,
    date,
    temperature: Math.round(dest.weather.temp + tempVariation),
    condition: dest.weather.condition,
    humidity: Math.random() * 40 + 40,
    windSpeed: Math.random() * 20 + 5
  };
}

export function getDestinationRecommendations(preferences, departureCities, budget, duration) {
  // Recommend destinations based on vibes and other preferences
  const vibeMatch = mockDestinations.filter(d => 
    preferences.some(pref => d.vibe.includes(pref.toLowerCase()))
  );
  
  return vibeMatch.slice(0, 5).map(dest => ({
    ...dest,
    averageFlightCost: Math.random() * 400 + 150,
    averageHotelPerNight: Math.random() * 150 + 60,
    score: Math.random() * 100
  })).sort((a, b) => b.score - a.score);
}

export function calculateCentralDestination(departureCities) {
  // Calculate a central destination that minimizes total travel time
  // This is a simplified version
  const recommendations = mockDestinations;
  
  return recommendations.map(dest => ({
    destination: dest.city,
    country: dest.country,
    coordinates: dest.coordinates,
    averageTravelTime: Math.floor(Math.random() * 20) + 2,
    totalTravelCost: Math.floor(Math.random() * 3000) + 1000,
    vibes: dest.vibe
  })).sort((a, b) => (a.averageTravelTime + a.totalTravelCost/500) - (b.averageTravelTime + b.totalTravelCost/500));
}

export function generateItinerary(destination, duration, preferences) {
  const days = [];
  const activities = {
    beach: ['Relax on the beach', 'Swim and snorkel', 'Beach volleyball', 'Sunset watching'],
    city: ['City tour', 'Museum visit', 'Shopping', 'Street food tour'],
    culture: ['Cultural site visit', 'Local market', 'Traditional ceremony', 'Art gallery'],
    adventure: ['Hiking', 'Water sports', 'Zip-lining', 'Rock climbing'],
    nightlife: ['Club', 'Bar crawl', 'Karaoke', 'Live music venue'],
    romantic: ['Couples spa', 'Fine dining', 'Sunset dinner', 'Couples massage']
  };
  
  for (let i = 1; i <= duration; i++) {
    const dayActivities = [];
    preferences.forEach(pref => {
      if (activities[pref.toLowerCase()]) {
        dayActivities.push(activities[pref.toLowerCase()][Math.floor(Math.random() * activities[pref.toLowerCase()].length)]);
      }
    });
    
    days.push({
      day: i,
      title: `Day ${i} - ${dayActivities[0] || 'Exploration'}`,
      activities: dayActivities.slice(0, 3),
      meals: ['Breakfast', 'Lunch', 'Dinner']
    });
  }
  
  return days;
}

export function getBookingLinks(destination, hotel, flight, dates) {
  return {
    flights: `https://example-travel.com/flights?from=USA&to=${destination}&date=${dates.start}`,
    hotels: `https://example-hotels.com/search?location=${destination}&checkin=${dates.start}&checkout=${dates.end}`,
    activities: `https://example-activities.com/search?location=${destination}`,
    restaurants: `https://example-restaurants.com/search?location=${destination}`
  };
}

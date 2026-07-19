import React from 'react';
import '../styles/ComparisonGrid.css';

function ComparisonGrid({ itineraries, onSelectItinerary, loading }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="comparison-grid-container">
      <h2>Top 3 Destination Options 🌍</h2>
      <p className="subtitle">AI Agent analyzed flights, hotels, and weather for the perfect match</p>

      <div className="comparison-grid">
        {itineraries.map((itinerary, index) => (
          <div key={itinerary.id} className="destination-card">
            <div className="rank-badge">#{index + 1}</div>
            
            <h3>{itinerary.destination}, {itinerary.country}</h3>
            
            <div className="card-section">
              <h4>Vibes</h4>
              <div className="vibes">
                {itinerary.vibes.map(vibe => (
                  <span key={vibe} className="vibe-tag">{vibe}</span>
                ))}
              </div>
            </div>

            <div className="card-section">
              <h4>Weather</h4>
              <p className="weather-info">
                🌡️ {itinerary.weather.temperature}°C - {itinerary.weather.condition}
              </p>
            </div>

            <div className="card-section">
              <h4>Flight Info</h4>
              <p>
                💺 Total: {formatCurrency(itinerary.totalFlightCost)}
              </p>
              <p className="text-small">
                Per Person: {formatCurrency(Math.round(itinerary.totalFlightCost / itinerary.flights.length))}
              </p>
            </div>

            <div className="card-section">
              <h4>Accommodation</h4>
              <p>
                🏨 {itinerary.hotels.nights} nights
              </p>
              <p className="text-small">
                {formatCurrency(itinerary.costBreakdown.hotelPerPerson)} per person/night
              </p>
            </div>

            <div className="card-section cost-summary">
              <h4>Total Cost Per Person</h4>
              <p className="total-cost">
                {formatCurrency(itinerary.costBreakdown.grandTotalPerPerson)}
              </p>
            </div>

            <div className="flight-routes">
              <h4>Flight Routes</h4>
              {itinerary.flights.map((flight, i) => (
                <div key={i} className="flight-route">
                  <span>{flight.departure} → {flight.destination}</span>
                  <span>{formatCurrency(flight.pricePerPerson)}</span>
                </div>
              ))}
            </div>

            <button
              className="select-button"
              onClick={() => onSelectItinerary(itinerary)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'View Full Itinerary →'}
            </button>
          </div>
        ))}
      </div>

      <div className="comparison-note">
        💡 All prices include flights for all travelers and hotel accommodations
      </div>
    </div>
  );
}

export default ComparisonGrid;

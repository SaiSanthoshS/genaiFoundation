import React from 'react';
import '../styles/ItinerarySelector.css';

function ItinerarySelector({ itinerary, onProceedToBooking }) {
  const getDayOfWeek = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="itinerary-selector">
      <h2>{itinerary.destination} - Day-by-Day Itinerary</h2>
      
      <div className="trip-header">
        <div className="trip-info">
          <span>📍 {itinerary.destination}, {itinerary.country}</span>
          <span>🏨 {itinerary.hotels.nights} nights</span>
          <span>👥 {itinerary.flights[0].travelers} travelers</span>
        </div>
        <div className="trip-cost">
          <p className="cost-per-person">
            ${itinerary.costBreakdown.grandTotalPerPerson.toLocaleString()}
          </p>
          <p className="cost-label">per person</p>
        </div>
      </div>

      <div className="itinerary-timeline">
        {itinerary.itinerary.map((day, index) => (
          <div key={index} className="itinerary-day">
            <div className="day-header">
              <div className="day-number">Day {day.day}</div>
              <h3>{day.title}</h3>
            </div>

            <div className="day-content">
              <div className="activities">
                <h4>🎯 Activities</h4>
                <ul>
                  {day.activities.map((activity, i) => (
                    <li key={i}>{activity}</li>
                  ))}
                </ul>
              </div>

              <div className="meals">
                <h4>🍽️ Meals</h4>
                <ul>
                  {day.meals.map((meal, i) => (
                    <li key={i}>{meal}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="itinerary-footer">
        <div className="cost-breakdown">
          <h3>Cost Breakdown</h3>
          <div className="breakdown-items">
            <div className="breakdown-item">
              <span>Flights (total)</span>
              <span>${itinerary.costBreakdown.flightsTotal.toLocaleString()}</span>
            </div>
            <div className="breakdown-item">
              <span>Hotels (total)</span>
              <span>${itinerary.costBreakdown.hotelTotal.toLocaleString()}</span>
            </div>
            <div className="breakdown-item total">
              <span>Total Trip Cost</span>
              <span>${itinerary.costBreakdown.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button 
          className="proceed-button"
          onClick={onProceedToBooking}
        >
          Proceed to Booking →
        </button>
      </div>
    </div>
  );
}

export default ItinerarySelector;

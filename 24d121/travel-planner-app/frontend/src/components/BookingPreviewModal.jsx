import React, { useState } from 'react';
import '../styles/BookingPreviewModal.css';

function BookingPreviewModal({ itinerary, onGeneratePitch, pitchEmail, loading, onReset }) {
  const [emailCopied, setEmailCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <div className="booking-preview-modal">
      <h2>Booking Preview & Group Communication</h2>

      <div className="modal-content">
        <div className="booking-section">
          <h3>✈️ Flight Bookings</h3>
          <div className="booking-links">
            {itinerary.bookingLinks.flights && (
              <a href={itinerary.bookingLinks.flights} target="_blank" rel="noopener noreferrer" className="booking-link">
                Book Flights
              </a>
            )}
          </div>

          <h3>🏨 Hotel Bookings</h3>
          <div className="booking-links">
            {itinerary.bookingLinks.hotels && (
              <a href={itinerary.bookingLinks.hotels} target="_blank" rel="noopener noreferrer" className="booking-link">
                Book Hotels
              </a>
            )}
            {itinerary.bookingLinks.activities && (
              <a href={itinerary.bookingLinks.activities} target="_blank" rel="noopener noreferrer" className="booking-link">
                Book Activities
              </a>
            )}
            {itinerary.bookingLinks.restaurants && (
              <a href={itinerary.bookingLinks.restaurants} target="_blank" rel="noopener noreferrer" className="booking-link">
                Reserve Restaurants
              </a>
            )}
          </div>
        </div>

        <div className="trip-summary">
          <h3>Trip Summary</h3>
          <div className="summary-items">
            <div className="summary-item">
              <span>📍 Destination</span>
              <span>{itinerary.destination}, {itinerary.country}</span>
            </div>
            <div className="summary-item">
              <span>🏨 Stay Duration</span>
              <span>{itinerary.hotels.nights} nights</span>
            </div>
            <div className="summary-item">
              <span>💺 Travelers</span>
              <span>{itinerary.flights.length} people</span>
            </div>
            <div className="summary-item">
              <span>💰 Total Cost</span>
              <span>${itinerary.costBreakdown.grandTotal.toLocaleString()}</span>
            </div>
            <div className="summary-item highlight">
              <span>Per Person</span>
              <span>${itinerary.costBreakdown.grandTotalPerPerson.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="pitch-section">
          <h3>📧 Trip Pitch Email to Group</h3>
          
          {!pitchEmail ? (
            <button 
              className="generate-button"
              onClick={onGeneratePitch}
              disabled={loading}
            >
              {loading ? 'Generating Email...' : 'Generate AI-Written Email ✨'}
            </button>
          ) : (
            <div className="email-preview">
              <div className="email-content">
                {pitchEmail.email}
              </div>

              <div className="email-actions">
                <button 
                  className="copy-button"
                  onClick={() => copyToClipboard(pitchEmail.email)}
                >
                  {emailCopied ? '✓ Copied!' : 'Copy Email'}
                </button>

                <div className="email-tips">
                  <p><strong>💡 Tip:</strong> You can now:</p>
                  <ul>
                    <li>Copy this email and send to your group</li>
                    <li>Share the booking links with travelers</li>
                    <li>Edit the itinerary if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="reset-button" onClick={onReset}>
            Plan Another Trip
          </button>
          <a href="/api/session" className="export-button">
            Export Trip Details
          </a>
        </div>
      </div>
    </div>
  );
}

export default BookingPreviewModal;

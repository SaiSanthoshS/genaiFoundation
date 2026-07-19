import React, { useState } from 'react';
import axios from 'axios';
import InputForm from './components/InputForm';
import ComparisonGrid from './components/ComparisonGrid';
import ItinerarySelector from './components/ItinerarySelector';
import BookingPreviewModal from './components/BookingPreviewModal';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState('input'); // input, comparison, itinerary, booking
  const [sessionId, setSessionId] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [pitchEmail, setPitchEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlanTrip = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/plan-trip', {
        travelers: formData.emails.split(',').map(e => e.trim()),
        departingCities: formData.departingCities.split(',').map(c => c.trim()),
        budget: parseFloat(formData.budget),
        tripDuration: parseInt(formData.duration),
        startDate: formData.startDate,
        endDate: formData.endDate,
        preferences: formData.vibes.split(',').map(v => v.trim())
      });

      setSessionId(response.data.sessionId);
      setTripData(response.data);
      setCurrentStep('comparison');
    } catch (err) {
      setError(err.response?.data?.error || 'Error planning trip');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItinerary = async (itinerary) => {
    setLoading(true);
    setError(null);
    
    try {
      // Select the itinerary
      await axios.post(`/api/session/${sessionId}/select-itinerary`, {
        itineraryId: itinerary.id
      });

      setSelectedItinerary(itinerary);
      setCurrentStep('itinerary');
    } catch (err) {
      setError(err.response?.data?.error || 'Error selecting itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToBooking = () => {
    setCurrentStep('booking');
  };

  const handleGeneratePitch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`/api/session/${sessionId}/generate-pitch`);
      setPitchEmail(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error generating pitch email');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('input');
    setSessionId(null);
    setTripData(null);
    setSelectedItinerary(null);
    setPitchEmail(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>✈️ Collaborative Travel Planner</h1>
        <p>AI-Powered Group Trip Planning</p>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {currentStep === 'input' && (
          <InputForm onSubmit={handlePlanTrip} loading={loading} />
        )}

        {currentStep === 'comparison' && tripData && (
          <ComparisonGrid 
            itineraries={tripData.topItineraries}
            onSelectItinerary={handleSelectItinerary}
            loading={loading}
          />
        )}

        {currentStep === 'itinerary' && selectedItinerary && (
          <ItinerarySelector 
            itinerary={selectedItinerary}
            onProceedToBooking={handleProceedToBooking}
          />
        )}

        {currentStep === 'booking' && selectedItinerary && (
          <BookingPreviewModal 
            itinerary={selectedItinerary}
            onGeneratePitch={handleGeneratePitch}
            pitchEmail={pitchEmail}
            loading={loading}
            onReset={handleReset}
          />
        )}
      </main>

      {currentStep !== 'input' && (
        <button className="reset-button" onClick={handleReset}>
          ← Start Over
        </button>
      )}
    </div>
  );
}

export default App;

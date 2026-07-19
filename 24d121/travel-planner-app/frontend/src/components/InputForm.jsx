import React, { useState } from 'react';
import '../styles/InputForm.css';

function InputForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    emails: '',
    departingCities: '',
    budget: '',
    duration: '',
    startDate: '',
    endDate: '',
    vibes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.emails || !formData.departingCities || !formData.budget || 
        !formData.duration || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="input-form">
      <h2>Let's Plan Your Group Trip! 🎉</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="emails">Friend Group Emails *</label>
          <input
            type="text"
            id="emails"
            name="emails"
            placeholder="john@email.com, jane@email.com, bob@email.com"
            value={formData.emails}
            onChange={handleChange}
            required
          />
          <small>Comma-separated email addresses</small>
        </div>

        <div className="form-group">
          <label htmlFor="departingCities">Departing Cities *</label>
          <input
            type="text"
            id="departingCities"
            name="departingCities"
            placeholder="New York, Los Angeles, Chicago"
            value={formData.departingCities}
            onChange={handleChange}
            required
          />
          <small>Comma-separated city names</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="budget">Budget per Person (USD) *</label>
            <input
              type="number"
              id="budget"
              name="budget"
              placeholder="2000"
              value={formData.budget}
              onChange={handleChange}
              required
              min="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Trip Duration (days) *</label>
            <input
              type="number"
              id="duration"
              name="duration"
              placeholder="5"
              value={formData.duration}
              onChange={handleChange}
              required
              min="1"
              max="30"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="vibes">Preferred Vibes</label>
          <input
            type="text"
            id="vibes"
            name="vibes"
            placeholder="beach, city, culture, adventure, nightlife, romantic"
            value={formData.vibes}
            onChange={handleChange}
          />
          <small>Comma-separated preferences (optional)</small>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Planning Your Trip... ⏳' : 'Plan My Trip ✈️'}
        </button>
      </form>
    </div>
  );
}

export default InputForm;

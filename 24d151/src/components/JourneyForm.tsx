import React, { useState } from 'react';
import { ArrowLeftRight, MapPin, Calendar, Clock, Star, Zap, Search } from 'lucide-react';
import { POPULAR_STATIONS } from '../data';

interface JourneyFormProps {
  onSearch: (from: string, to: string, options: SearchOptions) => void;
  initialFrom?: string;
  initialTo?: string;
  loading?: boolean;
}

export interface SearchOptions {
  ecoFriendly: boolean;
  avoidCrowds: boolean;
  cheapest: boolean;
  fastest: boolean;
}

export default function JourneyForm({ onSearch, initialFrom = '', initialTo = '', loading = false }: JourneyFormProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [date, setDate] = useState('2026-07-17');
  const [time, setTime] = useState('08:00');
  
  const [options, setOptions] = useState<SearchOptions>({
    ecoFriendly: true,
    avoidCrowds: false,
    cheapest: false,
    fastest: true,
  });

  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;
    onSearch(from, to, options);
  };

  const handlePresetSelect = (presetFrom: string, presetTo: string) => {
    setFrom(presetFrom);
    setTo(presetTo);
    onSearch(presetFrom, presetTo, options);
  };

  const filteredFromStations = POPULAR_STATIONS.filter(st => st.toLowerCase().includes(from.toLowerCase()));
  const filteredToStations = POPULAR_STATIONS.filter(st => st.toLowerCase().includes(to.toLowerCase()));

  return (
    <div className="glass-card p-6 md:p-8 w-full shadow-lg relative overflow-hidden">
      {/* Absolute design background highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* FROM Input */}
          <div className="lg:col-span-5 relative">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Origin Station
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <MapPin className="w-5 h-5 text-primary" />
              </span>
              <input
                type="text"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setFromDropdownOpen(true);
                }}
                onFocus={() => setFromDropdownOpen(true)}
                onBlur={() => setTimeout(() => setFromDropdownOpen(false), 200)}
                placeholder="Enter starting station..."
                className="w-full pl-12 pr-4 h-14 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
              
              {/* Autocomplete Dropdown */}
              {fromDropdownOpen && filteredFromStations.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-outline-variant/30 rounded-xl shadow-xl z-20">
                  {filteredFromStations.map((station) => (
                    <button
                      key={station}
                      type="button"
                      onMouseDown={() => {
                        setFrom(station);
                        setFromDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-surface-low text-on-surface transition-all flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4 text-outline" />
                      {station}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SWAP Trigger Button */}
          <div className="lg:col-span-1 flex justify-center mt-4 lg:mt-5">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-full bg-surface-low border border-outline-variant/30 text-primary hover:bg-primary-container hover:text-white transition-all duration-300 shadow-md active:scale-95"
              title="Swap Origin and Destination"
            >
              <ArrowLeftRight className="w-5 h-5 lg:rotate-90" />
            </button>
          </div>

          {/* TO Input */}
          <div className="lg:col-span-6 relative">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Destination Station
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <MapPin className="w-5 h-5 text-secondary" />
              </span>
              <input
                type="text"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setToDropdownOpen(true);
                }}
                onFocus={() => setToDropdownOpen(true)}
                onBlur={() => setTimeout(() => setToDropdownOpen(false), 200)}
                placeholder="Enter final destination..."
                className="w-full pl-12 pr-4 h-14 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />

              {/* Autocomplete Dropdown */}
              {toDropdownOpen && filteredToStations.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-outline-variant/30 rounded-xl shadow-xl z-20">
                  {filteredToStations.map((station) => (
                    <button
                      key={station}
                      type="button"
                      onMouseDown={() => {
                        setTo(station);
                        setToDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-surface-low text-on-surface transition-all flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4 text-outline" />
                      {station}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Date, Time, and Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Date
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <Calendar className="w-5 h-5" />
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-12 pr-4 h-12 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Departure Time
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <Clock className="w-5 h-5" />
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-12 pr-4 h-12 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:bg-primary/95 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Calculating Routes...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find Smart Routes
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Routing Preferences Checkbox List */}
        <div className="pt-2 border-t border-outline-variant/30">
          <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
            AI Optimization Layer Preferences
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'ecoFriendly', label: 'Prioritize Eco Footprint', description: 'Lowest CO2 Emission' },
              { key: 'avoidCrowds', label: 'Avoid Crowd Density', description: 'Low Occupancy Cars' },
              { key: 'cheapest', label: 'Fares Optimization', description: 'Cheapest Cost' },
              { key: 'fastest', label: 'Velocity Priority', description: 'Shortest Commute' }
            ].map((option) => (
              <label
                key={option.key}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  options[option.key as keyof SearchOptions]
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                    : 'border-outline-variant/60 hover:bg-surface-low'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">{option.label}</span>
                  <input
                    type="checkbox"
                    checked={options[option.key as keyof SearchOptions]}
                    onChange={() =>
                      setOptions({
                        ...options,
                        [option.key as keyof SearchOptions]: !options[option.key as keyof SearchOptions]
                      })
                    }
                    className="h-4 w-4 rounded text-primary focus:ring-primary border-outline-variant/60 bg-transparent"
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 block">{option.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Popular Presets */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-tertiary" /> Fast Commute Links:
          </span>
          <button
            type="button"
            onClick={() => handlePresetSelect('Grand Central Terminal', 'Wall Street Plaza')}
            className="px-3 py-1 rounded-full bg-surface-low border border-outline-variant/30 text-xs font-semibold hover:bg-primary-container hover:text-white transition-all text-on-surface-variant"
          >
            Grand Central → Wall Street
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('Hoboken Terminal', 'Penn Station')}
            className="px-3 py-1 rounded-full bg-surface-low border border-outline-variant/30 text-xs font-semibold hover:bg-primary-container hover:text-white transition-all text-on-surface-variant"
          >
            Hoboken → Penn Station
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('Times Square Transit Hub', 'JFK Airport Terminal 4')}
            className="px-3 py-1 rounded-full bg-surface-low border border-outline-variant/30 text-xs font-semibold hover:bg-primary-container hover:text-white transition-all text-on-surface-variant"
          >
            Times Square → JFK Terminal 4
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import JourneyForm, { SearchOptions } from '../components/journey/JourneyForm';
import RouteCard from '../components/journey/RouteCard';
import DelayAlert from '../components/journey/DelayAlert';
import { RouteOption, DelayInfo, Reminder } from '../types';
import { journeyService } from '../services/journeyService';
import { delayService } from '../services/delayService';
import { Sparkles, Calendar, Plus, Clock, Check, AlarmClock, AlertCircle, Loader2 } from 'lucide-react';

interface JourneyPlannerProps {
  initialFrom?: string;
  initialTo?: string;
  onSelectRoute: (route: RouteOption) => void;
  selectedRoute?: RouteOption;
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'status'>) => void;
}

export default function JourneyPlanner({ 
  initialFrom = '', 
  initialTo = '', 
  onSelectRoute, 
  selectedRoute,
  onAddReminder
}: JourneyPlannerProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [delays, setDelays] = useState<DelayInfo[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [autoRerouteMessage, setAutoRerouteMessage] = useState<string | null>(null);
  
  // States for departure reminder form
  const [reminderRoute, setReminderRoute] = useState<RouteOption | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [reminderType, setReminderType] = useState<'smart' | 'fixed'>('smart');
  const [reminderSuccess, setReminderSuccess] = useState(false);

  // States to keep track of previous search options for retry
  const [lastOptions, setLastOptions] = useState<SearchOptions | null>(null);

  useEffect(() => {
    delayService.getLiveDelays().then(setDelays).catch(console.error);
  }, []);

  // Automatic Re-routing logic
  useEffect(() => {
    if (selectedRoute && delays.length > 0 && routes.length > 0) {
      // Check if selected route is impacted by any active delay
      const impactingDelay = delays.find(d => selectedRoute.name.includes(d.line) || (selectedRoute.segments.some(s => d.line.includes(s.name))));
      
      if (impactingDelay && impactingDelay.alternativeRouteId) {
        const altRoute = routes.find(r => r.id === impactingDelay.alternativeRouteId);
        // If we found the alternate route and it's not the one we currently have selected
        if (altRoute && altRoute.id !== selectedRoute.id) {
          onSelectRoute(altRoute);
          setAutoRerouteMessage(`Auto-rerouted to ${altRoute.name} due to delays on your previous route.`);
          setTimeout(() => setAutoRerouteMessage(null), 8000);
        }
      }
    }
  }, [selectedRoute, delays, routes]);

  const handleSearch = async (searchFrom: string, searchTo: string, options: SearchOptions) => {
    setLoading(true);
    setSearchError(null);
    setFrom(searchFrom);
    setTo(searchTo);
    setLastOptions(options);
    
    try {
      const baseRoutes = await journeyService.searchRoutes(searchFrom, searchTo);
      
      if (baseRoutes.length === 0) {
        setSearchError('No routes found between these stations. Please try adjusting your filters or destination.');
        setRoutes([]);
        return;
      }

      // Map and filter slightly based on options chosen
      const processed = baseRoutes.map(route => {
        let confidence = route.confidence;
        let reliability = route.reliability;
        
        if (options.ecoFriendly && route.ecoFriendly) {
          confidence += 1;
        }
        if (options.avoidCrowds && route.occupancy === 'low') {
          reliability += 1;
        }
        
        return {
          ...route,
          confidence: Math.min(confidence, 100),
          reliability: Math.min(reliability, 100)
        };
      });

      setRoutes(processed);
      // Auto-select the first smartest route
      const smartest = processed.find(r => r.smartest) || processed[0];
      if (smartest) {
        onSelectRoute(smartest);
      }
    } catch (err) {
      console.error('Failed to search routes', err);
      setSearchError('Network error while computing routes. Our backend services might be under heavy load.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissDelay = (id: string) => {
    setDelays((prev) => prev.filter(d => d.id !== id));
  };

  const handleResolveRoute = (altRouteId: string) => {
    // If user clicks resolve route, look for alternate route or populate suggestions
    const matched = routes.find(r => r.id === altRouteId);
    if (matched) {
      onSelectRoute(matched);
    } else if (routes.length > 0) {
      // select standard first route
      onSelectRoute(routes[0]);
    }
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderRoute) return;

    onAddReminder({
      routeName: reminderRoute.name,
      from: from || 'My Current Station',
      to: to || 'My Destination',
      departureTime: reminderRoute.startTime,
      mode: reminderRoute.segments.find(s => s.mode !== 'walk')?.mode || 'subway',
      minutesBefore: reminderMinutes,
      type: reminderType
    });

    setReminderSuccess(true);
    setTimeout(() => {
      setReminderSuccess(false);
      setReminderRoute(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface flex items-center gap-2">
            Journey Planner Core
          </h2>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Plot pristine itineraries across subway grids, lines, and express commuter rail.
          </p>
        </div>
      </div>

      {/* Main Journey Form Component */}
      <JourneyForm 
        onSearch={handleSearch} 
        initialFrom={initialFrom || from} 
        initialTo={initialTo || to} 
        loading={loading} 
      />

      {/* Error State */}
      {searchError && !loading && (
        <div className="bg-error/10 border border-error/20 rounded-2xl p-6 text-center max-w-lg mx-auto mt-4">
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-3" />
          <h4 className="font-bold text-error text-sm mb-2">Search Failed</h4>
          <p className="text-xs text-error font-medium mb-4 px-4 leading-relaxed">
            {searchError}
          </p>
          <button 
            onClick={() => handleSearch(from, to, lastOptions || { ecoFriendly: true, avoidCrowds: false, cheapest: false, fastest: true })}
            className="px-6 py-2 bg-error text-white text-xs font-bold rounded-xl hover:bg-error/90 active:scale-95 transition-all shadow-md"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* Auto Re-route Success Banner */}
      {autoRerouteMessage && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-500">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-primary text-sm block">AI Auto-Reroute Activated</span>
            <span className="text-xs text-on-surface-variant font-medium mt-0.5 block">{autoRerouteMessage}</span>
          </div>
        </div>
      )}

      {/* Delay Alert List */}
      {delays.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 text-xs font-bold uppercase text-error tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Live System Disruptions ({delays.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delays.map((delay) => (
              <DelayAlert
                key={delay.id}
                delay={delay}
                onDismiss={handleDismissDelay}
                onResolveRoute={handleResolveRoute}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Routes Section */}
      {routes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: List of recommendations */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                AI Generated Route Recommendations
              </h3>
              <span className="text-xs font-semibold text-primary">{routes.length} paths computed</span>
            </div>

            <div className="space-y-4">
              {routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isSelected={selectedRoute?.id === route.id}
                  onSelect={() => onSelectRoute(route)}
                  onSetReminder={() => setReminderRoute(route)}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Setup Departure Alarm Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 border border-slate-200 shadow-sm sticky top-24">
              <h4 className="font-bold text-on-surface text-base flex items-center gap-2 mb-3">
                <AlarmClock className="w-5 h-5 text-primary" />
                Configure Departure Reminder
              </h4>

              {reminderRoute ? (
                <form onSubmit={handleSaveReminder} className="space-y-4">
                  <div className="bg-surface-low/60 rounded-xl p-3 border border-outline-variant/20 text-xs">
                    <span className="text-[10px] text-outline font-semibold block uppercase">Target Journey Route</span>
                    <span className="font-bold text-on-surface mt-0.5 block">{reminderRoute.name}</span>
                    <span className="text-primary font-bold mt-1 block">Scheduled: {reminderRoute.startTime}</span>
                  </div>

                  {/* Alarm offset */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Alert Timing Offset
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 20].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setReminderMinutes(mins)}
                          className={`py-2 text-xs font-bold rounded-lg border ${
                            reminderMinutes === mins
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-outline-variant/50 hover:bg-surface-low text-on-surface-variant'
                          }`}
                        >
                          {mins}m before
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alarm Type */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Alarm Protocol Strategy
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setReminderType('smart')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          reminderType === 'smart'
                            ? 'border-primary bg-primary/5 text-primary font-bold'
                            : 'border-outline-variant/50 hover:bg-surface-low'
                        }`}
                      >
                        <span className="block text-xs">AI Smart Alarm</span>
                        <span className="text-[9px] text-outline mt-0.5 block">Adapts to walking pace & line delays</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReminderType('fixed')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          reminderType === 'fixed'
                            ? 'border-outline-variant/50 bg-transparent text-on-surface-variant'
                            : 'border-outline-variant/50 hover:bg-surface-low'
                        }`}
                      >
                        <span className="block text-xs">Standard Fixed Alert</span>
                        <span className="text-[9px] text-outline mt-0.5 block">Simple countdown alert only</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    {reminderSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Alarm Scheduled!
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Schedule Alert
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 text-on-surface-variant">
                  <Clock className="w-8 h-8 text-outline mx-auto mb-2 opacity-55" />
                  <p className="text-xs font-semibold leading-relaxed">
                    Select any Recommended Route on the left to configure a smart departure alarm.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* No Search results empty state */}
      {!loading && routes.length === 0 && (
        <div className="text-center py-12 glass-card border border-slate-200 max-w-lg mx-auto">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 animate-bounce" />
          <h4 className="font-bold text-on-surface text-sm">Where are we heading today?</h4>
          <p className="text-xs text-on-surface-variant mt-1 px-8 leading-relaxed">
            Fill out the Origin and Destination fields above to compute real-time intelligent city routes.
          </p>
        </div>
      )}

    </div>
  );
}

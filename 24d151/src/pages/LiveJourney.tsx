import React, { useState, useEffect } from 'react';
import MapPanel from '../components/MapPanel';
import { RouteOption, TransitMode } from '../types';
import { getModeIcon, getModeBg } from '../components/RouteCard';
import { 
  Radio, 
  MapPin, 
  Compass, 
  Sparkles, 
  Users, 
  Activity, 
  ChevronRight, 
  TrendingUp, 
  RotateCcw,
  Clock
} from 'lucide-react';

interface LiveJourneyProps {
  selectedRoute?: RouteOption;
  onSelectStation: (name: string) => void;
}

export default function LiveJourney({ selectedRoute, onSelectStation }: LiveJourneyProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [stopCounter, setStopCounter] = useState(1);
  const [etaMinutes, setEtaMinutes] = useState(selectedRoute ? selectedRoute.totalDuration : 15);

  // Simulate updating active stop counts
  useEffect(() => {
    if (!selectedRoute) return;
    
    // reset counters on route change
    setCurrentSegmentIndex(0);
    setStopCounter(1);
    setEtaMinutes(selectedRoute.totalDuration);

    const interval = setInterval(() => {
      setEtaMinutes((prev) => (prev <= 1 ? selectedRoute.totalDuration : prev - 1));
      
      // periodically advance stops
      setStopCounter((prev) => {
        const activeSegment = selectedRoute.segments[currentSegmentIndex];
        if (activeSegment && prev >= activeSegment.stops) {
          // move to next segment
          setCurrentSegmentIndex((seg) => (seg + 1 >= selectedRoute.segments.length ? 0 : seg + 1));
          return 1;
        }
        return prev + 1;
      });
    }, 15000); // simulation interval

    return () => clearInterval(interval);
  }, [selectedRoute]);

  const activeSegment = selectedRoute?.segments[currentSegmentIndex];

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-2xl font-extrabold text-on-surface flex items-center gap-2">
          <Activity className="text-secondary animate-pulse w-7 h-7" />
          Live GPS Journey Telemetry
        </h2>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">
          View active vehicle positions, occupancy carriages, and micro arrival metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Vector Map Panel */}
        <div className="lg:col-span-8 h-[480px] lg:h-[550px]">
          <MapPanel 
            selectedRoute={selectedRoute} 
            origin={selectedRoute?.segments[0]?.name}
            destination={selectedRoute?.segments[selectedRoute.segments.length - 1]?.name}
            onSelectStation={onSelectStation}
          />
        </div>

        {/* Right Column: Tracking Panel Checklist */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-slate-200 shadow-sm space-y-5">
            {selectedRoute ? (
              <>
                {/* Active Tracking Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                    </span>
                    <h3 className="font-bold text-on-surface text-sm">Tracking Route</h3>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {etaMinutes} mins to destination
                  </span>
                </div>

                {/* Live Segment Status Card */}
                <div className="p-4 rounded-2xl bg-surface-low/80 border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-xl ${activeSegment ? getModeBg(activeSegment.mode) : ''}`}>
                      {activeSegment ? getModeIcon(activeSegment.mode, "w-5 h-5") : null}
                    </span>
                    <div>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Current Segment</span>
                      <h4 className="font-bold text-sm text-on-surface">
                        {activeSegment?.lineCode ? `${activeSegment.lineCode} - ` : ''}
                        {activeSegment?.name}
                      </h4>
                    </div>
                  </div>

                  {activeSegment && activeSegment.stops > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-outline-variant/10 text-xs">
                      <div className="flex justify-between font-semibold text-on-surface-variant">
                        <span>Stop progress</span>
                        <span className="text-primary font-bold">Stop {stopCounter} of {activeSegment.stops}</span>
                      </div>
                      <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${(stopCounter / activeSegment.stops) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Carriage Occupancy Meter */}
                <div className="p-4 rounded-2xl border border-outline-variant/30 space-y-3 bg-white/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      Coach Occupancy Meter
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      selectedRoute.occupancy === 'low' 
                        ? 'bg-secondary/10 text-secondary' 
                        : 'bg-tertiary/10 text-tertiary'
                    }`}>
                      {selectedRoute.occupancy} crowds
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((coach) => (
                      <div key={coach} className="flex flex-col gap-1 items-center">
                        <div className={`h-6 w-full rounded-md border transition-all ${
                          selectedRoute.occupancy === 'low' && coach <= 2
                            ? 'bg-secondary/20 border-secondary'
                            : selectedRoute.occupancy === 'medium' && coach <= 4
                            ? 'bg-tertiary/20 border-tertiary'
                            : 'bg-outline-variant/10 border-outline-variant/30'
                        }`} />
                        <span className="text-[8px] text-outline">C{coach}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-outline-variant text-center font-medium">
                    Coaches 1 & 2 have lowest crowd volume. Board at rear.
                  </p>
                </div>

                {/* Timeline Checklist */}
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Commute Timeline Checkpoints
                  </span>
                  <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
                    {selectedRoute.segments.map((segment, idx) => {
                      const isCompleted = idx < currentSegmentIndex;
                      const isActiveSeg = idx === currentSegmentIndex;
                      
                      return (
                        <div key={idx} className="flex items-start gap-3 relative">
                          {/* Circle indicator */}
                          <div className={`absolute -left-4 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-secondary border-secondary' 
                              : isActiveSeg 
                              ? 'bg-primary border-primary ring-4 ring-primary/10' 
                              : 'bg-white border-outline-variant'
                          }`} />
                          
                          <div className="min-w-0 flex-1">
                            <span className={`text-xs font-bold block ${
                              isCompleted ? 'text-outline line-through' : 'text-on-surface'
                            }`}>
                              {segment.name}
                            </span>
                            <span className="text-[10px] text-outline font-semibold">
                              {segment.duration} mins • {segment.stops} stops ({segment.distance} km)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-on-surface-variant space-y-4">
                <Compass className="w-12 h-12 text-outline mx-auto opacity-40 animate-spin-slow" />
                <div>
                  <h4 className="font-bold text-on-surface text-sm">No Active GPS Tracking</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Plan a journey inside our planner page and choose any recommended itinerary to start live telemetry feeds.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

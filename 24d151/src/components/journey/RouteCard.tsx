import React from 'react';
import { RouteOption, TransitMode } from '../../types';
import { 
  Footprints, 
  Bus, 
  Train, 
  Leaf, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  FlameKindling
} from 'lucide-react';

interface RouteCardProps {
  key?: string;
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
  onSetReminder: () => void;
}

export function getModeIcon(mode: TransitMode, className: string = "w-4 h-4") {
  switch (mode) {
    case 'walk':
      return <Footprints className={className} />;
    case 'bus':
      return <Bus className={className} />;
    case 'train':
      return <Train className={className} />;
    case 'tram':
      return <Train className={`${className} rotate-12`} />; // custom representation
    case 'subway':
      return <Train className={className} />;
    default:
      return <Footprints className={className} />;
  }
}

export function getModeBg(mode: TransitMode) {
  switch (mode) {
    case 'walk':
      return 'bg-outline-variant/20 text-outline';
    case 'bus':
      return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    case 'train':
      return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
    case 'tram':
      return 'bg-sky-500/10 text-sky-600 border border-sky-500/20';
    case 'subway':
      return 'bg-blue-600/10 text-blue-600 border border-blue-600/20';
  }
}

export default function RouteCard({ route, isSelected, onSelect, onSetReminder }: RouteCardProps) {
  const getOccupancyColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'medium': return 'text-tertiary bg-tertiary/10 border-tertiary/20';
      case 'high': return 'text-error bg-error/10 border-error/20';
    }
  };

  return (
    <div 
      className={`glass-card p-5 transition-all duration-300 relative border cursor-pointer hover:shadow-xl hover:scale-[1.01] ${
        isSelected 
          ? 'border-primary ring-2 ring-primary/20 bg-primary-container/[0.03]' 
          : 'border-slate-200'
      }`}
      onClick={onSelect}
    >
      {/* Smart/Fastest Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {route.smartest && (
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
            <FlameKindling className="w-3 h-3 animate-pulse" />
            AI Smartest Choice
          </span>
        )}
        {route.fastest && (
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Fastest
          </span>
        )}
        {route.cheapest && (
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/10 text-on-secondary-container border border-secondary-container/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Cheapest
          </span>
        )}
        {route.ecoFriendly && (
          <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Leaf className="w-3 h-3" />
            Eco-Friendly (-{route.co2Saved}kg CO2)
          </span>
        )}
      </div>

      {/* Main Header / Times */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="font-bold text-on-surface text-base md:text-lg flex items-center gap-2">
            {route.startTime} - {route.endTime}
            <span className="text-xs font-semibold text-on-surface-variant bg-surface-low px-2 py-0.5 rounded-md">
              {route.totalDuration} mins
            </span>
          </h3>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Reliability index: <span className="text-primary font-bold">{route.reliability}%</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-on-surface">${route.cost.toFixed(2)}</span>
          <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">Single fare</p>
        </div>
      </div>

      {/* Timeline Segments Visualization */}
      <div className="bg-surface-low/50 rounded-xl p-3 border border-outline-variant/30 mb-4">
        <div className="flex items-center flex-wrap gap-2 text-sm font-semibold text-on-surface">
          {route.segments.map((segment, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center gap-1.5">
                <span className={`p-1.5 rounded-lg flex items-center justify-center ${getModeBg(segment.mode)}`}>
                  {getModeIcon(segment.mode, "w-4 h-4")}
                </span>
                <span className="text-xs font-medium">
                  {segment.lineCode ? (
                    <span className="font-bold uppercase mr-1" style={{ color: segment.color || 'inherit' }}>
                      {segment.lineCode}
                    </span>
                  ) : null}
                  {segment.name}
                  <span className="text-[10px] text-outline font-normal ml-1">({segment.duration}m)</span>
                </span>
              </div>
              {index < route.segments.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer Info / AI Reliability Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-outline-variant/20 items-center">
        {/* Occupancy Indicator */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Crowd Load</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-max border uppercase ${getOccupancyColor(route.occupancy)}`}>
            {route.occupancy} Crowds
          </span>
        </div>

        {/* AI Confidence Indicator */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">AI Confidence</span>
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            {route.confidence}%
          </span>
        </div>

        {/* Eco carbon offset */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">CO₂ Footprint</span>
          <span className="text-xs font-bold text-secondary flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5" />
            Saves {route.co2Saved} kg
          </span>
        </div>

        {/* Action controls */}
        <div className="flex justify-end gap-2">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetReminder();
            }}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-low active:scale-95 transition-all"
            title="Set Departure Reminder"
          >
            Remind
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              isSelected 
                ? 'bg-secondary text-white' 
                : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {isSelected ? 'Selected' : 'Choose'}
          </button>
        </div>
      </div>

      {/* Delay alert inside RouteCard */}
      {route.delayMinutes > 0 && (
        <div className="mt-3 bg-error/5 border border-error/20 rounded-xl p-2.5 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-error">Commute Alert:</span> Expect a {route.delayMinutes}-minute delays on this path. AI recommends adjusting departure times or switching segments.
          </div>
        </div>
      )}
    </div>
  );
}

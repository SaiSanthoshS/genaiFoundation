import React, { useState, useEffect } from 'react';
import { RouteOption } from '../types';
import { Map, Navigation, Train, Info, Radio, Layers } from 'lucide-react';

interface MapPanelProps {
  selectedRoute?: RouteOption;
  origin?: string;
  destination?: string;
  onSelectStation?: (stationName: string) => void;
}

interface MapStation {
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  lines: string[];
}

const STATIONS: MapStation[] = [
  { name: 'Grand Central Terminal', x: 45, y: 30, lines: ['N4', 'GL'] },
  { name: 'Times Square Transit Hub', x: 25, y: 35, lines: ['N4', 'B42'] },
  { name: 'Penn Station', x: 25, y: 50, lines: ['M1'] },
  { name: 'Wall Street Plaza', x: 50, y: 75, lines: ['N4', 'GL', 'B42'] },
  { name: 'Brooklyn Heights', x: 70, y: 80, lines: ['N4'] },
  { name: 'JFK Airport Terminal 4', x: 85, y: 60, lines: ['AIR', 'E'] },
  { name: 'Central Park West', x: 35, y: 15, lines: ['B42'] },
  { name: 'Hoboken Terminal', x: 10, y: 55, lines: ['M1'] },
];

export default function MapPanel({ selectedRoute, origin, destination, onSelectStation }: MapPanelProps) {
  const [vehicleProgress, setVehicleProgress] = useState(0);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'standard' | 'occupancy' | 'satellite'>('standard');

  // Simulate vehicle movement
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicleProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Determine active path coordinates
  const getRoutePathCoordinates = () => {
    if (!selectedRoute) return null;
    
    // Simple heuristic map routing based on segments
    const points: {x: number, y: number}[] = [];
    
    if (selectedRoute.id === 'route-1') {
      // Grand Central -> Wall Street (via Subway N4 & GL)
      points.push({ x: 45, y: 30 }); // Grand Central
      points.push({ x: 35, y: 15 }); // Central Park
      points.push({ x: 25, y: 35 }); // Times Square
      points.push({ x: 50, y: 75 }); // Wall Street
    } else if (selectedRoute.id === 'route-2') {
      // Penn Station -> Destination (via Commuter Rail)
      points.push({ x: 25, y: 50 }); // Penn
      points.push({ x: 10, y: 55 }); // Hoboken
      points.push({ x: 50, y: 75 }); // Wall Street
    } else if (selectedRoute.id === 'route-3') {
      // Bus 42 Walk path
      points.push({ x: 35, y: 15 }); // Central Park
      points.push({ x: 25, y: 35 }); // Times Square
      points.push({ x: 50, y: 75 }); // Wall Street
    } else if (selectedRoute.id === 'route-jfk') {
      points.push({ x: 50, y: 75 }); // Wall Street
      points.push({ x: 70, y: 80 }); // Brooklyn Heights
      points.push({ x: 85, y: 60 }); // JFK
    } else {
      // Default path
      points.push({ x: 45, y: 30 });
      points.push({ x: 50, y: 75 });
    }
    return points;
  };

  const activePoints = getRoutePathCoordinates();
  
  // Calculate vehicle current spot based on active points list
  const getVehiclePosition = () => {
    if (!activePoints || activePoints.length < 2) {
      // Crawling along Subway Line N4 by default (Grand Central to Wall Street)
      const p1 = { x: 45, y: 30 };
      const p2 = { x: 50, y: 75 };
      const ratio = vehicleProgress / 100;
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio
      };
    }
    
    // Find segment based on percentage
    const segmentCount = activePoints.length - 1;
    const totalRatio = vehicleProgress / 100;
    const segmentIndex = Math.min(Math.floor(totalRatio * segmentCount), segmentCount - 1);
    const segmentRatio = (totalRatio * segmentCount) - segmentIndex;
    
    const p1 = activePoints[segmentIndex];
    const p2 = activePoints[segmentIndex + 1];
    
    return {
      x: p1.x + (p2.x - p1.x) * segmentRatio,
      y: p1.y + (p2.y - p1.y) * segmentRatio
    };
  };

  const vehiclePos = getVehiclePosition();

  return (
    <div className="glass-card p-4 md:p-6 shadow-lg flex flex-col h-full relative overflow-hidden min-h-[420px]">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-on-surface text-base flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            Live Commute Infrastructure Layer
          </h3>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {selectedRoute ? `Tracking: ${selectedRoute.name}` : 'Real-time GPS telemetry feed'}
          </p>
        </div>

        {/* Map Layers Selector */}
        <div className="flex bg-surface-low border border-outline-variant/30 rounded-xl p-1 gap-1 self-start">
          {[
            { id: 'standard', label: 'Telemetry' },
            { id: 'occupancy', label: 'Crowds' },
            { id: 'satellite', label: 'Grid schematic' }
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as any)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeLayer === layer.id
                  ? 'bg-primary text-white'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Stage Canvas Wrapper */}
      <div className="flex-1 rounded-2xl relative overflow-hidden bg-slate-900 border border-slate-950 p-4 min-h-[300px]">
        {/* Schematic Grid Lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #2563eb 1.5px, transparent 1.5px)', 
               backgroundSize: '24px 24px' 
             }} 
        />
        
        {/* Animated Radar scan circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-primary/20 rounded-full pointer-events-none animate-ping-slow opacity-10" />

        {/* Interactive SVG Canvas */}
        <svg className="w-full h-full min-h-[280px]" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Schematic Subway/Train lines background */}
          {/* Subway Line N4 (Blue) */}
          <line x1="25" y1="35" x2="45" y2="30" stroke="#004ac6" strokeWidth="1.2" strokeDasharray="1,1" strokeLinecap="round" opacity="0.4" />
          <line x1="45" y1="30" x2="50" y2="75" stroke="#004ac6" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          <line x1="50" y1="75" x2="70" y2="80" stroke="#004ac6" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          
          {/* Commuter Rail Line M1 (Brown) */}
          <line x1="10" y1="55" x2="25" y2="50" stroke="#784b00" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          <line x1="25" y1="50" x2="50" y2="75" stroke="#784b00" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

          {/* JFK Subway Airport Link (Purple) */}
          <line x1="50" y1="75" x2="85" y2="60" stroke="#a21caf" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

          {/* Glowing ACTIVE route path highlighted */}
          {activePoints && activePoints.length >= 2 && (
            <path
              d={`M ${activePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
              style={{ filter: 'drop-shadow(0px 0px 4px #2563eb)' }}
            />
          )}

          {/* Highlight origin & destination terminals in distinct shapes */}
          {STATIONS.map((station) => {
            const isOrigin = origin === station.name;
            const isDest = destination === station.name;
            const isSelected = isOrigin || isDest;
            
            return (
              <g 
                key={station.name} 
                className="cursor-pointer"
                onClick={() => onSelectStation && onSelectStation(station.name)}
                onMouseEnter={() => setHoveredStation(station.name)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Station click target hit-box */}
                <circle cx={station.x} cy={station.y} r="6" fill="transparent" />

                {/* Station visual ring */}
                <circle 
                  cx={station.x} 
                  cy={station.y} 
                  r={isSelected ? "3.5" : "2"} 
                  fill={isOrigin ? '#2563eb' : isDest ? '#4edea3' : '#cbd5e1'} 
                  stroke={isSelected ? '#ffffff' : '#475569'}
                  strokeWidth={isSelected ? '1' : '0.5'}
                  className="transition-all duration-300"
                />

                {/* Outer sonar pulse for highlighted selections */}
                {isSelected && (
                  <circle 
                    cx={station.x} 
                    cy={station.y} 
                    r="6" 
                    fill="none" 
                    stroke={isOrigin ? '#2563eb' : '#4edea3'} 
                    strokeWidth="0.5" 
                    className="animate-ping"
                    style={{ transformOrigin: `${station.x}% ${station.y}%` }}
                  />
                )}
                
                {/* Station text label overlay if hovered or active */}
                {(hoveredStation === station.name || isSelected) && (
                  <g className="transition-all duration-200">
                    <rect 
                      x={station.x - 16} 
                      y={station.y - 11} 
                      width="32" 
                      height="6" 
                      rx="1" 
                      fill="rgba(11, 28, 48, 0.9)" 
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="0.3"
                    />
                    <text 
                      x={station.x} 
                      y={station.y - 7} 
                      fill="#ffffff" 
                      fontSize="2.2" 
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {station.name.split(' ')[0]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* LIVE Animating Moving Vehicle dot marker */}
          {vehiclePos && (
            <g>
              <circle 
                cx={vehiclePos.x} 
                cy={vehiclePos.y} 
                r="3" 
                fill="#ff9900" 
                style={{ filter: 'drop-shadow(0px 0px 3px #ff9900)' }} 
              />
              <circle 
                cx={vehiclePos.x} 
                cy={vehiclePos.y} 
                r="5" 
                fill="none" 
                stroke="#ff9900" 
                strokeWidth="0.4" 
                className="animate-ping"
                style={{ transformOrigin: `${vehiclePos.x}% ${vehiclePos.y}%` }}
              />
            </g>
          )}
        </svg>

        {/* Legend Overlay / Floating Panel */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-3 items-center justify-between bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary"></span> Subway N4
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-tertiary"></span> Rail M1
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span> Bus Link
            </span>
            <span className="flex items-center gap-1 animate-pulse">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff9900]"></span> GPS Telemetry Active
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-secondary animate-pulse" />
            Frequency: 2.4 GHz feed
          </div>
        </div>
      </div>
    </div>
  );
}

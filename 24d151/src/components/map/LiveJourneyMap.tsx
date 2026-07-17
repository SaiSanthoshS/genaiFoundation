import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteOption } from '../../types';

// Custom icons using Lucide-style SVG wrappers (for simplicity, we create divIcons)
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);">${iconHtml}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const originIcon = createCustomIcon('#3b82f6', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>');
const destinationIcon = createCustomIcon('#10b981', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>');
const vehicleIcon = createCustomIcon('#8b5cf6', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 8h6"/><path d="M8 16h.01"/><path d="M16 16h.01"/></svg>');
const disruptionIcon = createCustomIcon('#ef4444', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>');

// Dummy path coordinates representing a journey in NY
const PATH_COORDS: [number, number][] = [
  [40.7527, -73.9772], // Grand Central
  [40.7484, -73.9857], // Penn Station general area
  [40.7306, -73.9866], // East Village area
  [40.7074, -74.0113]  // Wall street area
];

interface LiveJourneyMapProps {
  route: RouteOption | null;
  progressPercent: number;
  hasDisruption?: boolean;
}

// Helper component to auto-pan the map when coordinates change
function AutoPanMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(coords, { animate: true, duration: 1.5 });
  }, [coords, map]);
  return null;
}

const LiveJourneyMap = function LiveJourneyMap({ route, progressPercent, hasDisruption = false }: LiveJourneyMapProps) {
  const [currentPos, setCurrentPos] = useState<[number, number]>(PATH_COORDS[0]);

  useEffect(() => {
    // Simulate vehicle movement along the PATH_COORDS based on progressPercent (0 to 100)
    const totalSegments = PATH_COORDS.length - 1;
    if (progressPercent <= 0) {
      setCurrentPos(PATH_COORDS[0]);
      return;
    }
    if (progressPercent >= 100) {
      setCurrentPos(PATH_COORDS[PATH_COORDS.length - 1]);
      return;
    }

    const overallFraction = progressPercent / 100;
    const segmentIndex = Math.floor(overallFraction * totalSegments);
    const segmentFraction = (overallFraction * totalSegments) - segmentIndex;

    const startNode = PATH_COORDS[segmentIndex];
    const endNode = PATH_COORDS[segmentIndex + 1];

    if (startNode && endNode) {
      const lat = startNode[0] + (endNode[0] - startNode[0]) * segmentFraction;
      const lng = startNode[1] + (endNode[1] - startNode[1]) * segmentFraction;
      setCurrentPos([lat, lng]);
    }
  }, [progressPercent]);

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] rounded-2xl overflow-hidden shadow-inner border border-outline-variant/30 relative z-0">
      <MapContainer 
        center={PATH_COORDS[0]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Draw the main route line */}
        <Polyline 
          positions={PATH_COORDS} 
          pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }} 
        />

        {/* Draw alternative disruption line if needed */}
        {hasDisruption && (
          <Polyline 
            positions={[
              PATH_COORDS[1],
              [40.7200, -74.0000], // detour
              PATH_COORDS[3]
            ]} 
            pathOptions={{ color: '#10b981', weight: 4, opacity: 0.8, dashArray: '8, 8' }} 
          />
        )}

        <Marker position={PATH_COORDS[0]} icon={originIcon}>
          <Popup>Origin: Grand Central</Popup>
        </Marker>

        <Marker position={PATH_COORDS[PATH_COORDS.length - 1]} icon={destinationIcon}>
          <Popup>Destination: Wall Street</Popup>
        </Marker>

        {hasDisruption && (
          <Marker position={PATH_COORDS[2]} icon={disruptionIcon}>
            <Popup>
              <strong>Major Disruption</strong><br/>
              Switch malfunction detected. Rerouting active.
            </Popup>
          </Marker>
        )}

        {/* The Live Moving Vehicle */}
        <Marker position={currentPos} icon={vehicleIcon} zIndexOffset={1000}>
          <Popup>
            <strong>Live Transit Vehicle</strong><br/>
            {progressPercent}% Complete
          </Popup>
        </Marker>

        <AutoPanMap coords={currentPos} />
      </MapContainer>
    </div>
  );
}

export default React.memo(LiveJourneyMap);
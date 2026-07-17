const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Rewrite LiveJourneyMap.tsx
const mapPath = path.join(srcDir, 'components', 'map', 'LiveJourneyMap.tsx');
const mapContent = `import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, MarkerF, TrafficLayerF } from '@react-google-maps/api';
import { RouteOption } from '../../types';

const LIBRARIES: any = ['places'];
const mapContainerStyle = { width: '100%', height: '100%' };

interface LiveJourneyMapProps {
  route: RouteOption | null;
  progressPercent: number;
  hasDisruption?: boolean;
}

const LiveJourneyMap = function LiveJourneyMap({ route, progressPercent, hasDisruption = false }: LiveJourneyMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [vehiclePos, setVehiclePos] = useState<google.maps.LatLngLiteral | null>(null);
  const [pathCoords, setPathCoords] = useState<google.maps.LatLng[]>([]);

  // Default to NY coordinates for demo if no route
  const originStr = route?.segments[0]?.from || 'Grand Central Terminal, NY';
  const destStr = route?.segments[route.segments.length - 1]?.to || 'Wall Street, NY';

  useEffect(() => {
    if (!isLoaded) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: originStr,
        destination: destStr,
        travelMode: window.google.maps.TravelMode.TRANSIT,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const path = result.routes[0].overview_path;
          setPathCoords(path);
          if (path.length > 0) {
            setVehiclePos({ lat: path[0].lat(), lng: path[0].lng() });
          }
        } else {
          console.error("Directions query failed due to " + status);
        }
      }
    );
  }, [isLoaded, originStr, destStr]);

  useEffect(() => {
    if (!pathCoords || pathCoords.length === 0) return;
    const totalSegments = pathCoords.length - 1;
    if (progressPercent <= 0) {
      setVehiclePos({ lat: pathCoords[0].lat(), lng: pathCoords[0].lng() });
      return;
    }
    if (progressPercent >= 100) {
      const last = pathCoords[pathCoords.length - 1];
      setVehiclePos({ lat: last.lat(), lng: last.lng() });
      return;
    }

    const overallFraction = progressPercent / 100;
    const segmentIndex = Math.floor(overallFraction * totalSegments);
    const segmentFraction = (overallFraction * totalSegments) - segmentIndex;

    const startNode = pathCoords[segmentIndex];
    const endNode = pathCoords[segmentIndex + 1];

    if (startNode && endNode) {
      const lat = startNode.lat() + (endNode.lat() - startNode.lat()) * segmentFraction;
      const lng = startNode.lng() + (endNode.lng() - startNode.lng()) * segmentFraction;
      setVehiclePos({ lat, lng });
    }
  }, [progressPercent, pathCoords]);

  if (!isLoaded) return <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-surface-low rounded-2xl border border-outline-variant/30 text-on-surface-variant font-medium">Loading Google Maps...</div>;

  const center = vehiclePos || { lat: 40.7527, lng: -73.9772 };

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] rounded-2xl overflow-hidden shadow-inner border border-outline-variant/30 relative z-0">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={14} options={{ disableDefaultUI: true }}>
        <TrafficLayerF />
        {directions && (
          <DirectionsRenderer 
            directions={directions} 
            options={{ 
              suppressMarkers: false,
              polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 5, strokeOpacity: 0.8 }
            }} 
          />
        )}
        
        {/* Animated Vehicle Marker */}
        {vehiclePos && (
          <MarkerF 
            position={vehiclePos}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#8b5cf6" stroke="white" stroke-width="2"/><rect width="12" height="12" x="10" y="10" rx="2" fill="none" stroke="white" stroke-width="2"/><path d="M13 14h6M12 18h.01M19 18h.01" stroke="white" stroke-width="2"/></svg>'),
              anchor: new window.google.maps.Point(16, 16)
            }}
            zIndex={1000}
          />
        )}

        {/* Disruption Marker */}
        {hasDisruption && pathCoords.length > 2 && (
          <MarkerF 
            position={{ lat: pathCoords[Math.floor(pathCoords.length / 2)].lat(), lng: pathCoords[Math.floor(pathCoords.length / 2)].lng() }}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#ef4444" stroke="white" stroke-width="2"/><path d="M21 16l-8-12-8 12a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 21 16Z" fill="none" stroke="white" stroke-width="2"/><path d="M12 11v4M12 18h.01" stroke="white" stroke-width="2"/></svg>'),
              anchor: new window.google.maps.Point(16, 16)
            }}
            zIndex={999}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default React.memo(LiveJourneyMap);
`;
fs.writeFileSync(mapPath, mapContent, 'utf8');


// 2. Rewrite JourneyForm.tsx to use Autocomplete
const formPath = path.join(srcDir, 'components', 'journey', 'JourneyForm.tsx');
let formContent = fs.readFileSync(formPath, 'utf8');

// Inject Autocomplete logic
const topImports = `import React, { useState, useRef } from 'react';
import { ArrowLeftRight, MapPin, Calendar, Clock, Star, Zap, Search } from 'lucide-react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: any = ['places'];`;

const regexImports = /import React, { useState } from 'react';[\s\S]*?import { ArrowLeftRight, MapPin, Calendar, Clock, Star, Zap, Search } from 'lucide-react';/;
formContent = formContent.replace(regexImports, topImports);

// Find the component body
const componentStartRegex = /export default function JourneyForm\(\{.*\}\) \{/;
const loadScriptHook = `
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });
  
  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleOriginPlaceChanged = () => {
    if (originRef.current !== null) {
      const place = originRef.current.getPlace();
      setFrom(place.formatted_address || place.name || '');
    }
  };

  const handleDestPlaceChanged = () => {
    if (destRef.current !== null) {
      const place = destRef.current.getPlace();
      setTo(place.formatted_address || place.name || '');
    }
  };
`;

formContent = formContent.replace(componentStartRegex, (match) => match + loadScriptHook);

// Replace Origin Input
const originInputRegex = /<input[\s\S]*?placeholder="Enter starting station..."[\s\S]*?\/>\s*\{\/\* Autocomplete Dropdown \*\/\}[\s\S]*?\{\w+DropdownOpen && [\s\S]*?<\/div>\s*\}/;
const originGoogleInput = `{isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) => { originRef.current = autocomplete; }}
                  onPlaceChanged={handleOriginPlaceChanged}
                >
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="Enter starting station..."
                    className="w-full pl-12 pr-4 h-14 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Loading Places API..."
                  className="w-full pl-12 pr-4 h-14 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled
                />
              )}`;
formContent = formContent.replace(originInputRegex, originGoogleInput);

// Replace Dest Input
const destInputRegex = /<input[\s\S]*?placeholder="Enter final destination..."[\s\S]*?\/>\s*\{\/\* Autocomplete Dropdown \*\/\}[\s\S]*?\{\w+DropdownOpen && [\s\S]*?<\/div>\s*\}/;
const destGoogleInput = `{isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) => { destRef.current = autocomplete; }}
                  onPlaceChanged={handleDestPlaceChanged}
                >
                  <input
                    type="text"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Enter final destination..."
                    className="w-full pl-12 pr-4 h-14 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Loading Places API..."
                  className="w-full pl-12 pr-4 h-14 rounded-xl border border-outline-variant/60 bg-white/50 text-sm font-medium text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled
                />
              )}`;
formContent = formContent.replace(destInputRegex, destGoogleInput);

fs.writeFileSync(formPath, formContent, 'utf8');

// 3. Update env example
const envPath = path.join(__dirname, '.env.example');
let envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('VITE_GOOGLE_MAPS_API_KEY')) {
  envContent += '\n# Google Maps Configuration\nVITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE\n';
  fs.writeFileSync(envPath, envContent, 'utf8');
}

console.log('Google Maps migration complete.');

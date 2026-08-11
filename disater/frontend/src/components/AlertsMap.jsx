import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";

// Same palette as the severity table badges, kept in one place for consistency.
const SEVERITY_COLORS = {
  Low: "#22C55E",
  Moderate: "#EAB308",
  High: "#F97316",
  Critical: "#DC2626",
};

// Re-fits the map viewport whenever the set of points changes (new location
// saved, or alerts refreshed), so the marked disaster-prone areas are always
// framed nicely without the user needing to manually pan/zoom.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 9);
      return;
    }
    map.fitBounds(
      points.map((p) => [p.lat, p.lon]),
      { padding: [40, 40] }
    );
  }, [points, map]);
  return null;
}

export default function AlertsMap({ location, alerts }) {
  if (!location) return null;

  const validAlerts = alerts.filter((a) => a.latitude != null && a.longitude != null);
  const points = [
    { lat: location.latitude, lon: location.longitude },
    ...validAlerts.map((a) => ({ lat: a.latitude, lon: a.longitude })),
  ];

  return (
    <div className="overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200">
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: "24rem", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {/* Alert radius boundary around the saved location */}
        <Circle
          center={[location.latitude, location.longitude]}
          radius={location.radius_km * 1000}
          pathOptions={{ color: "#1E3A5F", fillColor: "#1E3A5F", fillOpacity: 0.05, weight: 1, dashArray: "4 4" }}
        />

        {/* The user's saved location */}
        <CircleMarker
          center={[location.latitude, location.longitude]}
          radius={7}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#1E3A5F", fillOpacity: 1 }}
        >
          <Popup>
            <strong>Your location</strong>
            <br />
            {location.place_name}
          </Popup>
        </CircleMarker>

        {/* Every disaster-prone area within the radius, colored by severity */}
        {validAlerts.map((alert, i) => {
          const color = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.Low;
          return (
            <CircleMarker
              key={i}
              center={[alert.latitude, alert.longitude]}
              radius={9}
              pathOptions={{ color: "#ffffff", weight: 1, fillColor: color, fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{alert.type}</strong>
                <br />
                {alert.location}
                <br />
                Severity: {alert.severity}
                <br />
                {alert.distance_km} km away · {alert.datetime}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
        <span className="font-medium text-slate-500">Severity:</span>
        <LegendItem color={SEVERITY_COLORS.Low} label="Low" />
        <LegendItem color={SEVERITY_COLORS.Moderate} label="Moderate" />
        <LegendItem color={SEVERITY_COLORS.High} label="High" />
        <LegendItem color={SEVERITY_COLORS.Critical} label="Critical" />
        <span className="ml-auto flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-brand" />
          Your location
        </span>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

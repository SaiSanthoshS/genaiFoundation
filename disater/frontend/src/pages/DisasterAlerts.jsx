import { useCallback, useEffect, useState } from "react";
import { getAlerts } from "../api";
import AlertsMap from "../components/AlertsMap";

const REFRESH_INTERVAL_MS = 3 * 60 * 1000; // refresh every 3 minutes

const SEVERITY_STYLES = {
  Low: { dot: "🟢", classes: "bg-severity-low/10 text-green-700" },
  Moderate: { dot: "🟡", classes: "bg-severity-moderate/10 text-yellow-700" },
  High: { dot: "🟠", classes: "bg-severity-high/10 text-orange-700" },
  Critical: { dot: "🔴", classes: "bg-severity-critical/10 text-red-700" },
};

export default function DisasterAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await getAlerts();
      setAlerts(data.alerts || []);
      setLocation(data.location || null);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Disaster Alerts</h1>
          {location && (
            <p className="text-sm text-slate-500">
              Near <span className="font-medium">{location.place_name}</span> ({location.radius_km} km radius)
              {lastUpdated && ` · updated ${lastUpdated.toLocaleTimeString()}`}
            </p>
          )}
        </div>
        <button
          onClick={loadAlerts}
          className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-slate-100"
        >
          Refresh Now
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading alerts...</p>
      ) : (
        <>
          {location && <AlertsMap location={location} alerts={alerts} />}

          {alerts.length === 0 && !error ? (
            <p className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              No active disaster alerts within your radius right now.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alerts.map((alert, i) => {
                    const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{alert.type}</td>
                        <td className="px-4 py-3 text-slate-600">{alert.location}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.classes}`}>
                            {style.dot} {alert.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{alert.distance_km} km</td>
                        <td className="px-4 py-3 text-slate-600">{alert.datetime}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { getLocation, saveLocation } from "../api";

export default function LocationSetup() {
  const [placeName, setPlaceName] = useState("");
  const [radiusKm, setRadiusKm] = useState(50);
  const [savedLocation, setSavedLocation] = useState(null);
  const [status, setStatus] = useState({ type: null, message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLocation()
      .then((location) => setSavedLocation(location))
      .catch(() => {
        /* no location saved yet — that's fine on first run */
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!placeName.trim()) {
      setStatus({ type: "error", message: "Please enter a city or address." });
      return;
    }

    setSaving(true);
    setStatus({ type: null, message: "" });
    try {
      const result = await saveLocation(placeName.trim(), Number(radiusKm));
      setSavedLocation(result);
      setStatus({ type: "success", message: `Location saved: ${result.place_name}` });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-800">Location Setup</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose the place and radius alerts should be checked against.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              City or Address
            </label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Alert Radius: <span className="font-semibold">{radiusKm} km</span>
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="mt-2 w-full accent-brand"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>10 km</span>
              <span>200 km</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Location"}
          </button>
        </form>

        {status.message && (
          <p
            className={`mt-4 text-sm ${
              status.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>

      {savedLocation && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Currently Saved</h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <dt>Place</dt>
              <dd className="font-medium text-slate-800">{savedLocation.place_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Radius</dt>
              <dd className="font-medium text-slate-800">{savedLocation.radius_km} km</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

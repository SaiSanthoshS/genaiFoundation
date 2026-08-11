import { useEffect, useState } from "react";
import { getApiKeyStatus, saveApiKey } from "../api";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [isSet, setIsSet] = useState(false);
  const [status, setStatus] = useState({ type: null, message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApiKeyStatus()
      .then((res) => setIsSet(res.is_set))
      .catch(() => {});
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!apiKey.trim()) {
      setStatus({ type: "error", message: "Please paste your Gemini API key." });
      return;
    }

    setSaving(true);
    setStatus({ type: null, message: "" });
    try {
      await saveApiKey(apiKey.trim());
      setIsSet(true);
      setApiKey("");
      setStatus({ type: "success", message: "API key saved." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Paste your Google Gemini API key. It's stored locally in the
          backend's SQLite database and used only to power the chatbot — it
          is never hardcoded into the app.
        </p>

        <p className="mt-3 text-sm">
          Status:{" "}
          {isSet ? (
            <span className="font-medium text-green-600">Key is set ✅</span>
          ) : (
            <span className="font-medium text-amber-600">No key set yet</span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your key here"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save API Key"}
          </button>
        </form>

        {status.message && (
          <p className={`mt-4 text-sm ${status.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {status.message}
          </p>
        )}

        <p className="mt-5 text-xs text-slate-400">
          Don't have a key? Get one for free at{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Google AI Studio
          </a>
          .
        </p>
      </div>
    </div>
  );
}

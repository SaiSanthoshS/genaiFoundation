import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-brand">Disaster Alert Aggregator</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          A lightweight tool that watches real disaster data near a location
          you choose, maps out disaster-prone areas around you, and lets you
          ask questions about disaster preparedness documents through a
          retrieval-augmented chatbot.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/location"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
          >
            Set Your Location
          </Link>
          <Link
            to="/alerts"
            className="rounded-md border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-slate-100"
          >
            View Alerts
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          title="Live Alerts + Map"
          description="Earthquake data from USGS and hazard events from NASA EONET, filtered to your radius and marked on an interactive map."
        />
        <FeatureCard
          title="RAG Chatbot"
          description="Upload PDFs, Word docs, or text files and ask questions answered only from your documents."
        />
        <FeatureCard
          title="Your Own Gemini Key"
          description="Bring your own Google Gemini API key — nothing is hardcoded or shared."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

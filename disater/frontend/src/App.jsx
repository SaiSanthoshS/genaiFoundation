import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LocationSetup from "./pages/LocationSetup";
import DisasterAlerts from "./pages/DisasterAlerts";
import Chatbot from "./pages/Chatbot";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/location" element={<LocationSetup />} />
          <Route path="/alerts" element={<DisasterAlerts />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

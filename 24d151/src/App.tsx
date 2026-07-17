import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CopilotPanel from './components/common/CopilotPanel';
import LandingPage from './pages/LandingPage';
import JourneyPlanner from './pages/JourneyPlanner';
import LiveJourney from './pages/LiveJourney';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import { RouteOption, Reminder } from './types';
import { MOCK_REMINDERS } from './data';
import { Sparkles } from 'lucide-react';

const INITIAL_USER = {
  name: 'Srinisha Thangavel',
  email: 'srinishathangavel2401@gmail.com',
  tier: 'Eco Hero Tier 3',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRpeh3FwXI2pyJCqAg3gPWOcfZ-Jc5xHgIHtpwFIBrkw70_-Kx_ENXW2zZhpD6oiAAQ69P2hB473h3H2lc6T4Qm3MUfJw31L-G9JzRYAeYGHeSjItfwRTB1VSH9QR9gzn84VpHXGitezaS29KCr6kQgaOBZgoVMcKU3cR_iocKWYzdm-eIJhuwQik3wF66dEDixQBkx75oVT-t2stbN03UkRr7-_HXpj55NMcwwtaH2gJFW-WFlXtsxXvOE4l1VS6ZMyTUioGpMjg7',
  savedHome: 'Grand Central Terminal',
  savedWork: 'Wall Street Plaza',
  carbonSaved: 118.4,
  points: 864
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | undefined>(undefined);
  const [reminders, setReminders] = useState<Reminder[]>(MOCK_REMINDERS);
  const [user, setUser] = useState(INITIAL_USER);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [plannerFrom, setPlannerFrom] = useState('');
  const [plannerTo, setPlannerTo] = useState('');
  
  // Quick alert counts (e.g. 3 active municipal alerts by default)
  const [alertCount, setAlertCount] = useState(3);

  const handleStartPlanning = (fromStation: string, toStation: string) => {
    setPlannerFrom(fromStation);
    setPlannerTo(toStation);
    setActiveTab('planner');
  };

  const handleSelectSuggestedRoute = (fromStation: string, toStation: string) => {
    setPlannerFrom(fromStation);
    setPlannerTo(toStation);
    setActiveTab('planner');
  };

  const handleAddReminder = (newRem: Omit<Reminder, 'id' | 'status'>) => {
    const reminder: Reminder = {
      ...newRem,
      id: `rem-${Date.now()}`,
      status: 'active'
    };
    setReminders((prev) => [reminder, ...prev]);
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus: Reminder['status'] =
            r.status === 'active' ? 'fired' : r.status === 'fired' ? 'dismissed' : 'active';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdatePreferences = (prefs: any) => {
    setUser((prev) => ({
      ...prev,
      points: prev.points + 20 // award bonus points for updating profile!
    }));
  };

  const handleSelectStationOnMap = (stationName: string) => {
    // If user clicks a station on the interactive map, populate origin/destination
    if (!plannerFrom) {
      setPlannerFrom(stationName);
      setActiveTab('planner');
    } else if (!plannerTo && plannerFrom !== stationName) {
      setPlannerTo(stationName);
      setActiveTab('planner');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans flex flex-col justify-between selection:bg-primary selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenCopilot={() => setCopilotOpen(true)}
        alertCount={alertCount}
      />

      {/* Main Container Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 pt-24 pb-8">
        {activeTab === 'landing' && (
          <LandingPage 
            onStartPlanning={handleStartPlanning} 
            activeDisruptions={alertCount}
          />
        )}

        {activeTab === 'planner' && (
          <JourneyPlanner
            initialFrom={plannerFrom}
            initialTo={plannerTo}
            selectedRoute={selectedRoute}
            onSelectRoute={(route) => {
              setSelectedRoute(route);
              // After selecting a route, nudge user that they can track it live
            }}
            onAddReminder={handleAddReminder}
          />
        )}

        {activeTab === 'live' && (
          <LiveJourney 
            selectedRoute={selectedRoute}
            onSelectStation={handleSelectStationOnMap}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics />
        )}

        {activeTab === 'profile' && (
          <Profile
            user={user}
            reminders={reminders}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            onUpdatePreferences={handleUpdatePreferences}
          />
        )}
      </main>

      {/* Floating AI Assistant Copilot Drawer overlay */}
      <CopilotPanel
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        onSelectSuggestedRoute={handleSelectSuggestedRoute}
      />

      {/* Footer component */}
      <Footer />
    </div>
  );
}

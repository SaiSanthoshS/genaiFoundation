import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { RouteOption, Reminder } from './types';
import { MOCK_REMINDERS } from './data';

// Lazy loading pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const JourneyPlanner = lazy(() => import('./pages/JourneyPlanner'));
const LiveJourney = lazy(() => import('./pages/LiveJourney'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const RouteRecommendationsPage = lazy(() => import('./pages/RouteRecommendationsPage'));
const DelayAlertPage = lazy(() => import('./pages/DelayAlertPage'));
const AICopilotPage = lazy(() => import('./pages/AICopilotPage'));
const ReminderPage = lazy(() => import('./pages/ReminderPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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
  };

  const handleSelectSuggestedRoute = (fromStation: string, toStation: string) => {
    setPlannerFrom(fromStation);
    setPlannerTo(toStation);
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
    if (!plannerFrom) {
      setPlannerFrom(stationName);
    } else if (!plannerTo && plannerFrom !== stationName) {
      setPlannerTo(stationName);
    }
  };

  // Reusable loading spinner for suspense fallback
  const FallbackLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-on-background font-sans flex flex-col justify-between selection:bg-primary selection:text-white">
        <Routes>
          <Route 
            element={
              <MainLayout 
                alertCount={alertCount}
                copilotOpen={copilotOpen}
                onOpenCopilot={() => setCopilotOpen(true)}
                onCloseCopilot={() => setCopilotOpen(false)}
                onSelectSuggestedRoute={handleSelectSuggestedRoute}
              />
            }
          >
            <Route path="/" element={
              <Suspense fallback={<FallbackLoader />}>
                <LandingPage 
                  onStartPlanning={handleStartPlanning} 
                  activeDisruptions={alertCount}
                />
              </Suspense>
            } />
            
            <Route path="/journey-planner" element={
              <Suspense fallback={<FallbackLoader />}>
                <JourneyPlanner
                  initialFrom={plannerFrom}
                  initialTo={plannerTo}
                  selectedRoute={selectedRoute}
                  onSelectRoute={(route) => setSelectedRoute(route)}
                  onAddReminder={handleAddReminder}
                />
              </Suspense>
            } />

            <Route path="/route-recommendations" element={
              <Suspense fallback={<FallbackLoader />}>
                <RouteRecommendationsPage 
                  selectedRoute={selectedRoute}
                  onSelectRoute={(route) => setSelectedRoute(route)}
                  onSetReminder={(route) => console.log('Setting reminder from standalone page for', route.name)}
                />
              </Suspense>
            } />

            <Route path="/live-journey" element={
              <Suspense fallback={<FallbackLoader />}>
                <LiveJourney 
                  selectedRoute={selectedRoute}
                  onSelectStation={handleSelectStationOnMap}
                />
              </Suspense>
            } />

            <Route path="/delay-alert" element={
              <Suspense fallback={<FallbackLoader />}>
                <DelayAlertPage />
              </Suspense>
            } />

            <Route path="/ai-copilot" element={
              <Suspense fallback={<FallbackLoader />}>
                <AICopilotPage />
              </Suspense>
            } />

            <Route path="/reminder" element={
              <Suspense fallback={<FallbackLoader />}>
                <ReminderPage onAddReminder={handleAddReminder} />
              </Suspense>
            } />

            <Route path="/analytics" element={
              <Suspense fallback={<FallbackLoader />}>
                <Analytics />
              </Suspense>
            } />

            <Route path="/profile" element={
              <Suspense fallback={<FallbackLoader />}>
                <Profile
                  user={user}
                  reminders={reminders}
                  onToggleReminder={handleToggleReminder}
                  onDeleteReminder={handleDeleteReminder}
                  onUpdatePreferences={handleUpdatePreferences}
                />
              </Suspense>
            } />

            <Route path="*" element={
              <Suspense fallback={<FallbackLoader />}>
                <NotFoundPage />
              </Suspense>
            } />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

import React, { useState, useEffect } from 'react';
import AnalyticsCards from '../components/analytics/AnalyticsCards';
import Charts from '../components/analytics/Charts';
import { AnalyticsData } from '../types';
import { userService } from '../services/userService';
import { Loader2 } from 'lucide-react';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getAnalytics()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-on-surface-variant">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p className="font-medium">Crunching your transit data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface">Analytics & Impact</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Visualize your personal ecological footprint and transit efficiency over time.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <AnalyticsCards data={analytics} />

      {/* Charts Section */}
      <Charts data={analytics} />

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import DelayAlert from '../components/journey/DelayAlert';
import { DelayInfo } from '../types';
import { delayService } from '../services/delayService';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function DelayAlertPage() {
  const [delays, setDelays] = useState<DelayInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    delayService.getLiveDelays()
      .then(setDelays)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDismissDelay = (id: string) => {
    setDelays((prev) => prev.filter(d => d.id !== id));
  };

  const handleResolveRoute = (altRouteId: string) => {
    console.log(`Resolved alternate route ${altRouteId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Checking live network status...</p>
      </div>
    );
  }

  if (delays.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        No active delays! System is operating normally.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-1 text-xs font-bold uppercase text-error tracking-wider">
        <AlertCircle className="w-4 h-4" />
        Live System Disruptions ({delays.length})
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {delays.map((delay) => (
          <DelayAlert
            key={delay.id}
            delay={delay}
            onDismiss={handleDismissDelay}
            onResolveRoute={handleResolveRoute}
          />
        ))}
      </div>
    </div>
  );
}


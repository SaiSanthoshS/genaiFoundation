import React, { useState } from 'react';
import DelayAlert from '../components/journey/DelayAlert';
import { DelayInfo } from '../types';
import { MOCK_DELAYS } from '../data';
import { AlertCircle } from 'lucide-react';

export default function DelayAlertPage() {
  const [delays, setDelays] = useState<DelayInfo[]>(MOCK_DELAYS);

  const handleDismissDelay = (id: string) => {
    setDelays((prev) => prev.filter(d => d.id !== id));
  };

  const handleResolveRoute = (altRouteId: string) => {
    console.log(`Resolved alternate route ${altRouteId}`);
  };

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

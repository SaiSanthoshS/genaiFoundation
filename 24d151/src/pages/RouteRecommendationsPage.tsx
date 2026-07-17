import React from 'react';
import RouteCard from '../components/journey/RouteCard';
import { RouteOption } from '../types';
import { MOCK_ROUTES } from '../data';
import { Sparkles } from 'lucide-react';

interface RouteRecommendationsPageProps {
  selectedRoute?: RouteOption;
  onSelectRoute: (route: RouteOption) => void;
  onSetReminder: (route: RouteOption) => void;
}

export default function RouteRecommendationsPage({
  selectedRoute,
  onSelectRoute,
  onSetReminder
}: RouteRecommendationsPageProps) {
  const routes = MOCK_ROUTES.default;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          AI Generated Route Recommendations
        </h3>
        <span className="text-xs font-semibold text-primary">{routes.length} paths computed</span>
      </div>

      <div className="space-y-4">
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            isSelected={selectedRoute?.id === route.id}
            onSelect={() => onSelectRoute(route)}
            onSetReminder={() => onSetReminder(route)}
          />
        ))}
      </div>
    </div>
  );
}

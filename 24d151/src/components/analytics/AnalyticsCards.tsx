import React from 'react';
import { AnalyticsData } from '../../types';
import { Zap, DollarSign, Leaf, Map, Footprints } from 'lucide-react';

interface AnalyticsCardsProps {
  data: AnalyticsData;
}

export default function AnalyticsCards({ data }: AnalyticsCardsProps) {
  const cards = [
    {
      label: 'Commute Efficiency',
      value: `${data.efficiencyScore}%`,
      subText: 'AI optimized path matching',
      icon: <Zap className="w-5 h-5 text-primary" />,
      bg: 'bg-primary/5 text-primary border-primary/20',
    },
    {
      label: 'Financial Savings',
      value: `$${data.moneySaved.toFixed(2)}`,
      subText: 'Savings vs. rideshares/driving',
      icon: <DollarSign className="w-5 h-5 text-secondary" />,
      bg: 'bg-secondary/5 text-secondary border-secondary/20',
    },
    {
      label: 'CO₂ Emissions Saved',
      value: `${data.co2SavedTotal} kg`,
      subText: 'Eco equivalent: 6.2 trees',
      icon: <Leaf className="w-5 h-5 text-green-600" />,
      bg: 'bg-green-500/5 text-green-600 border-green-500/20',
    },
    {
      label: 'Distance Logged',
      value: `${data.totalKm} km`,
      subText: `Across ${data.tripsCount} dynamic journeys`,
      icon: <Map className="w-5 h-5 text-tertiary-container" />,
      bg: 'bg-tertiary/5 text-tertiary-container border-tertiary/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="glass-card p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {card.label}
            </span>
            <div className={`p-2.5 rounded-xl ${card.bg}`}>
              {card.icon}
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-on-surface tracking-tight mb-1">{card.value}</h3>
            <p className="text-xs text-on-surface-variant font-medium">{card.subText}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

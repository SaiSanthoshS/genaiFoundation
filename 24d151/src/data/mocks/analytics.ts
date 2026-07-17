import { AnalyticsData } from '../../types';
export const MOCK_ANALYTICS: AnalyticsData = {
  efficiencyScore: 94, moneySaved: 142.50, co2SavedTotal: 118.4, totalKm: 342.8, tripsCount: 48,
  weeklyFootprint: [
    { day: 'Mon', amount: 2.1, baseline: 8.5 }, { day: 'Tue', amount: 1.8, baseline: 8.5 }, { day: 'Wed', amount: 0.8, baseline: 8.5 },
    { day: 'Thu', amount: 2.4, baseline: 8.5 }, { day: 'Fri', amount: 1.5, baseline: 8.5 }, { day: 'Sat', amount: 0.4, baseline: 4.2 }, { day: 'Sun', amount: 0.0, baseline: 4.2 }
  ],
  modeUsage: [
    { name: 'Subway & Metro', value: 55, color: '#2563eb' }, { name: 'Commuter Rail', value: 20, color: '#475569' },
    { name: 'Green Tramway', value: 15, color: '#0ea5e9' }, { name: 'Eco Bus Links', value: 10, color: '#f59e0b' }
  ]
};
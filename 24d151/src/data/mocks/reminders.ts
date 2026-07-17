import { Reminder } from '../../types';
export const MOCK_REMINDERS: Reminder[] = [
  { id: 'rem-1', routeName: 'Nexus Subway Line 4 Commute', from: 'Grand Central Terminal', to: 'Wall Street Plaza', departureTime: '08:05 AM', mode: 'subway', status: 'active', minutesBefore: 10, type: 'smart' },
  { id: 'rem-2', routeName: 'Evening Return Bus 42', from: 'Wall Street Plaza', to: 'Grand Central Terminal', departureTime: '05:30 PM', mode: 'bus', status: 'active', minutesBefore: 15, type: 'fixed' }
];
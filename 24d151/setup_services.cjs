const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const mocksDir = path.join(srcDir, 'data', 'mocks');
const servicesDir = path.join(srcDir, 'services');

[mocksDir, servicesDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Read the original data file just to grab the content (or we just write our own strings directly)
const indexTsContent = fs.readFileSync(path.join(srcDir, 'data', 'index.ts'), 'utf8');

// We will just create the individual data mock files manually since we know the content exactly.
const dataContent = {
  'stations.ts': `export const POPULAR_STATIONS = [
  'Grand Central Terminal', 'Penn Station', 'JFK Airport Terminal 4', 'Times Square Transit Hub',
  'Brooklyn Heights', 'Central Park West', 'Wall Street Plaza', 'Hoboken Terminal',
  'LaGuardia Airport', 'Williamsburg Bridge Plaza'
];`,
  'routes.ts': `import { RouteOption } from '../../types';
export const MOCK_ROUTES: Record<string, RouteOption[]> = {
  default: [
    {
      id: 'route-1', name: 'Nexus Subway Line 4 & Green Line Bus', totalDuration: 28, startTime: '08:05 AM', endTime: '08:33 AM',
      segments: [
        { mode: 'walk', name: 'Walk to Grand Central', duration: 5, stops: 0, distance: 0.4 },
        { mode: 'subway', name: 'Nexus Subway Line 4', lineCode: 'N4', color: '#004ac6', duration: 15, stops: 4, distance: 8.2 },
        { mode: 'tram', name: 'Green Line Tram', lineCode: 'GL', color: '#006c49', duration: 6, stops: 2, distance: 2.1 },
        { mode: 'walk', name: 'Walk to destination', duration: 2, stops: 0, distance: 0.1 }
      ], cost: 2.75, co2Saved: 3.4, occupancy: 'low', confidence: 98, reliability: 99, delayMinutes: 0, ecoFriendly: true, smartest: true, fastest: true, cheapest: false
    },
    {
      id: 'route-2', name: 'Rapid Express Commuter Rail', totalDuration: 32, startTime: '08:10 AM', endTime: '08:42 AM',
      segments: [
        { mode: 'walk', name: 'Walk to Penn Station', duration: 8, stops: 0, distance: 0.6 },
        { mode: 'train', name: 'Commuter Rail Line M1', lineCode: 'M1', color: '#784b00', duration: 20, stops: 1, distance: 12.5 },
        { mode: 'walk', name: 'Walk to destination', duration: 4, stops: 0, distance: 0.3 }
      ], cost: 5.50, co2Saved: 2.8, occupancy: 'medium', confidence: 94, reliability: 95, delayMinutes: 3, ecoFriendly: false, smartest: false, fastest: false, cheapest: false
    },
    {
      id: 'route-3', name: 'Metro City Bus 42 & Walk', totalDuration: 45, startTime: '07:55 AM', endTime: '08:40 AM',
      segments: [
        { mode: 'walk', name: 'Walk to Bus Stop 12', duration: 3, stops: 0, distance: 0.2 },
        { mode: 'bus', name: 'Metro Bus 42', lineCode: 'B42', color: '#ff9900', duration: 38, stops: 12, distance: 6.8 },
        { mode: 'walk', name: 'Walk to destination', duration: 4, stops: 0, distance: 0.3 }
      ], cost: 1.50, co2Saved: 4.2, occupancy: 'low', confidence: 89, reliability: 91, delayMinutes: 0, ecoFriendly: true, smartest: false, fastest: false, cheapest: true
    }
  ],
  specific: [
    {
      id: 'route-jfk', name: 'JFK AirTrain & Subway Line E', totalDuration: 42, startTime: '10:15 AM', endTime: '10:57 AM',
      segments: [
        { mode: 'subway', name: 'Subway Line E', lineCode: 'E', color: '#004ac6', duration: 25, stops: 8, distance: 14.2 },
        { mode: 'train', name: 'JFK AirTrain Red', lineCode: 'AIR', color: '#737686', duration: 12, stops: 3, distance: 6.5 },
        { mode: 'walk', name: 'Walk to Terminal 4', duration: 5, stops: 0, distance: 0.4 }
      ], cost: 11.25, co2Saved: 5.8, occupancy: 'medium', confidence: 96, reliability: 97, delayMinutes: 0, ecoFriendly: true, smartest: true, fastest: true, cheapest: false
    }
  ]
};`,
  'delays.ts': `import { DelayInfo } from '../../types';
export const MOCK_DELAYS: DelayInfo[] = [
  { id: 'delay-1', line: 'Nexus Subway Line 4', route: 'Grand Central to Wall Street Plaza', status: 'minor', delayMinutes: 3, reason: 'Signal maintenance at Union Square', alternativeRouteId: 'route-2', aiAnalysis: 'The 3-minute delay is stabilizing. Headway is returning to nominal levels.', active: true },
  { id: 'delay-2', line: 'Metro Bus 104', route: 'Central Park West to Times Square', status: 'major', delayMinutes: 14, reason: 'Street construction on Broadway', alternativeRouteId: 'route-1', aiAnalysis: 'Severe congestion surrounding 48th St. Commuter bus transit speed is down to 4 km/h.', active: true },
  { id: 'delay-3', line: 'Rapid Rail Commuter Line M1', route: 'Hoboken to Penn Station', status: 'critical', delayMinutes: 28, reason: 'Switch malfunction near Tunnel East', alternativeRouteId: 'route-3', aiAnalysis: 'Relay issues have bottlenecked all inbound transit on this corridor.', active: true }
];`,
  'reminders.ts': `import { Reminder } from '../../types';
export const MOCK_REMINDERS: Reminder[] = [
  { id: 'rem-1', routeName: 'Nexus Subway Line 4 Commute', from: 'Grand Central Terminal', to: 'Wall Street Plaza', departureTime: '08:05 AM', mode: 'subway', status: 'active', minutesBefore: 10, type: 'smart' },
  { id: 'rem-2', routeName: 'Evening Return Bus 42', from: 'Wall Street Plaza', to: 'Grand Central Terminal', departureTime: '05:30 PM', mode: 'bus', status: 'active', minutesBefore: 15, type: 'fixed' }
];`,
  'history.ts': `import { HistoryItem } from '../../types';
export const MOCK_HISTORY: HistoryItem[] = [
  { id: 'hist-1', from: 'Grand Central Terminal', to: 'Wall Street Plaza', date: 'Jul 16, 2026', cost: 2.75, co2Saved: 3.4, mode: 'subway' },
  { id: 'hist-2', from: 'JFK Airport Terminal 4', to: 'Brooklyn Heights', date: 'Jul 15, 2026', cost: 11.25, co2Saved: 5.6, mode: 'train' },
  { id: 'hist-3', from: 'Central Park West', to: 'Penn Station', date: 'Jul 14, 2026', cost: 2.75, co2Saved: 1.2, mode: 'bus' },
  { id: 'hist-4', from: 'Times Square Transit Hub', to: 'Williamsburg Bridge Plaza', date: 'Jul 12, 2026', cost: 3.50, co2Saved: 2.1, mode: 'tram' },
  { id: 'hist-5', from: 'Hoboken Terminal', to: 'Grand Central Terminal', date: 'Jul 10, 2026', cost: 5.50, co2Saved: 3.8, mode: 'train' }
];`,
  'analytics.ts': `import { AnalyticsData } from '../../types';
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
};`,
  'chat.ts': `import { ChatMessage } from '../../types';
export const INITIAL_CHAT: ChatMessage[] = [
  { id: 'msg-1', sender: 'copilot', text: 'Hello! I am your Nexus transit copilot. What is your destination today?', timestamp: '08:00 AM', suggestions: ['Find fastest route to JFK Terminal 4', 'Are there active delays on Subway Line 4?'] }
];`,
  'index.ts': `export * from './stations';
export * from './routes';
export * from './delays';
export * from './reminders';
export * from './history';
export * from './analytics';
export * from './chat';`
};

for (const [file, content] of Object.entries(dataContent)) {
  fs.writeFileSync(path.join(mocksDir, file), content, 'utf8');
}
// update the main data/index.ts to just export from mocks
fs.writeFileSync(path.join(srcDir, 'data', 'index.ts'), `export * from './mocks';\n`, 'utf8');

const apiClientContent = `import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handler
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
`;

const journeyServiceContent = `import apiClient from './apiClient';
import { RouteOption } from '../types';
import { MOCK_ROUTES } from '../data/mocks/routes';
import { POPULAR_STATIONS } from '../data/mocks/stations';

export const journeyService = {
  searchRoutes: async (from: string, to: string): Promise<RouteOption[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isAirport = to.toLowerCase().includes('jfk') || from.toLowerCase().includes('jfk');
        const routes = isAirport ? MOCK_ROUTES.specific : MOCK_ROUTES.default;
        resolve(routes);
      }, 1000);
    });
  },
  getPopularStations: async (): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(POPULAR_STATIONS), 300);
    });
  }
};`;

const delayServiceContent = `import apiClient from './apiClient';
import { DelayInfo } from '../types';
import { MOCK_DELAYS } from '../data/mocks/delays';

export const delayService = {
  getLiveDelays: async (): Promise<DelayInfo[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_DELAYS), 800);
    });
  }
};`;

const reminderServiceContent = `import apiClient from './apiClient';
import { Reminder } from '../types';
import { MOCK_REMINDERS } from '../data/mocks/reminders';

// Temporary local state for simulation
let activeReminders = [...MOCK_REMINDERS];

export const reminderService = {
  getReminders: async (): Promise<Reminder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(activeReminders), 500);
    });
  },
  addReminder: async (newReminder: Omit<Reminder, 'id' | 'status'>): Promise<Reminder> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reminder: Reminder = {
          ...newReminder,
          id: \`rem-\${Date.now()}\`,
          status: 'active'
        };
        activeReminders = [reminder, ...activeReminders];
        resolve(reminder);
      }, 600);
    });
  },
  updateReminderStatus: async (id: string, status: Reminder['status']): Promise<Reminder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        activeReminders = activeReminders.map(r => r.id === id ? { ...r, status } : r);
        resolve(activeReminders);
      }, 300);
    });
  },
  deleteReminder: async (id: string): Promise<Reminder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        activeReminders = activeReminders.filter(r => r.id !== id);
        resolve(activeReminders);
      }, 400);
    });
  }
};`;

const userServiceContent = `import apiClient from './apiClient';
import { HistoryItem, AnalyticsData } from '../types';
import { MOCK_HISTORY } from '../data/mocks/history';
import { MOCK_ANALYTICS } from '../data/mocks/analytics';

export const userService = {
  getHistory: async (): Promise<HistoryItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_HISTORY), 700);
    });
  },
  getAnalytics: async (): Promise<AnalyticsData> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_ANALYTICS), 900);
    });
  }
};`;

fs.writeFileSync(path.join(servicesDir, 'apiClient.ts'), apiClientContent, 'utf8');
fs.writeFileSync(path.join(servicesDir, 'journeyService.ts'), journeyServiceContent, 'utf8');
fs.writeFileSync(path.join(servicesDir, 'delayService.ts'), delayServiceContent, 'utf8');
fs.writeFileSync(path.join(servicesDir, 'reminderService.ts'), reminderServiceContent, 'utf8');
fs.writeFileSync(path.join(servicesDir, 'userService.ts'), userServiceContent, 'utf8');

console.log('Services generated.');

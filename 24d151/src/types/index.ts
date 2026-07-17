export type TransitMode = 'bus' | 'train' | 'tram' | 'walk' | 'subway';

export interface RouteSegment {
  mode: TransitMode;
  name: string;
  lineCode?: string;
  color?: string;
  duration: number; // in minutes
  stops: number;
  distance: number; // in km
}

export interface RouteOption {
  id: string;
  name: string;
  totalDuration: number; // in minutes
  startTime: string;
  endTime: string;
  segments: RouteSegment[];
  cost: number; // in dollars
  co2Saved: number; // in kg compared to driving
  occupancy: 'low' | 'medium' | 'high';
  confidence: number; // AI confidence percentage
  reliability: number; // reliability percentage
  delayMinutes: number;
  ecoFriendly: boolean;
  smartest: boolean;
  fastest: boolean;
  cheapest: boolean;
}

export interface DelayInfo {
  id: string;
  line: string;
  route: string;
  status: 'minor' | 'major' | 'critical';
  delayMinutes: number;
  reason: string;
  alternativeRouteId: string;
  aiAnalysis: string;
  active: boolean;
}

export interface Reminder {
  id: string;
  routeName: string;
  from: string;
  to: string;
  departureTime: string;
  mode: TransitMode;
  status: 'active' | 'triggered' | 'dismissed' | 'cancelled';
  minutesBefore: number;
  type: 'smart' | 'fixed';
  repeat?: string;
  enabled?: boolean;
}

export interface HistoryItem {
  id: string;
  from: string;
  to: string;
  date: string;
  cost: number;
  co2Saved: number;
  mode: TransitMode;
}

export interface AnalyticsData {
  efficiencyScore: number;
  moneySaved: number;
  co2SavedTotal: number;
  totalKm: number;
  tripsCount: number;
  weeklyFootprint: { day: string; amount: number; baseline: number }[];
  modeUsage: { name: string; value: number; color: string }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  suggestions?: string[];
  routeOptionId?: string; // Optional reference to a route
}

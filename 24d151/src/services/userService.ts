import apiClient from './apiClient';
import { HistoryItem, AnalyticsData } from '../types';

// The backend doesn't explicitly have /user endpoints yet, but we will keep this file stubbed 
// to prevent breaking Profile and Analytics which we updated earlier.
export const userService = {
  getHistory: async (): Promise<HistoryItem[]> => {
    return [];
  },
  getAnalytics: async (): Promise<AnalyticsData> => {
    return {
      efficiencyScore: 0, moneySaved: 0, co2SavedTotal: 0, totalKm: 0, tripsCount: 0,
      weeklyFootprint: [], modeUsage: []
    };
  }
};
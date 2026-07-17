import apiClient from './apiClient';
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
};
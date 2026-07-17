import apiClient from './apiClient';
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
};
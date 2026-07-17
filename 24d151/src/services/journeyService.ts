import apiClient from './apiClient';
import { RouteOption } from '../types';

export const journeyService = {
  searchRoutes: async (fromStation: string, toStation: string): Promise<RouteOption[]> => {
    const response = await apiClient.post('/journey/plan', {
      origin: fromStation,
      destination: toStation,
      ecoFriendly: true,
      avoidCrowds: false,
      cheapest: false,
      fastest: true
    });
    return response.data;
  },
  getPopularStations: async (): Promise<string[]> => {
    // We don't have a backend route for stations yet, so we return a default list
    return ['Grand Central Terminal', 'Penn Station', 'JFK Airport Terminal 4', 'Times Square Transit Hub', 'Brooklyn Heights', 'Central Park West', 'Wall Street Plaza', 'Hoboken Terminal', 'LaGuardia Airport', 'Williamsburg Bridge Plaza'];
  }
};
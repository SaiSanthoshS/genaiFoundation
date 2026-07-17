import apiClient from './apiClient';
import { DelayInfo } from '../types';

export const delayService = {
  getLiveDelays: async (): Promise<DelayInfo[]> => {
    const response = await apiClient.get('/journey/delays');
    return response.data;
  }
};
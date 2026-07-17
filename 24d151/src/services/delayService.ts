import apiClient from './apiClient';
import { DelayInfo } from '../types';
import { MOCK_DELAYS } from '../data/mocks/delays';

export const delayService = {
  getLiveDelays: async (): Promise<DelayInfo[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_DELAYS), 800);
    });
  }
};
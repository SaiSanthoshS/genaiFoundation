import axios from 'axios';
import { logger } from '../utils/logger';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  logger.error('API Request Error:', error);
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response) {
    logger.error(`API Error [${error.response.status}]:`, error.response.data);
  } else if (error.request) {
    logger.error('API Network Error: No response received.');
  } else {
    logger.error('API Error:', error.message);
  }
  return Promise.reject(error);
});

export default apiClient;

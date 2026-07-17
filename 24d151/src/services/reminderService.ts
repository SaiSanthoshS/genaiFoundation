import apiClient from './apiClient';
import { Reminder } from '../types';

export const reminderService = {
  getReminders: async (): Promise<Reminder[]> => {
    // For now, if we don't have a GET reminders on backend, we return empty or mock it.
    // Actually we don't have GET /reminders in backend yet. Let's return empty array so it doesn't break, 
    // or just maintain state locally for list, but the prompt says "Replace all mock Promise-based service calls with real HTTP requests"
    // Since backend has POST /reminder, let's keep it purely client-side fetch until we add GET /reminders
    return [];
  },
  addReminder: async (newReminder: Omit<Reminder, 'id' | 'status'>): Promise<Reminder> => {
    const response = await apiClient.post('/journey/reminder', {
      routeName: newReminder.routeName,
      from_station: newReminder.from,
      to_station: newReminder.to,
      departureTime: newReminder.departureTime,
      mode: newReminder.mode,
      minutesBefore: newReminder.minutesBefore,
      type: newReminder.type
    });
    // map from_station/to_station back to from/to for frontend
    return {
      ...response.data,
      from: response.data.from_station,
      to: response.data.to_station
    };
  },
  updateReminderStatus: async (id: string, status: Reminder['status']): Promise<Reminder[]> => {
    // Mock local behaviour since backend doesn't support updating yet
    return [];
  },
  deleteReminder: async (id: string): Promise<Reminder[]> => {
    // Mock local behaviour
    return [];
  }
};
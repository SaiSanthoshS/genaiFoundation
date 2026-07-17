import apiClient from './apiClient';
import { Reminder } from '../types';

export const reminderService = {
  getReminders: async (): Promise<Reminder[]> => {
    const response = await apiClient.get('/journey/reminders');
    return response.data.map((rem: any) => ({
      ...rem,
      from: rem.from_station,
      to: rem.to_station
    }));
  },
  addReminder: async (newReminder: Omit<Reminder, 'id' | 'status'>): Promise<Reminder> => {
    const response = await apiClient.post('/journey/reminder', {
      routeName: newReminder.routeName,
      from_station: newReminder.from,
      to_station: newReminder.to,
      departureTime: newReminder.departureTime,
      mode: newReminder.mode,
      minutesBefore: newReminder.minutesBefore,
      type: newReminder.type,
      repeat: newReminder.repeat || 'once',
      enabled: newReminder.enabled !== false
    });
    return {
      ...response.data,
      from: response.data.from_station,
      to: response.data.to_station
    };
  },
  updateReminderStatus: async (id: string, status: Reminder['status'], enabled?: boolean): Promise<Reminder[]> => {
    await apiClient.put(`/journey/reminder/${id}`, { status, enabled });
    // Refetch
    return reminderService.getReminders();
  },
  deleteReminder: async (id: string): Promise<Reminder[]> => {
    await apiClient.delete(`/journey/reminder/${id}`);
    // Refetch
    return reminderService.getReminders();
  }
};
import apiClient from './apiClient';
import { Reminder } from '../types';
import { MOCK_REMINDERS } from '../data/mocks/reminders';

// Temporary local state for simulation
let activeReminders = [...MOCK_REMINDERS];

export const reminderService = {
  getReminders: async (): Promise<Reminder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(activeReminders), 500);
    });
  },
  addReminder: async (newReminder: Omit<Reminder, 'id' | 'status'>): Promise<Reminder> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reminder: Reminder = {
          ...newReminder,
          id: `rem-${Date.now()}`,
          status: 'active'
        };
        activeReminders = [reminder, ...activeReminders];
        resolve(reminder);
      }, 600);
    });
  },
  updateReminderStatus: async (id: string, status: Reminder['status']): Promise<Reminder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        activeReminders = activeReminders.map(r => r.id === id ? { ...r, status } : r);
        resolve(activeReminders);
      }, 300);
    });
  },
  deleteReminder: async (id: string): Promise<Reminder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        activeReminders = activeReminders.filter(r => r.id !== id);
        resolve(activeReminders);
      }, 400);
    });
  }
};
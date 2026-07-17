import { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { reminderService } from '../services/reminderService';

export function useNotifications(reminders: Reminder[], refreshReminders: () => void) {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission);
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== 'granted' || reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      reminders.forEach(async (rem) => {
        if (rem.status !== 'active' || !rem.enabled) return;

        // Parse departure time e.g., "08:05 AM"
        const [timePart, ampm] = rem.departureTime.split(' ');
        let [depHours, depMins] = timePart.split(':').map(Number);
        
        if (ampm === 'PM' && depHours !== 12) depHours += 12;
        if (ampm === 'AM' && depHours === 12) depHours = 0;

        const depTotalMins = depHours * 60 + depMins;
        const curTotalMins = currentHours * 60 + currentMinutes;

        // Fire if within minutesBefore
        if (depTotalMins - curTotalMins <= rem.minutesBefore && depTotalMins - curTotalMins >= 0) {
          new Notification('Journey Departure Alert', {
            body: `Your ${rem.mode} from ${rem.from} departs in ${rem.minutesBefore} minutes!`,
            icon: '/favicon.ico' // Or any relevant icon
          });
          
          // Mark as triggered in backend
          await reminderService.updateReminderStatus(rem.id, 'triggered');
          refreshReminders();
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reminders, permission, refreshReminders]);

  return { permission };
}

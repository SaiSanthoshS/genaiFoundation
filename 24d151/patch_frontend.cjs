const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Update Types
const typesPath = path.join(srcDir, 'types', 'index.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');
typesContent = typesContent.replace(/export interface Reminder {[\s\S]*?}/m, `export interface Reminder {
  id: string;
  routeName: string;
  from: string;
  to: string;
  departureTime: string;
  mode: TransitMode;
  status: 'active' | 'triggered' | 'dismissed' | 'cancelled';
  minutesBefore: number;
  type: 'smart' | 'fixed';
  repeat?: string;
  enabled?: boolean;
}`);
fs.writeFileSync(typesPath, typesContent, 'utf8');

// 2. Update reminderService.ts
const reminderServicePath = path.join(srcDir, 'services', 'reminderService.ts');
const reminderServiceContent = `import apiClient from './apiClient';
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
    await apiClient.put(\`/journey/reminder/\${id}\`, { status, enabled });
    // Refetch
    return reminderService.getReminders();
  },
  deleteReminder: async (id: string): Promise<Reminder[]> => {
    await apiClient.delete(\`/journey/reminder/\${id}\`);
    // Refetch
    return reminderService.getReminders();
  }
};`;
fs.writeFileSync(reminderServicePath, reminderServiceContent, 'utf8');

// 3. Create Hook
const hooksDir = path.join(srcDir, 'hooks');
if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

const useNotificationsContent = `import { useState, useEffect } from 'react';
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
            body: \`Your \${rem.mode} from \${rem.from} departs in \${rem.minutesBefore} minutes!\`,
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
`;
fs.writeFileSync(path.join(hooksDir, 'useNotifications.ts'), useNotificationsContent, 'utf8');

// 4. Update App.tsx
const appTsxPath = path.join(srcDir, 'App.tsx');
let appContent = fs.readFileSync(appTsxPath, 'utf8');

if (!appContent.includes('useNotifications')) {
  appContent = appContent.replace("import { journeyService }", "import { useNotifications } from './hooks/useNotifications';\nimport { journeyService }");
  appContent = appContent.replace("const [reminders, setReminders] = useState<Reminder[]>([]);", `const [reminders, setReminders] = useState<Reminder[]>([]);
  
  const refreshReminders = async () => {
    try {
      const data = await reminderService.getReminders();
      setReminders(data);
    } catch (err) {
      console.error(err);
    }
  };
  
  useNotifications(reminders, refreshReminders);`);
  fs.writeFileSync(appTsxPath, appContent, 'utf8');
}

console.log('Frontend hooks and services patched.');

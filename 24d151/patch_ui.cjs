const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Update Profile.tsx to show active reminders
const profilePath = path.join(srcDir, 'pages', 'Profile.tsx');
let profileContent = fs.readFileSync(profilePath, 'utf8');

if (!profileContent.includes('reminderService')) {
  profileContent = profileContent.replace("import { userService } from '../services/userService';", "import { userService } from '../services/userService';\nimport { reminderService } from '../services/reminderService';\nimport { Reminder } from '../types';");
  profileContent = profileContent.replace("const [loading, setLoading] = useState(true);", "const [loading, setLoading] = useState(true);\n  const [reminders, setReminders] = useState<Reminder[]>([]);");
  
  profileContent = profileContent.replace("userService.getHistory()", "Promise.all([userService.getHistory(), reminderService.getReminders()])");
  profileContent = profileContent.replace(".then(setHistory)", ".then(([historyData, remindersData]) => {\n        setHistory(historyData);\n        setReminders(remindersData);\n      })");

  const remindersSection = `
      {/* Active Reminders Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
          <Bell className="w-5 h-5 text-secondary" />
          My Departure Reminders
        </h3>
        
        {reminders.length === 0 ? (
          <div className="p-6 rounded-2xl border border-outline-variant/30 text-center text-on-surface-variant bg-surface-low/30">
            <p className="text-sm">You have no active reminders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((rem) => (
              <div key={rem.id} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-low/30 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={\`w-2 h-2 rounded-full \${rem.status === 'active' ? (rem.enabled ? 'bg-secondary' : 'bg-outline') : 'bg-primary'}\`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{rem.status}</span>
                  </div>
                  <h4 className="font-bold text-sm text-on-surface mb-0.5">{rem.routeName}</h4>
                  <p className="text-xs text-outline font-medium">Departs at {rem.departureTime}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                    -{rem.minutesBefore}m
                  </span>
                  <div className="text-[10px] mt-2 text-outline-variant font-semibold uppercase">{rem.repeat}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  `;
  profileContent = profileContent.replace('{/* Journey History List */}', remindersSection + '\n\n      {/* Journey History List */}');
  fs.writeFileSync(profilePath, profileContent, 'utf8');
}


// 2. Update ReminderPage.tsx to allow configuring the new fields (repeat, enabled)
const reminderPagePath = path.join(srcDir, 'pages', 'ReminderPage.tsx');
let reminderPageContent = fs.readFileSync(reminderPagePath, 'utf8');

// Replace ReminderPage to include full editing if we want, but since prompt says "Create, Edit, Delete, Enable/Disable", 
// we should render a list of reminders at the bottom of ReminderPage, or replace the page to show active ones and allow creation.

const fullReminderPageContent = `import React, { useState, useEffect } from 'react';
import { AlarmClock, Check, Plus, Clock, Loader2, Trash2, Power } from 'lucide-react';
import { RouteOption, Reminder } from '../types';
import { journeyService } from '../services/journeyService';
import { reminderService } from '../services/reminderService';

export default function ReminderPage() {
  const [reminderRoute, setReminderRoute] = useState<RouteOption | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [reminderType, setReminderType] = useState<'smart' | 'fixed'>('smart');
  const [repeat, setRepeat] = useState('once');
  const [reminderSuccess, setReminderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const fetchData = async () => {
    try {
      const [rts, rems] = await Promise.all([
        journeyService.searchRoutes('Auto', 'Auto'),
        reminderService.getReminders()
      ]);
      setRoutes(rts);
      if (rts.length > 0) setReminderRoute(rts[0]);
      setReminders(rems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(setNotificationPermission);
    }
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderRoute) return;

    await reminderService.addReminder({
      routeName: reminderRoute.name,
      from: 'My Current Station',
      to: 'My Destination',
      departureTime: reminderRoute.startTime,
      mode: reminderRoute.segments.find(s => s.mode !== 'walk')?.mode || 'subway',
      minutesBefore: reminderMinutes,
      type: reminderType,
      repeat,
      enabled: true
    });

    setReminderSuccess(true);
    fetchData(); // refresh list
    setTimeout(() => {
      setReminderSuccess(false);
    }, 2000);
  };

  const handleDelete = async (id: string) => {
    await reminderService.deleteReminder(id);
    fetchData();
  };

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    await reminderService.updateReminderStatus(id, 'active', !currentEnabled);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading reminder config...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300 pt-4">
      {notificationPermission !== 'granted' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="text-sm text-amber-700 font-medium">Browser notifications are currently blocked.</div>
          <button onClick={handleRequestPermission} className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600">
            Enable
          </button>
        </div>
      )}

      <div className="glass-card p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <AlarmClock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Create Reminder</h2>
            <p className="text-xs text-on-surface-variant font-medium">Never miss your train with smart push notifications.</p>
          </div>
        </div>

        <form onSubmit={handleSaveReminder} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Select Journey
            </label>
            <select 
              className="w-full h-12 px-4 rounded-xl border border-outline-variant/60 bg-surface-low text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary"
              value={reminderRoute?.id || ''}
              onChange={(e) => setReminderRoute(routes.find(r => r.id === e.target.value) || null)}
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.name} (Departs {r.startTime})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Alert Timing
              </label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/60 bg-surface-low text-sm font-medium focus:ring-2 focus:ring-primary"
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
              >
                <option value={5}>5 mins before</option>
                <option value={10}>10 mins before</option>
                <option value={15}>15 mins before</option>
                <option value={30}>30 mins before</option>
                <option value={60}>60 mins before</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Repeat
              </label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/60 bg-surface-low text-sm font-medium focus:ring-2 focus:ring-primary"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-95 transition-all shadow-md"
          >
            {reminderSuccess ? (
              <><Check className="w-5 h-5" /> Saved Successfully</>
            ) : (
              <><Plus className="w-5 h-5" /> Add Departure Reminder</>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider">Manage Active Reminders</h3>
        {reminders.length === 0 ? (
          <p className="text-sm text-outline font-medium text-center py-4 bg-surface-low/50 rounded-xl border border-outline-variant/20">
            No reminders configured.
          </p>
        ) : (
          <div className="space-y-3">
            {reminders.map(rem => (
              <div key={rem.id} className={\`p-4 rounded-xl border transition-all flex items-center justify-between \${rem.enabled ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/30 bg-surface-low opacity-60'}\`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={\`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 \${rem.status === 'triggered' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}\`}>
                      <Clock className="w-3 h-3" />
                      {rem.status}
                    </span>
                    <span className="text-xs font-bold text-outline">{rem.repeat}</span>
                  </div>
                  <h4 className="font-bold text-sm text-on-surface">{rem.routeName}</h4>
                  <p className="text-xs text-outline font-medium">Departs at {rem.departureTime} • Alert {rem.minutesBefore}m prior</p>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleToggle(rem.id, rem.enabled || false)} className={\`p-2.5 rounded-lg border \${rem.enabled ? 'bg-primary text-white border-primary' : 'bg-surface-low text-outline border-outline-variant'}\`}>
                    <Power className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(rem.id)} className="p-2.5 rounded-lg border border-error/20 bg-error/5 text-error hover:bg-error/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync(reminderPagePath, fullReminderPageContent, 'utf8');

// Update App.tsx routing signature for reminder page
let appRoutingContent = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');
appRoutingContent = appRoutingContent.replace(/<ReminderPage onAddReminder={handleAddReminder} \/>/g, "<ReminderPage />");
fs.writeFileSync(path.join(srcDir, 'App.tsx'), appRoutingContent, 'utf8');

console.log('UI Patched successfully.');

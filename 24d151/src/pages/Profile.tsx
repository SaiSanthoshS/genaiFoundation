import React, { useState, useEffect } from 'react';
import { HistoryItem, Reminder } from '../types';
import { userService } from '../services/userService';
import { reminderService } from '../services/reminderService';
import { Reminder } from '../types';
import ProfileCard from '../components/profile/ProfileCard';
import ReminderCard from '../components/profile/ReminderCard';
import { History, Award, Leaf, Calendar, Loader2, AlarmClock, Clock } from 'lucide-react';

interface ProfileProps {
  user: any;
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onUpdatePreferences: (prefs: any) => void;
}

export default function Profile({ user, reminders, onToggleReminder, onDeleteReminder, onUpdatePreferences }: ProfileProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-2xl font-extrabold text-on-surface">My Profile & Commute Hub</h2>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">
          Manage saved coordinates, custom active alerts, and review transit logs.
        </p>
      </div>

      {/* Profile Setup / Bio Card */}
      <ProfileCard 
        user={user} 
        onUpdatePreferences={onUpdatePreferences} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Scheduled Alarms List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <AlarmClock className="w-4 h-4 text-primary" />
              Active Scheduled Alarms ({reminders.length})
            </h3>
          </div>

          <div className="space-y-4">
            {reminders.map((rem) => (
              <ReminderCard
                key={rem.id}
                reminder={rem}
                onToggle={() => onToggleReminder(rem.id)}
                onDelete={() => onDeleteReminder(rem.id)}
              />
            ))}
            
            {reminders.length === 0 && (
              <div className="text-center py-8 bg-surface-low/30 rounded-2xl border border-outline-variant/20 text-on-surface-variant">
                <Clock className="w-8 h-8 text-outline mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No scheduled alarms active right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: History Logging */}
        <div className="lg:col-span-7">
          <div className="glass-card p-6 border border-slate-200 shadow-sm sticky top-24">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-primary" />
              Recent Journey Log
            </h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                <p>Loading journey history...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface hover:bg-surface-container-low transition-colors border border-outline-variant/30 group">
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-on-surface-variant font-medium mb-0.5">{item.date}</div>
                        <div className="font-bold text-on-surface text-sm">
                          {item.from} <span className="text-outline">→</span> {item.to}
                        </div>
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                          {item.mode} transit
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <div className="font-bold text-on-surface text-base">
                        ${item.cost.toFixed(2)}
                      </div>
                      {item.co2Saved > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                          <Leaf className="w-3 h-3" />
                          {item.co2Saved}kg saved
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="text-center py-8 text-on-surface-variant">
                    No recent transit trips found in your log.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

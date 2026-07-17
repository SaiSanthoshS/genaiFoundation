import React from 'react';
import ProfileCard from '../components/profile/ProfileCard';
import ReminderCard from '../components/profile/ReminderCard';
import { Reminder, HistoryItem } from '../types';
import { MOCK_HISTORY } from '../data';
import { AlarmClock, History, Compass, CheckCircle2, Leaf, Clock } from 'lucide-react';
import { getModeIcon, getModeBg } from '../components/journey/RouteCard';

interface ProfilePageProps {
  user: {
    name: string;
    email: string;
    tier: string;
    avatarUrl: string;
    savedHome: string;
    savedWork: string;
    carbonSaved: number;
    points: number;
  };
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onUpdatePreferences: (prefs: any) => void;
}

export default function Profile({ 
  user, 
  reminders, 
  onToggleReminder, 
  onDeleteReminder, 
  onUpdatePreferences 
}: ProfilePageProps) {
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
        onSavePreferences={onUpdatePreferences} 
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
                onToggleStatus={onToggleReminder}
                onDelete={onDeleteReminder}
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

        {/* Right: Historic Journey Logs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-primary" />
              Recent Commute Journey Logs
            </h3>
            <span className="text-xs text-outline font-semibold">Last 30 days</span>
          </div>

          <div className="glass-card border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="bg-surface-low text-outline uppercase tracking-wider border-b border-outline-variant/30 text-[9px] font-bold">
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Commute Sector</th>
                    <th className="p-3.5">Transit</th>
                    <th className="p-3.5 text-right pr-5">Fare / CO₂ Offset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {MOCK_HISTORY.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-low/40 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-on-surface-variant whitespace-nowrap">{item.date}</td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-on-surface font-bold truncate max-w-[160px] md:max-w-xs">{item.from}</span>
                          <span className="text-[10px] text-outline truncate max-w-[160px] md:max-w-xs">→ {item.to}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`p-1.5 rounded-lg inline-flex items-center justify-center ${getModeBg(item.mode)}`}>
                          {getModeIcon(item.mode, "w-4 h-4")}
                        </span>
                      </td>
                      <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                        <div className="font-bold text-on-surface">${item.cost.toFixed(2)}</div>
                        <div className="text-[10px] text-secondary flex items-center justify-end gap-0.5 mt-0.5">
                          <Leaf className="w-3 h-3" />
                          -{item.co2Saved} kg
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

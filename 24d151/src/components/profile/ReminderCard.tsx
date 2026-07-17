import React from 'react';
import { Reminder } from '../../types';
import { AlarmClock, Bell, Trash2, CheckCircle, Sparkles, MapPin, Footprints, Train } from 'lucide-react';
import { getModeIcon } from '../journey/RouteCard';

interface ReminderCardProps {
  key?: string;
  reminder: Reminder;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ReminderCard({ reminder, onToggleStatus, onDelete }: ReminderCardProps) {
  const isTriggered = reminder.status === 'triggered';
  const isActive = reminder.status === 'active';

  return (
    <div 
      className={`glass-card p-5 transition-all duration-300 border relative ${
        isTriggered 
          ? 'border-secondary bg-secondary/[0.02] ring-2 ring-secondary/15 animate-pulse' 
          : isActive 
          ? 'border-slate-200' 
          : 'border-outline-variant/30 opacity-60'
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        {/* Departure Mode Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isTriggered ? 'bg-secondary text-white' : 'bg-primary/10 text-primary'
        }`}>
          {getModeIcon(reminder.mode, "w-5 h-5")}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-on-surface text-sm truncate">{reminder.routeName}</h4>
            {reminder.type === 'smart' && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-primary" />
                AI Smart Alarm
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1 text-xs font-semibold text-on-surface-variant">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-outline shrink-0" />
              <span>From: <span className="text-on-surface">{reminder.from}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-outline shrink-0" />
              <span>To: <span className="text-on-surface">{reminder.to}</span></span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <AlarmClock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Departure: <span className="text-primary font-bold">{reminder.departureTime}</span></span>
              <span className="text-outline font-normal">({reminder.minutesBefore} mins before)</span>
            </div>
          </div>

          {/* Smart walking advice text */}
          {reminder.type === 'smart' && (
            <div className="mt-3 bg-primary-container/[0.03] border border-primary/10 rounded-xl p-2.5 text-[11px] flex items-start gap-1.5 font-medium">
              <Footprints className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-on-surface-variant">
                AI predicts a <span className="text-primary font-bold">5 min walk</span>. Alarm dynamically adjusts if Subway Line 4 experiences delayed headways.
              </p>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex flex-col items-end gap-3 justify-between h-full">
          {/* Active indicator */}
          <button
            onClick={() => onToggleStatus(reminder.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
              isTriggered
                ? 'bg-secondary text-white border-secondary'
                : isActive
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-low text-on-surface-variant border-outline-variant/50'
            }`}
          >
            {reminder.status}
          </button>

          {/* Delete action */}
          <button
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/5 transition-all"
            title="Delete Alarm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

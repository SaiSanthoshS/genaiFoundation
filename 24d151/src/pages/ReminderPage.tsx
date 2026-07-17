import React, { useState, useEffect } from 'react';
import { AlarmClock, Check, Plus, Clock, Loader2 } from 'lucide-react';
import { RouteOption, Reminder } from '../types';
import { journeyService } from '../services/journeyService';

interface ReminderPageProps {
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'status'>) => void;
}

export default function ReminderPage({ onAddReminder }: ReminderPageProps) {
  const [reminderRoute, setReminderRoute] = useState<RouteOption | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [reminderType, setReminderType] = useState<'smart' | 'fixed'>('smart');
  const [reminderSuccess, setReminderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    journeyService.searchRoutes('Auto', 'Auto')
      .then(routes => {
        if (routes.length > 0) setReminderRoute(routes[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderRoute) return;

    onAddReminder({
      routeName: reminderRoute.name,
      from: 'My Current Station',
      to: 'My Destination',
      departureTime: reminderRoute.startTime,
      mode: reminderRoute.segments.find(s => s.mode !== 'walk')?.mode || 'subway',
      minutesBefore: reminderMinutes,
      type: reminderType
    });

    setReminderSuccess(true);
    setTimeout(() => {
      setReminderSuccess(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading available paths...</p>
      </div>
    );
  }


  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300 pt-8">
      <div className="glass-card p-6 border border-slate-200 shadow-sm">
        <h4 className="font-bold text-on-surface text-base flex items-center gap-2 mb-3">
          <AlarmClock className="w-5 h-5 text-primary" />
          Configure Departure Reminder
        </h4>

        {reminderRoute ? (
          <form onSubmit={handleSaveReminder} className="space-y-4">
            <div className="bg-surface-low/60 rounded-xl p-3 border border-outline-variant/20 text-xs">
              <span className="text-[10px] text-outline font-semibold block uppercase">Target Journey Route</span>
              <span className="font-bold text-on-surface mt-0.5 block">{reminderRoute.name}</span>
              <span className="text-primary font-bold mt-1 block">Scheduled: {reminderRoute.startTime}</span>
            </div>

            {/* Alarm offset */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Alert Timing Offset
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setReminderMinutes(mins)}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      reminderMinutes === mins
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/50 hover:bg-surface-low text-on-surface-variant'
                    }`}
                  >
                    {mins}m before
                  </button>
                ))}
              </div>
            </div>

            {/* Alarm Type */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Alarm Protocol Strategy
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReminderType('smart')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    reminderType === 'smart'
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-outline-variant/50 hover:bg-surface-low'
                  }`}
                >
                  <span className="block text-xs">AI Smart Alarm</span>
                  <span className="text-[9px] text-outline mt-0.5 block">Adapts to walking pace & line delays</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReminderType('fixed')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    reminderType === 'fixed'
                      ? 'border-outline-variant/50 bg-transparent text-on-surface-variant'
                      : 'border-outline-variant/50 hover:bg-surface-low'
                  }`}
                >
                  <span className="block text-xs">Standard Fixed Alert</span>
                  <span className="text-[9px] text-outline mt-0.5 block">Simple countdown alert only</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              {reminderSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Alarm Scheduled!
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Schedule Alert
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-8 text-on-surface-variant">
            <Clock className="w-8 h-8 text-outline mx-auto mb-2 opacity-55" />
            <p className="text-xs font-semibold leading-relaxed">
              Select any Recommended Route to configure a smart departure alarm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

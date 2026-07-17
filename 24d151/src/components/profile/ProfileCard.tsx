import React, { useState } from 'react';
import { User, Award, Shield, Settings2, Sparkles, MapPin, Check } from 'lucide-react';

interface ProfileCardProps {
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
  onSavePreferences: (prefs: any) => void;
}

export default function ProfileCard({ user, onSavePreferences }: ProfileCardProps) {
  const [walkingSpeed, setWalkingSpeed] = useState('average');
  const [crowdTolerance, setCrowdTolerance] = useState('medium');
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSavePreferences({ walkingSpeed, crowdTolerance, smartAlerts });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Bio / Tier Status */}
      <div className="glass-card p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
        <div className="relative w-24 h-24 mb-4">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
            <img 
              className="w-full h-full object-cover" 
              src={user.avatarUrl} 
              alt={user.name} 
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-primary to-secondary text-white p-1.5 rounded-full shadow-md">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <h3 className="font-bold text-lg text-on-surface">{user.name}</h3>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">{user.email}</p>

        {/* Commuter Level Badges */}
        <div className="mt-4 w-full bg-surface-low/60 rounded-2xl p-4 border border-outline-variant/20">
          <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Eco Commuter Rank</span>
          <span className="text-sm font-bold text-secondary mt-1 block flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4 text-secondary fill-secondary animate-pulse" />
            {user.tier}
          </span>
          
          {/* Progress bar to next tier */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
              <span>Progress to level 4</span>
              <span>{user.points} / 1200 pts</span>
            </div>
            <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: '72%' }} />
            </div>
          </div>
        </div>

        {/* Savings Footprint Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 w-full text-left">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-[10px] text-outline font-semibold block uppercase">CO₂ Mitigation</span>
            <span className="text-lg font-bold text-primary">{user.carbonSaved} kg</span>
          </div>
          <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/10">
            <span className="text-[10px] text-outline font-semibold block uppercase">Total Commute Pts</span>
            <span className="text-lg font-bold text-secondary">{user.points} pts</span>
          </div>
        </div>
      </div>

      {/* Customize AI Preferences Form */}
      <div className="glass-card p-6 border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-on-surface text-base">Commute Comfort Profiles (AI Engine)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Walking Pace Profile */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Commuter Walking Pace
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'relaxed', label: 'Relaxed', speed: '3 km/h' },
                  { id: 'average', label: 'Balanced', speed: '5 km/h' },
                  { id: 'fast', label: 'Fast Pace', speed: '7 km/h' }
                ].map((pace) => (
                  <button
                    key={pace.id}
                    type="button"
                    onClick={() => setWalkingSpeed(pace.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      walkingSpeed === pace.id
                        ? 'border-primary bg-primary/5 text-primary font-bold'
                        : 'border-outline-variant/50 hover:bg-surface-low'
                    }`}
                  >
                    <span className="block text-xs">{pace.label}</span>
                    <span className="text-[9px] text-outline mt-0.5 block">{pace.speed}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Crowd Tolerances */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Crowd Density Tolerance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Seated Only', desc: 'Avoid standing' },
                  { id: 'medium', label: 'Moderate', desc: 'Slight crowd ok' },
                  { id: 'high', label: 'High Yield', desc: 'Fastest always' }
                ].map((crowd) => (
                  <button
                    key={crowd.id}
                    type="button"
                    onClick={() => setCrowdTolerance(crowd.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      crowdTolerance === crowd.id
                        ? 'border-secondary bg-secondary/5 text-secondary font-bold'
                        : 'border-outline-variant/50 hover:bg-surface-low'
                    }`}
                  >
                    <span className="block text-xs">{crowd.label}</span>
                    <span className="text-[9px] text-outline mt-0.5 block">{crowd.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Saved Home Hub
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  defaultValue={user.savedHome}
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-outline-variant text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Saved Work Hub
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  defaultValue={user.savedWork}
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-outline-variant text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
            </div>
          </div>

          {/* Smart Alerts Toggle Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-low/60 border border-outline-variant/20 mt-4">
            <div className="flex gap-2.5 items-start">
              <Shield className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <span className="text-xs font-bold text-on-surface block">Predictive Departure Reminders</span>
                <span className="text-[10px] text-outline">Let AI prompt your phone when walking and transit delay updates occur.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={smartAlerts}
                onChange={() => setSmartAlerts(!smartAlerts)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-md active:scale-95 hover:opacity-90 transition-all"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Preferences Persisted!
              </>
            ) : (
              'Save Commute Profiles'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

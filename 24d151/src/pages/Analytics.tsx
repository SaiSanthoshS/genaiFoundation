import React from 'react';
import AnalyticsCards from '../components/AnalyticsCards';
import Charts from '../components/Charts';
import { AnalyticsData } from '../types';
import { MOCK_ANALYTICS } from '../data';
import { Sparkles, Trophy, Award, Landmark, Flame } from 'lucide-react';

interface AnalyticsProps {
  data?: AnalyticsData;
}

export default function Analytics({ data = MOCK_ANALYTICS }: AnalyticsProps) {
  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface">Commuter Analytics Dashboard</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Real-time carbon auditing, fare cost logs, and modal efficiency breakdown.
          </p>
        </div>
      </div>

      {/* Numerical Analytics Cards Row */}
      <AnalyticsCards data={data} />

      {/* Visual Recharts Charts Section */}
      <Charts data={data} />

      {/* Commuter Achievements Grid */}
      <div className="glass-card p-6 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-on-surface text-base">Carbon Mitigation Badge Accomplishments</h4>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Gamified targets unlocked via public transit commutes compared to driving baseline equivalents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Achievement 1 */}
          <div className="p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3 bg-white/40">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-on-surface">Eco Commuter Tier 3</h5>
              <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold">Saved over 100 kg of CO₂ total.</p>
              <span className="text-[9px] text-green-600 font-bold uppercase mt-1 block tracking-wider">Unlocked ✓</span>
            </div>
          </div>

          {/* Achievement 2 */}
          <div className="p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3 bg-white/40">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-on-surface">4-Day Commute Streak</h5>
              <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold">Rode zero-emission buses or rails.</p>
              <span className="text-[9px] text-primary font-bold uppercase mt-1 block tracking-wider">Active Streak 🔥</span>
            </div>
          </div>

          {/* Achievement 3 */}
          <div className="p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3 bg-white/40">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-on-surface">Transit Veteran Badge</h5>
              <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold">Logged over 300 transit km.</p>
              <span className="text-[9px] text-tertiary-container font-bold uppercase mt-1 block tracking-wider">100% Unlocked</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

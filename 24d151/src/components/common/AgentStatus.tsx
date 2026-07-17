import React from 'react';
import { Activity, ShieldCheck, Wifi, CloudSun, AlertCircle } from 'lucide-react';

interface AgentStatusProps {
  onTimePercentage: number;
  activeDisruptions: number;
  totalLines: number;
}

export default function AgentStatus({ onTimePercentage = 98.4, activeDisruptions = 2, totalLines = 14 }: AgentStatusProps) {
  return (
    <div className="glass-card p-4 md:p-5 shadow-md border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
      {/* Network Health */}
      <div className="flex items-center gap-3 border-r border-outline-variant/20 md:pr-4">
        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Network Health</span>
          <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
            Operational
            <span className="h-2 w-2 rounded-full bg-secondary"></span>
          </span>
        </div>
      </div>

      {/* Punctuality */}
      <div className="flex items-center gap-3 border-r border-outline-variant/20 md:px-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Avg Punctuality</span>
          <span className="text-sm font-bold text-primary">{onTimePercentage}% On-Time</span>
        </div>
      </div>

      {/* Disruptions */}
      <div className="flex items-center gap-3 border-r border-outline-variant/20 md:px-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          activeDisruptions > 0 ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'
        }`}>
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Active Alerts</span>
          <span className={`text-sm font-bold ${activeDisruptions > 0 ? 'text-error' : 'text-secondary'}`}>
            {activeDisruptions} Lines Delayed
          </span>
        </div>
      </div>

      {/* Weather / Feed Sync */}
      <div className="flex items-center gap-3 md:pl-4">
        <div className="w-10 h-10 rounded-xl bg-tertiary-container/10 text-tertiary-container flex items-center justify-center">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Grid Weather</span>
          <span className="text-sm font-bold text-on-surface">74°F • Clear Skies</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { DelayInfo } from '../../types';
import { AlertTriangle, Info, ArrowRight, Sparkles, X, ShieldAlert } from 'lucide-react';

interface DelayAlertProps {
  key?: string;
  delay: DelayInfo;
  onDismiss: (id: string) => void;
  onResolveRoute: (altRouteId: string) => void;
}

export default function DelayAlert({ delay, onDismiss, onResolveRoute }: DelayAlertProps) {
  const getSeverityStyles = (status: 'minor' | 'major' | 'critical') => {
    switch (status) {
      case 'minor':
        return {
          border: 'border-yellow-200 bg-yellow-50/70',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        };
      case 'major':
        return {
          border: 'border-orange-200 bg-orange-50/70',
          text: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-900',
          icon: <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        };
      case 'critical':
        return {
          border: 'border-red-200 bg-red-50/70',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-900',
          icon: <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        };
    }
  };

  const styles = getSeverityStyles(delay.status);

  return (
    <div className={`rounded-2xl border p-5 relative shadow-md transition-all ${styles.border} ${styles.text}`}>
      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(delay.id)}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 transition-all text-outline hover:text-on-surface"
        title="Dismiss Alert"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        {styles.icon}
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm uppercase tracking-wider">{delay.line}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}>
              {delay.status} delay (+{delay.delayMinutes}m)
            </span>
          </div>

          <p className="text-xs font-semibold text-on-surface-variant mt-1">
            Sector: <span className="font-bold">{delay.route}</span>
          </p>
          
          <p className="text-sm font-semibold mt-2">
            Disruption Reason: <span className="font-medium opacity-90">{delay.reason}</span>
          </p>

          {/* AI Reasoning block */}
          <div className="mt-3 bg-white/40 rounded-xl p-3 border border-white/50 text-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Nexus Transit AI Diagnostic
            </div>
            <p className="text-on-surface-variant font-medium leading-relaxed">
              {delay.aiAnalysis}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onResolveRoute(delay.alternativeRouteId)}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              Recalculate Alternate Path
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDismiss(delay.id)}
              className="px-3.5 py-2 border border-outline/30 rounded-xl text-xs font-semibold text-on-surface hover:bg-white/40 transition-all"
            >
              Acknowledge Alert
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Compass, Sparkles, Navigation, ShieldCheck, Leaf, Heart, Radio, Activity } from 'lucide-react';
import AgentStatus from '../components/common/AgentStatus';

interface LandingPageProps {
  onStartPlanning: (from: string, to: string) => void;
  activeDisruptions: number;
}

export default function LandingPage({ onStartPlanning, activeDisruptions }: LandingPageProps) {
  const [quickFrom, setQuickFrom] = useState('');
  const [quickTo, setQuickTo] = useState('');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFrom || !quickTo) return;
    onStartPlanning(quickFrom, quickTo);
  };

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative min-h-[520px] lg:min-h-[600px] flex flex-col items-center justify-center overflow-hidden hero-gradient text-center py-12 px-4 md:px-12">
        <div className="max-w-4xl z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            Empowering Intelligent Urban Mobility
          </span>
          
          <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-none">
            Smart Public Transit <br />
            <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Journey Planner</span>
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Navigate the complexity of modern city grids. Our real-time AI engines process crowds, active delays, and telemetry to build pristine, eco-friendly journeys.
          </p>

          {/* Quick Action Search Bar */}
          <form 
            onSubmit={handleQuickSearch}
            className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/30 shadow-xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                placeholder="From: Grand Central Terminal..."
                value={quickFrom}
                onChange={(e) => setQuickFrom(e.target.value)}
                className="w-full h-11 pl-4 pr-3 text-xs font-semibold text-on-surface bg-surface-low rounded-xl focus:outline-none focus:ring-1 focus:ring-primary border-none"
                required
              />
            </div>
            
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                placeholder="To: Wall Street Plaza..."
                value={quickTo}
                onChange={(e) => setQuickTo(e.target.value)}
                className="w-full h-11 pl-4 pr-3 text-xs font-semibold text-on-surface bg-surface-low rounded-xl focus:outline-none focus:ring-1 focus:ring-primary border-none"
                required
              />
            </div>

            <button
              type="submit"
              className="sm:col-span-2 h-11 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5 fill-white" />
              Plan
            </button>
          </form>

          {/* Preset trigger links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-on-surface-variant">
            <span>Try commute pathways:</span>
            <button 
              onClick={() => onStartPlanning('Grand Central Terminal', 'Wall Street Plaza')}
              className="hover:text-primary transition-all underline decoration-primary/40"
            >
              Grand Central to Wall Street
            </button>
            <span>•</span>
            <button 
              onClick={() => onStartPlanning('Times Square Transit Hub', 'JFK Airport Terminal 4')}
              className="hover:text-primary transition-all underline decoration-primary/40"
            >
              Times Square to JFK Terminal 4
            </button>
          </div>
        </div>
      </section>

      {/* Network Diagnostics Bar */}
      <section className="px-4 md:px-12 max-w-7xl mx-auto">
        <AgentStatus 
          onTimePercentage={98.4} 
          activeDisruptions={activeDisruptions} 
          totalLines={14} 
        />
      </section>

      {/* Highlights / Bento Grid Features */}
      <section className="px-4 md:px-12 max-w-7xl mx-auto space-y-8">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-extrabold text-on-surface">Integrated Premium Transit Features</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Leveraging real-time analytics & neural predictions to build seamless travel layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border border-slate-200 shadow-sm space-y-4 hover:scale-[1.01] transition-transform">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-on-surface">AI Route Planning</h3>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Multi-modal segment optimization prioritizing time schedules, ticket prices, and carbon footprints dynamically.
            </p>
          </div>

          <div className="glass-card p-6 border border-slate-200 shadow-sm space-y-4 hover:scale-[1.01] transition-transform">
            <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-on-surface">Real-Time Delay Anticipation</h3>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Predicting congestion, switch issues, and blockages with over 98% accuracy before you even board.
            </p>
          </div>

          <div className="glass-card p-6 border border-slate-200 shadow-sm space-y-4 hover:scale-[1.01] transition-transform">
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-on-surface">CO₂ Savings Indexing</h3>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Accurately logging saved atmospheric carbon against private vehicle alternatives for ecological tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Informative City Graphics / Quote Block */}
      <section className="px-4 md:px-12 max-w-7xl mx-auto">
        <div className="glass-card p-6 md:p-8 border border-slate-200 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-surface-lowest to-surface-low">
          <div className="flex-1 space-y-4">
            <span className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Smart Transit Vision
            </span>
            <h3 className="text-xl md:text-2xl font-extrabold text-on-surface">Reducing Urban Strain Effortlessly</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed">
              Modern metropolitan centers are complex, kinetic flow systems. Nexus Transit organizes rail, bus, and micromobility segments into one unified golden path, making clean transport the standard.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">450k+</p>
                <p className="text-[10px] text-outline uppercase font-semibold">Active Commuters</p>
              </div>
              <div className="w-px h-8 bg-outline-variant/30" />
              <div className="text-left">
                <p className="text-sm font-bold text-secondary">12,000 tons</p>
                <p className="text-[10px] text-outline uppercase font-semibold">CO₂ Prevented</p>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-80 h-52 rounded-2xl overflow-hidden shadow-md border border-white/30 shrink-0 bg-slate-900 flex items-center justify-center relative">
            <img 
              className="w-full h-full object-cover opacity-70"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT8PvKJVhMXz0rtgk-aA6Hl-2_GND9KcpC-w1zBYgjImrpY4Uvy9BX-BIrZ68Wxovd85Bw4krQ2hE7r9fO-PKcTIK730aTaR800jRppqkxBHgkEVvugGxZySmDyzb3szW0vXtZw-AX25FwZ09Mm2MCydZvWP90fivIp_vA3eP7NCRMhzDuFyFakf4xd1q15Fy6wEIv5KqbzLaV6HIr2nRVMnphKdlOTketRQwi68xn2UI6Izh3ZooKcnqWW3yuFah1Pw5WBGBrObbf"
              alt="Futuristic city transit grid layout illustration"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                Live Grid Sync
              </span>
              <span className="text-[10px] font-bold text-slate-300">98% operational accuracy</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { AnalyticsData } from '../../types';

interface ChartsProps {
  data: AnalyticsData;
}

export default function Charts({ data }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Carbon Footprint vs Baseline (Line / Area Chart) */}
      <div className="glass-card p-6 border border-slate-200 shadow-sm lg:col-span-8 flex flex-col min-h-[380px]">
        <div className="mb-4">
          <h4 className="font-bold text-on-surface text-base">Carbon Mitigation Progress (Weekly)</h4>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Comparing your Nexus Transit carbon output against baseline private driving (kg CO₂).
          </p>
        </div>

        <div className="flex-1 w-full h-[280px] min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.weeklyFootprint}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.05)',
                  fontSize: '12px',
                  fontWeight: 600
                }} 
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Area 
                name="My Optimized Footprint" 
                type="monotone" 
                dataKey="amount" 
                stroke="#2563eb" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
              <Area 
                name="Private Driving Baseline" 
                type="monotone" 
                dataKey="baseline" 
                stroke="#64748b" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#colorBaseline)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transit Mode Split (Pie Chart) */}
      <div className="glass-card p-6 border border-slate-200 shadow-sm lg:col-span-4 flex flex-col min-h-[380px]">
        <div className="mb-4">
          <h4 className="font-bold text-on-surface text-base">Commute Mode Split</h4>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Distribution across multi-modal sectors.
          </p>
        </div>

        <div className="flex-1 w-full h-[220px] min-h-[200px] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.modeUsage}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.modeUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '12px', 
                  border: '1px solid #c3c6d7',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Total Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-8">
            <span className="text-2xl font-bold text-on-surface">100%</span>
            <span className="text-[9px] text-outline uppercase font-semibold tracking-wider">Dynamic mix</span>
          </div>
        </div>

        {/* Customized Legend Labels */}
        <div className="mt-4 space-y-1.5">
          {data.modeUsage.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="text-on-surface font-bold">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

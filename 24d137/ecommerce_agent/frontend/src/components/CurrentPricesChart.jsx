import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function CurrentPricesChart({ results }) {
  if (!results || results.length === 0) return null;

  // Take top 5 for clarity
  const chartData = results.slice(0, 5).map(r => ({
    name: r.store.length > 15 ? r.store.substring(0, 15) + '...' : r.store,
    price: r.total_cost
  }));

  return (
    <div className="glass-panel animate-fade-in mt-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} style={{ color: 'var(--accent-purple)' }} />
        <h2 className="text-xl font-bold">Top 5 Lowest Current Prices</h2>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} interval={0} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Total Cost']}
            />
            <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

export default function PriceHistoryChart({ productId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    
    const fetchHistory = async () => {
      try {
        const resp = await axios.get(`http://localhost:8000/price-history/${encodeURIComponent(productId)}`);
        setData(resp.data);
      } catch (e) {
        console.error("Failed to fetch price history", e);
      }
      setLoading(false);
    };
    
    fetchHistory();
  }, [productId]);

  if (loading) return null;
  if (!data || data.length === 0) return null;

  // Aggregate the data to show Lowest, Average, and Highest prices instead of 40 individual stores
  const aggregatedData = data.map(d => {
    const prices = Object.keys(d)
      .filter(k => k !== 'date')
      .map(k => d[k]);
      
    if (prices.length === 0) return { date: d.date };
    
    return {
      date: d.date,
      'Lowest Price': Math.min(...prices),
      'Average Price': prices.reduce((a, b) => a + b, 0) / prices.length,
      'Highest Price': Math.max(...prices)
    };
  });

  return (
    <div className="glass-panel animate-fade-in mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={20} className="text-blue" />
        <h2 className="text-xl font-bold">Market Price Trends</h2>
      </div>
      <p className="text-muted text-sm mb-6">Tracking the lowest, average, and highest prices across all stores from the first search.</p>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={aggregatedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val.toFixed(0)}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`$${value.toFixed(2)}`]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
            <Line type="monotone" dataKey="Highest Price" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Average Price" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Lowest Price" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

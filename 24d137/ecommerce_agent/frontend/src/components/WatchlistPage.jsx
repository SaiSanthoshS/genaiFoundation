import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, ArrowDown } from 'lucide-react';

export default function WatchlistPage({ userId = 'default_user' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const resp = await axios.get(`http://localhost:8000/watchlist/${userId}`);
      setItems(resp.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="glass-panel animate-fade-in mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} className="text-blue" />
        <h2 className="text-xl font-bold">Your Watchlist</h2>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div>
              <div className="font-bold text-lg">{item.product_id}</div>
              <div className="text-sm text-muted mt-1">Target Threshold: ${item.threshold_price.toFixed(2)}</div>
            </div>
            <div className="text-right flex flex-col items-end justify-center gap-1">
              {item.current_price !== null ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">Current</div>
                    <div className={`font-bold ${item.price_drop_met ? 'text-green text-xl' : 'text-main text-lg'}`}>
                      ${item.current_price.toFixed(2)}
                    </div>
                  </div>
                  {item.price_drop_met && (
                    <div className="badge badge-green flex items-center gap-1" style={{ padding: '0.5rem 0.75rem' }}>
                      <ArrowDown size={16} /> PRICE DROP
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted text-sm">Waiting for data...</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import axios from 'axios';
import { BellPlus } from 'lucide-react';

export default function AddToWatchlist({ productId, currentBestPrice, userId = 'default_user' }) {
  const [threshold, setThreshold] = useState(currentBestPrice ? Math.floor(currentBestPrice * 0.9) : 0);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/watchlist', {
        user_id: userId,
        product_id: productId,
        threshold_price: parseFloat(threshold)
      });
      setAdded(true);
    } catch (e) {
      console.error(e);
      alert("Failed to add to watchlist. Backend might be down.");
    }
    setLoading(false);
  };

  if (added) {
    return (
      <div className="flex items-center justify-center gap-2 text-green mt-4 p-2" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
        <BellPlus size={18} />
        <span>Added to your Watchlist</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-6 pt-4 text-sm" style={{ borderTop: '1px solid var(--border-color)' }}>
      <span className="text-muted">Alert me if price drops below</span>
      <div className="flex items-center gap-1">
        <span className="text-muted font-bold">$</span>
        <input 
          type="number" 
          value={threshold} 
          onChange={e => setThreshold(e.target.value)}
          className="input-glass"
          style={{ width: '100px', padding: '0.4rem 0.5rem', fontSize: '1rem', textAlign: 'center' }}
        />
      </div>
      <button 
        className="btn" 
        style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
        onClick={handleAdd}
        disabled={loading}
      >
        <BellPlus size={16} /> Add Alert
      </button>
    </div>
  );
}

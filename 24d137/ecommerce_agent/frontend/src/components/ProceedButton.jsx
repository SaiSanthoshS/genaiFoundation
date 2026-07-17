import { ShoppingCart, ExternalLink, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';

export default function ProceedButton({ store }) {
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    setLoading(true);
    try {
      const resp = await axios.post('http://localhost:8000/proceed', {
        store_name: store.store,
        product_url: store.url || '',
        product_title: store.title || 'Product'
      });
      
      const { deep_link, message } = resp.data;
      alert(message);
      if (deep_link) {
        window.open(deep_link, '_blank');
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate link.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        className="btn btn-primary" 
        style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
        onClick={handleProceed}
        disabled={loading || !store.url}
      >
        <ShoppingCart size={24} />
        {loading ? 'Processing...' : `Proceed to ${store.store}`}
        <ExternalLink size={18} />
      </button>
      <div className="flex items-center gap-1 mt-2" style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
        <AlertTriangle size={14} />
        <span>By design, checkout and payment are manual. This will open in a new tab.</span>
      </div>
    </div>
  );
}

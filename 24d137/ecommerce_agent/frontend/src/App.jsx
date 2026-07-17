import { useState } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import './index.css';

import PromptBar from './components/PromptBar';
import ComparisonTable from './components/ComparisonTable';
import ExplainerPanel from './components/ExplainerPanel';
import AlternativeCard from './components/AlternativeCard';
import CouponBanner from './components/CouponBanner';
import ProceedButton from './components/ProceedButton';
import PriceHistoryChart from './components/PriceHistoryChart';
import WatchlistPage from './components/WatchlistPage';
import AddToWatchlist from './components/AddToWatchlist';
import CurrentPricesChart from './components/CurrentPricesChart';

function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [preFillPrompt, setPreFillPrompt] = useState('');

  const handleSearch = async (prompt) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setLoadingMessage('Agents are searching across stores and comparing prices...');
    setError('');
    setData(null);
    setPreFillPrompt('');
    try {
      const response = await axios.post('http://localhost:8000/search', { prompt });
      if (response.data.status && response.data.status !== 'success') {
        setError(response.data.message);
      } else {
        setData(response.data);
      }
    } catch (err) {
      setError('Search failed. Ensure the backend is running and try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleImageSearch = async (file) => {
    setLoading(true);
    setLoadingMessage('Identifying product from image...');
    setError('');
    setData(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('http://localhost:8000/search-by-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.status && response.data.status !== 'success') {
        setError(response.data.message);
      } else {
        setData(response.data);
      }
    } catch (err) {
      setError('Image search failed. Ensure the backend is running and try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="text-center mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Search size={28} className="text-blue" />
          Multi-Agent Price Comparator
        </h1>
        <p className="text-muted">AI-powered shopping assistant that finds the real best deals.</p>
      </header>
      
      {!data && !loading && <WatchlistPage />}

      {data?.identified_product && !loading && (
        <div className="glass-panel animate-fade-in mb-4 flex items-center justify-between" style={{ borderLeft: '4px solid var(--accent-purple)', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div>
            <span className="text-muted text-sm uppercase tracking-wide">Identified Image: </span>
            <strong className="text-lg block">{data.identified_product}</strong>
          </div>
          <button 
            className="btn text-sm" 
            style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)' }}
            onClick={() => {
              setPreFillPrompt(data.identified_product);
              setData(null);
            }}
          >
            Not right? Edit text instead
          </button>
        </div>
      )}

      <PromptBar onSearch={handleSearch} onImageSearch={handleImageSearch} loading={loading} initialPrompt={preFillPrompt} />

      {error && <div className="glass-panel animate-fade-in mt-4" style={{ borderLeft: '4px solid var(--accent-red)' }}><p className="text-main" style={{ color: '#fca5a5' }}>{error}</p></div>}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 mt-8 animate-fade-in" style={{ padding: '3rem' }}>
          <style>{"@keyframes spin { 100% { transform: rotate(360deg); } }"}</style>
          <Loader2 size={48} className="text-blue" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-muted">{loadingMessage}</p>
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-col gap-4 mt-4 animate-fade-in">
          {data.explanation && <ExplainerPanel explanation={data.explanation} />}
          
          {data.coupon_applied && <CouponBanner store={data.winning_store} />}

          {!data.viable && data.alternative_results?.length > 0 && (
            <AlternativeCard results={data.alternative_results} originalQuery={data.original_query} />
          )}

          {(data.ranked_results?.length > 0 || data.alternative_results?.length > 0) && (
            <>
              <CurrentPricesChart 
                results={data.viable ? data.ranked_results : data.alternative_results} 
              />
              <ComparisonTable 
                results={data.viable ? data.ranked_results : data.alternative_results} 
              />
            </>
          )}
          
          <PriceHistoryChart productId={data.original_query} />

          {(data.winning_store?.store) && (
            <div className="glass-panel mt-4">
               <ProceedButton store={data.winning_store} />
               <AddToWatchlist 
                 productId={data.original_query} 
                 currentBestPrice={data.winning_store.total_cost} 
               />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

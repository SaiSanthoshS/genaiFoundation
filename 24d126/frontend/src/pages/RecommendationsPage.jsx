import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations } from '../api';
import { Sparkles, Loader } from 'lucide-react';

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations()
      .then(setRecommendations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Sparkles color="var(--accent)" /> Recommendations Shelf
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
        Curated just for you by the Agent, based on themes from books you have completed.
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
           <Loader className="animate-spin" size={40} />
        </div>
      ) : (
        <div className="grid-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent)' }}></div>
              <h3 style={{ marginTop: 0 }}>{rec.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{rec.reason}</p>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => navigate(`/search?q=${encodeURIComponent(rec.title)}`)}
              >
                Search this Book
              </button>
            </div>
          ))}
          {recommendations.length === 0 && <p>No recommendations available. Complete some books first!</p>}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;

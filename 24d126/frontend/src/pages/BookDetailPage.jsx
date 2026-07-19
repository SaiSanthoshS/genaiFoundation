import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getBookDetails } from '../api';
import { BookOpen, AlertCircle, Loader } from 'lucide-react';

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchData = location.state?.searchData || {};
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getBookDetails(id);
        // Merge the search data (like ia_id) with the backend details
        setBook({ ...searchData, ...data, has_full_text: !!searchData.ia_id || data.has_full_text });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><Loader className="animate-spin" size={40} /></div>;
  if (!book) return <div>Book not found.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        &larr; Back to Search
      </button>

      <div className="glass-card" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
           <div style={{ width: '100%', height: '350px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Cover Placeholder
           </div>
        </div>
        
        <div style={{ flex: '2', minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1>{book.title}</h1>
            {book.has_full_text && (
              <span className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>Free Edition</span>
            )}
          </div>
          
          <div style={{ marginTop: '1rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="var(--accent)" />
              Agent Analysis: {book.readability?.score}
            </h3>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)' }}>{book.readability?.reason}</p>
          </div>

          <p style={{ lineHeight: '1.8', color: 'var(--text-muted)' }}>
            {book.description || 'No description available for this book.'}
          </p>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            {book.has_full_text && (
              <button 
                className="btn btn-primary" 
                onClick={() => navigate(`/read/${id}`, { state: { book } })}
                style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
              >
                <BookOpen size={20} style={{ marginRight: '0.75rem' }} />
                Read Online
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;

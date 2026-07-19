import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchBooks } from '../api';
import { Search as SearchIcon, Loader } from 'lucide-react';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const books = await searchBooks(searchQuery);
      setResults(books);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query });
  };

  return (
    <div>
      <h1>Library Search</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Search for books, authors, or genres. The AI Agent will fetch and analyze the results.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. The Lord of the Rings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader className="animate-spin" size={20} /> : <SearchIcon size={20} />}
          <span style={{ marginLeft: '0.5rem' }}>Search</span>
        </button>
      </form>

      <div className="grid-3">
        {results.map((book) => (
          <div key={book.id} className="glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/book/${book.id.replace('works/', '')}`, { state: { searchData: book } })}>
            {book.cover_i ? (
              <img 
                src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`} 
                alt={book.title} 
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
              />
            ) : (
              <div style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No Cover
              </div>
            )}
            <h3>{book.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{book.author}</p>
            {book.ebook_access !== 'no_ebook' && (
              <span className="badge badge-success" style={{ marginTop: '0.5rem' }}>Digital Edition</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;

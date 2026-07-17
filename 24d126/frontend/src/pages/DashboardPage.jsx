import { useState, useEffect } from 'react';
import { getDashboard } from '../api';
import { Activity, Flame, BookOpen } from 'lucide-react';

const DashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Progress Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Track your reading journey. Agent-tracked stats are updated automatically.
      </p>

      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <BookOpen size={32} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>{data.pages_read}</h2>
            <span style={{ color: 'var(--text-muted)' }}>Pages Read</span>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <Flame size={32} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>{data.reading_streak}</h2>
            <span style={{ color: 'var(--text-muted)' }}>Day Streak</span>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <Activity size={32} color="#10b981" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>{data.reading_speed}</h2>
            <span style={{ color: 'var(--text-muted)' }}>Est. Speed</span>
          </div>
        </div>
      </div>

      <h2>Current Books</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.books_progress.map(book => (
          <div key={book.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>{book.title}</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Status: {book.status}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>{book.pages_read} / {book.total_pages}</span>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pages</div>
            </div>
          </div>
        ))}
        {data.books_progress.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No books started yet.</p>}
      </div>
    </div>
  );
};

export default DashboardPage;

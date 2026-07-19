import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { saveBookmark, updateProgress } from '../api';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';

const OnlineReaderPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const book = location.state?.book || { title: 'Unknown', subjects: [] };
  
  const [chapter, setChapter] = useState(1);
  const totalChapters = 5; // Simulated
  
  // Simulated chapter text
  const chapterText = `This is the simulated text for chapter ${chapter} of ${book.title}. 
  Since the full raw text of books is restricted by copyright, we are simulating the reading experience. 
  You can highlight any part of this text to trigger the agent to save a bookmark.`;

  useEffect(() => {
    // Agent tracks pages read
    updateProgress({
      book_id: `works/${id}`,
      title: book.title,
      pages_read: chapter * 20, // simulate 20 pages per chapter
      total_pages: totalChapters * 20,
      themes: book.subjects || []
    }).catch(console.error);
  }, [chapter, id, book]);

  const handleHighlight = async () => {
    const selection = window.getSelection().toString();
    if (selection) {
      try {
        await saveBookmark({
          book_id: `works/${id}`,
          chapter_index: chapter,
          highlight_text: selection,
          note: 'Highlighted by user'
        });
        alert('Agent saved bookmark!');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          &larr; Exit Reader
        </button>
        <h2 style={{ margin: 0 }}>{book.title} - Chapter {chapter}</h2>
        <button onClick={handleHighlight} className="btn btn-primary" title="Highlight text then click to save">
          <Bookmark size={20} style={{ marginRight: '0.5rem' }} /> Save Highlight
        </button>
      </div>

      {book.ia_id ? (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '70vh', background: 'transparent' }}>
          <iframe 
            src={`https://archive.org/embed/${book.ia_id}?ui=embed`} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen
            title="Internet Archive Book Reader"
          ></iframe>
        </div>
      ) : (
        <>
          <div 
            className="glass-card" 
            style={{ fontSize: '1.2rem', lineHeight: '2', padding: '3rem', minHeight: '50vh', background: 'rgba(15, 23, 42, 0.9)', color: 'white' }}
          >
            {chapterText}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setChapter(c => Math.max(1, c - 1))}
              disabled={chapter === 1}
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              {chapter} / {totalChapters}
            </span>
            <button 
              className="btn btn-secondary" 
              onClick={() => setChapter(c => Math.min(totalChapters, c + 1))}
              disabled={chapter === totalChapters}
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OnlineReaderPage;

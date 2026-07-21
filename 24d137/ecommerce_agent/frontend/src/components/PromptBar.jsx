import { useState, useRef, useEffect } from 'react';
import { Search, ImagePlus } from 'lucide-react';

export default function PromptBar({ onSearch, onImageSearch, loading, initialPrompt }) {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(prompt);
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageSearch(file);
      e.target.value = ''; // reset
    }
  };

  return (
    <div className="glass-panel">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          className="input-glass flex-1"
          placeholder="e.g., cheapest 128GB iPhone 15 with fast shipping"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
        <button 
          type="button" 
          className="btn" 
          style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem' }}
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          title="Search by image"
        >
          <ImagePlus size={24} style={{ color: 'var(--accent-purple)' }} />
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || !prompt.trim()}>
          <Search size={20} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
}

import { Sparkles } from 'lucide-react';

export default function ExplainerPanel({ explanation }) {
  return (
    <div className="glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={20} style={{ color: 'var(--accent-purple)' }}/>
        <h2 className="text-lg font-bold">AI Recommendation</h2>
      </div>
      <p style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>{explanation}</p>
    </div>
  );
}

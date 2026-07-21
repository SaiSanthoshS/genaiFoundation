import { AlertCircle } from 'lucide-react';

export default function AlternativeCard({ results, originalQuery }) {
  return (
    <div className="glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--accent-red)' }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--accent-red)' }}>
        <AlertCircle size={20} />
        <h2 className="text-lg font-bold">No Exact Matches Found</h2>
      </div>
      <p className="mb-4">
        We couldn't find viable results for <strong className="text-main">"{originalQuery}"</strong>. 
        Here are some substitute suggestions that might work for you:
      </p>
    </div>
  );
}

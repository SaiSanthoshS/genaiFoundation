import React from 'react';
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center mb-6 shadow-sm border border-outline-variant/30">
        <Compass className="w-8 h-8 text-on-surface-variant" />
      </div>
      <h1 className="text-3xl font-extrabold text-on-surface mb-2">Route Not Found</h1>
      <p className="text-on-surface-variant max-w-md mx-auto mb-8 text-sm leading-relaxed">
        We couldn't track down the location you're looking for. The link might be broken or the page may have been moved.
      </p>
      <Link 
        to="/"
        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}

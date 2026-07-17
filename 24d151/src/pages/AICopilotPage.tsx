import React from 'react';
import CopilotPanel from '../components/common/CopilotPanel';

export default function AICopilotPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-in fade-in duration-300">
      <div className="w-full max-w-lg">
        {/* We use a mock container to show the panel content since it's normally a drawer */}
        <h2 className="text-2xl font-extrabold text-on-surface mb-6 text-center">AI Copilot Dashboard</h2>
        <div className="relative h-[600px] border border-outline-variant/30 rounded-3xl overflow-hidden shadow-xl">
          <CopilotPanel 
            isOpen={true} 
            onClose={() => {}} 
            onSelectSuggestedRoute={() => {}} 
          />
        </div>
      </div>
    </div>
  );
}

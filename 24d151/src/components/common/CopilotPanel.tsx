import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { INITIAL_CHAT } from '../../data';
import { Send, Sparkles, X, Compass, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react';

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestedRoute: (from: string, to: string) => void;
}

export default function CopilotPanel({ isOpen, onClose, onSelectSuggestedRoute }: CopilotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI Copilot Response
    setTimeout(() => {
      let replyText = "I've analyzed your request. Let me calculate optimal paths in real-time.";
      let suggestions: string[] = [];

      const query = text.toLowerCase();
      if (query.includes('jfk') || query.includes('airport')) {
        replyText = "I found an excellent multi-modal transit recommendation for JFK Airport Terminal 4 using the E Subway Line & JFK AirTrain. This path has a 96% AI confidence score, saves approximately 5.8kg of CO2, and has nominal crowds on inbound airtrain coaches. Would you like me to populate this path on your Planner?";
        suggestions = ['Populate JFK Route in Planner', 'Check JFK Delay Status'];
      } else if (query.includes('delay') || query.includes('disruption')) {
        replyText = "There are currently 3 active disruptions in our municipal sector: Subway Line 4 experiences minor 3-minute signals delays, and Bus 104 is heavily bottlenecked with a 14-minute delay on Broadway. I recommend taking Subway Line 4 over Bus 104 as delays are minor and stabilizing.";
        suggestions = ['Recalculate Wall Street routes', 'View active delay alerts'];
      } else if (query.includes('carbon') || query.includes('saving') || query.includes('footprint')) {
        replyText = "Fantastic progress! Your weekly carbon savings total 118.4 kg, which is the ecological equivalent of planting 6.2 trees. Your highest carbon mitigation day was Wednesday, where you walked 0.4km and rode Subway Line 4 instead of driving.";
        suggestions = ['View detailed analytics dashboard', 'Share eco badge on profile'];
      } else if (query.includes('populate jfk') || query.includes('populate')) {
        replyText = "Done! I have auto-configured the journey planning engine to map routes from Manhattan Transit hub to JFK Airport Terminal 4.";
        onSelectSuggestedRoute('Times Square Transit Hub', 'JFK Airport Terminal 4');
        suggestions = ['Track JFK route live', 'View JFK details'];
      } else {
        replyText = "I understand you are planning a commute. I recommend opening our main Journey Planner and selecting 'Prioritize Eco Footprint' to see options with high reliability and carbon offset scores. What stations are you traveling between?";
        suggestions = ['Times Square to JFK Airport', 'Grand Central to Wall Street'];
      }

      const copilotMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'copilot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

      setMessages((prev) => [...prev, copilotMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white">Transit Copilot</h3>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5 block">
              Gemini Optimization Agent • V2.4
            </span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-900 transition-all text-slate-400 hover:text-white border border-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            {/* Sender bubble */}
            <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
            }`}>
              {msg.sender === 'copilot' ? (
                <span>
                  {/* Highlight key terms in cyan */}
                  {msg.text.split(/(jfk|e subway|airtrain|96%|5\.8kg|line 3|subway line 4|bus 104|14-minute|118\.4 kg|6\.2 trees|prioritize eco footprint)/gi).map((part, idx) => {
                    const lower = part.toLowerCase();
                    if (['jfk', 'e subway', 'airtrain', '96%', '5.8kg', 'line 3', 'subway line 4', 'bus 104', '14-minute', '118.4 kg', '6.2 trees', 'prioritize eco footprint'].includes(lower)) {
                      return <span key={idx} className="text-cyan-400 font-semibold">{part}</span>;
                    }
                    return part;
                  })}
                </span>
              ) : (
                msg.text
              )}
            </div>

            <span className="text-[9px] text-slate-500 mt-1 font-semibold">
              {msg.timestamp}
            </span>

            {/* Quick action suggestions */}
            {msg.suggestions && (
              <div className="mt-2.5 flex flex-col gap-2 w-full">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Quick Actions</span>
                {msg.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-800 text-xs font-medium text-slate-200 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold pl-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            AI Copilot is optimizing paths...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Copilot: 'Find routes to JFK'..."
            className="flex-1 h-11 px-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 hover:bg-blue-700 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <span className="text-[10px] text-slate-500 text-center block mt-2.5 font-medium tracking-wide">
          Powered by DeepMind Transit Graph Engine • Systems Nominal
        </span>
      </div>

    </div>
  );
}

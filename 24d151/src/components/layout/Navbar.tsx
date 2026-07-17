import React, { useState } from 'react';
import { Compass, Bell, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenCopilot: () => void;
  alertCount: number;
}

export default function Navbar({ onOpenCopilot, alertCount }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/journey-planner', label: 'Journey Planner' },
    { path: '/live-journey', label: 'Live Journey' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/profile', label: 'Profile & History' }
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 h-16 bg-surface/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3 cursor-pointer">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
          <Compass className="w-5 h-5 text-white animate-spin-slow" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-primary tracking-tight leading-none">Nexus Transit</span>
          <span className="text-[10px] font-medium text-secondary tracking-wide uppercase leading-none mt-1">Smart Urban Flow</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={`relative py-1 text-sm font-medium transition-all duration-300 hover:text-primary ${
              currentPath === item.path
                ? 'text-primary font-semibold'
                : 'text-on-surface-variant'
            }`}
          >
            {item.label}
            {currentPath === item.path && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      {/* Right Side Controls */}
      <div className="flex items-center gap-4">
        {/* Alerts / Notifications */}
        <button 
          onClick={() => navigate('/delay-alert')}
          className="relative p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 active:scale-95"
          title="Transit Delay Alerts"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-white text-[9px] font-bold ring-2 ring-white">
              {alertCount}
            </span>
          )}
        </button>

        {/* AI Copilot Badge Trigger */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-all duration-300 active:scale-95 shadow-sm"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></span>
          AI Copilot
        </button>

        {/* User Profile Avatar */}
        <Link 
          to="/profile"
          className="w-8 h-8 rounded-full bg-primary-container overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-300 shadow-sm"
        >
          <img 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRpeh3FwXI2pyJCqAg3gPWOcfZ-Jc5xHgIHtpwFIBrkw70_-Kx_ENXW2zZhpD6oiAAQ69P2hB473h3H2lc6T4Qm3MUfJw31L-G9JzRYAeYGHeSjItfwRTB1VSH9QR9gzn84VpHXGitezaS29KCr6kQgaOBZgoVMcKU3cR_iocKWYzdm-eIJhuwQik3wF66dEDixQBkx75oVT-t2stbN03UkRr7-_HXpj55NMcwwtaH2gJFW-WFlXtsxXvOE4l1VS6ZMyTUioGpMjg7"
            alt="User profile"
          />
        </Link>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-on-surface hover:text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-outline-variant/30 px-6 py-4 flex flex-col gap-4 md:hidden shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  currentPath === item.path
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
            <button 
              onClick={() => {
                onOpenCopilot();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm flex items-center justify-center gap-2"
            >
              Consult AI Copilot
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

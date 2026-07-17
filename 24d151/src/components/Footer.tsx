import React from 'react';
import { Compass, Mail, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full py-8 mt-12 px-6 md:px-12 bg-surface-container-lowest border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-on-surface">Nexus Transit AI</span>
        </div>
        <p className="text-on-surface-variant text-xs text-center md:text-left">
          © 2026 Nexus Transit. All rights reserved. Intelligent Modernism in Motion.
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-6">
        <a href="#privacy" className="text-on-surface-variant text-xs hover:text-primary transition-all">Privacy Policy</a>
        <a href="#terms" className="text-on-surface-variant text-xs hover:text-primary transition-all">Terms of Service</a>
        <a href="#api" className="text-on-surface-variant text-xs hover:text-primary transition-all">API Access</a>
        <a href="#help" className="text-on-surface-variant text-xs hover:text-primary transition-all flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-error fill-error" /> Support
        </a>
      </div>
    </footer>
  );
}

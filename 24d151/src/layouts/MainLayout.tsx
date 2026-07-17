import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CopilotPanel from '../components/common/CopilotPanel';

interface MainLayoutProps {
  alertCount: number;
  copilotOpen: boolean;
  onOpenCopilot: () => void;
  onCloseCopilot: () => void;
  onSelectSuggestedRoute: (fromStation: string, toStation: string) => void;
}

export default function MainLayout({ 
  alertCount, 
  copilotOpen,
  onOpenCopilot,
  onCloseCopilot,
  onSelectSuggestedRoute
}: MainLayoutProps) {
  return (
    <>
      <Navbar 
        onOpenCopilot={onOpenCopilot}
        alertCount={alertCount}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 pt-24 pb-8">
        <Outlet />
      </main>
      
      {/* Floating AI Assistant Copilot Drawer overlay */}
      <CopilotPanel
        isOpen={copilotOpen}
        onClose={onCloseCopilot}
        onSelectSuggestedRoute={onSelectSuggestedRoute}
      />
      
      <Footer />
    </>
  );
}

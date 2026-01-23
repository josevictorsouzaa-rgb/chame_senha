import React, { useState, useEffect } from 'react';
import { SellerDashboard } from './components/SellerDashboard';
import { TVDisplay } from './components/TVDisplay';
import { ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'display' | 'vendedor'>('display');

  useEffect(() => {
    // Simple URL routing logic
    const path = window.location.pathname;
    if (path.includes('/balcao')) {
      setCurrentView('vendedor');
    } else {
      setCurrentView('display');
    }
  }, []);

  const goHome = () => {
    // In a real router we would push history, here we reload to root to mimic "home" or just switch view if logic allows
    window.location.href = '/';
  };

  if (currentView === 'vendedor') {
    return (
      <div className="relative">
        <SellerDashboard />
      </div>
    );
  }

  // Default to TV Display
  return (
    <div className="relative">
      {/* Hidden clickable area top-left to switch to balcao manually if needed for debug */}
      <div 
          onClick={() => window.location.href = '/balcao'} 
          className="fixed top-0 left-0 w-8 h-8 z-50 cursor-pointer opacity-0"
          title="Ir para Balcão"
      ></div>
      <TVDisplay />
    </div>
  );
};

export default App;
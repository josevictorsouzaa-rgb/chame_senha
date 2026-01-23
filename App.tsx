import React, { useState, useEffect } from 'react';
import { SellerDashboard } from './components/SellerDashboard';
import { TVDisplay } from './components/TVDisplay';
import { Users, MonitorPlay } from 'lucide-react';

const App: React.FC = () => {
  const [route, setRoute] = useState<string>('');

  useEffect(() => {
    // Simple hash routing
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setRoute(hash);
    };

    // Set initial
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Route: Display
  if (route === 'display') {
    return <TVDisplay />;
  }

  // Route: Seller
  if (route === 'vendedor') {
    return <SellerDashboard />;
  }

  // Landing Page (Selection)
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">AutoParts Queue</h1>
          <p className="text-gray-500">Selecione o modo de operação deste terminal</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <a href="#vendedor" className="group block">
            <div className="bg-gray-900 hover:bg-indigo-900/20 border border-gray-800 hover:border-indigo-500/50 p-6 rounded-2xl transition-all flex items-center gap-6">
              <div className="bg-indigo-600 p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">Painel do Vendedor</h3>
                <p className="text-sm text-gray-500">Controle de chamadas e ajustes</p>
              </div>
            </div>
          </a>

          <a href="#display" className="group block">
            <div className="bg-gray-900 hover:bg-emerald-900/20 border border-gray-800 hover:border-emerald-500/50 p-6 rounded-2xl transition-all flex items-center gap-6">
              <div className="bg-emerald-600 p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                <MonitorPlay className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Display TV</h3>
                <p className="text-sm text-gray-500">Modo de exibição pública (Som + Voz)</p>
              </div>
            </div>
          </a>
        </div>
        
        <p className="text-xs text-gray-700 pt-8">
          Certifique-se de iniciar o servidor backend (node server.js)
        </p>
      </div>
    </div>
  );
};

export default App;
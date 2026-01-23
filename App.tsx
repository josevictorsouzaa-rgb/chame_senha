import React, { useState } from 'react';
import { SellerDashboard } from './components/SellerDashboard';
import { TVDisplay } from './components/TVDisplay';
import { Users, MonitorPlay, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'display' | 'vendedor'>('home');

  // Helper to go back to home (passed as prop if needed, or used in wrapper)
  const goHome = () => setCurrentView('home');

  if (currentView === 'display') {
    return (
      <div className="relative">
        {/* Hidden back button area for demo purposes - top left corner */}
        <div 
            onClick={goHome} 
            className="fixed top-0 left-0 w-16 h-16 z-50 cursor-pointer opacity-0 hover:opacity-20 bg-white"
            title="Voltar ao Menu"
        ></div>
        <TVDisplay />
      </div>
    );
  }

  if (currentView === 'vendedor') {
    return (
      <div className="relative">
        <button 
          onClick={goHome}
          className="fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
          title="Voltar ao Menu"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <SellerDashboard />
      </div>
    );
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
          <button 
            onClick={() => setCurrentView('vendedor')}
            className="group block w-full text-left"
          >
            <div className="bg-gray-900 hover:bg-indigo-900/20 border border-gray-800 hover:border-indigo-500/50 p-6 rounded-2xl transition-all flex items-center gap-6">
              <div className="bg-indigo-600 p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">Painel do Vendedor</h3>
                <p className="text-sm text-gray-500">Controle de chamadas e ajustes</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('display')}
            className="group block w-full text-left"
          >
            <div className="bg-gray-900 hover:bg-emerald-900/20 border border-gray-800 hover:border-emerald-500/50 p-6 rounded-2xl transition-all flex items-center gap-6">
              <div className="bg-emerald-600 p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                <MonitorPlay className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Display TV</h3>
                <p className="text-sm text-gray-500">Modo de exibição pública (Som + Voz)</p>
              </div>
            </div>
          </button>
        </div>
        
        <p className="text-xs text-gray-700 pt-8">
          Certifique-se de iniciar o servidor backend (node server.js)
        </p>
      </div>
    </div>
  );
};

export default App;
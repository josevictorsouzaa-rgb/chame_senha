import React, { useState, useEffect } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Monitor, Volume2, RotateCcw, ArrowRight, Settings, AlertCircle } from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  const { isConnected, queueState, actions } = useQueueSocket();
  const [deskId, setDeskId] = useState<string>('01');
  const [manualInput, setManualInput] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Load saved desk ID from local storage
  useEffect(() => {
    const saved = localStorage.getItem('deskId');
    if (saved) setDeskId(saved);
  }, []);

  const handleDeskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDeskId(val);
    localStorage.setItem('deskId', val);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput) {
      actions.updateNumber(parseInt(manualInput, 10));
      setManualInput('');
      setIsEditing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium">Conectando ao servidor...</p>
          <p className="text-sm text-gray-400">Certifique-se que o server.js está rodando na porta 3001</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
              <Monitor className="w-6 h-6" />
              Painel do Vendedor
            </h1>
            <p className="text-gray-500 text-sm mt-1">Controle de Senhas - Autopeças</p>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <label className="text-sm text-gray-400">Meu Balcão:</label>
            <input 
              type="text" 
              value={deskId} 
              onChange={handleDeskChange}
              className="bg-transparent border-b-2 border-indigo-500 text-center w-16 text-xl font-bold focus:outline-none focus:border-indigo-300"
            />
          </div>
        </header>

        {/* Main Control Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Current Status Card */}
          <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-4">Senha Atual</h2>
            <div className="text-8xl md:text-9xl font-mono font-bold text-white mb-2 tracking-tighter">
              {String(queueState.currentTicket).padStart(3, '0')}
            </div>
            <div className="text-indigo-400 font-medium">
              Última chamada: {queueState.lastCalledDesk ? `Balcão ${queueState.lastCalledDesk}` : '-'}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 flex flex-col justify-center">
            
            <button 
              onClick={() => actions.callNext(deskId)}
              className="group relative w-full bg-indigo-600 hover:bg-indigo-500 text-white p-8 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between overflow-hidden"
            >
              <div className="flex flex-col items-start z-10">
                <span className="text-3xl font-bold">Chamar Próxima</span>
                <span className="text-indigo-200 opacity-80">Próxima: {String(queueState.currentTicket + 1).padStart(3, '0')}</span>
              </div>
              <ArrowRight className="w-12 h-12 text-indigo-300 group-hover:translate-x-2 transition-transform z-10" />
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={actions.recallCurrent}
                className="bg-gray-800 hover:bg-gray-700 text-white p-6 rounded-2xl border border-gray-700 transition-colors flex flex-col items-center justify-center gap-2 group"
              >
                <Volume2 className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Rechamar</span>
              </button>

              <button 
                onClick={actions.revertPrevious}
                className="bg-gray-800 hover:bg-gray-700 text-white p-6 rounded-2xl border border-gray-700 transition-colors flex flex-col items-center justify-center gap-2 group"
              >
                <RotateCcw className="w-8 h-8 text-rose-400 group-hover:-rotate-180 transition-transform duration-500" />
                <span className="font-semibold">Voltar/Corrigir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync / Manual Adjustment */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Sincronização Manual
            </h3>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-indigo-400 transition-colors"
            >
              {isEditing ? 'Cancelar' : 'Ajustar Número'}
            </button>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleManualSubmit} className="flex gap-4 items-end">
               <div className="flex-1">
                 <label className="block text-xs text-gray-500 mb-1">Definir numeração para:</label>
                 <input 
                   type="number" 
                   value={manualInput}
                   onChange={(e) => setManualInput(e.target.value)}
                   className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none"
                   placeholder="Ex: 50"
                   autoFocus
                 />
               </div>
               <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
               >
                 Salvar
               </button>
            </form>
          ) : (
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Use esta opção apenas para alinhar o sistema com a senha de papel física em mãos.
            </p>
          )}
        </div>
        
        {/* Recent History Preview */}
        <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Histórico Recente</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {queueState.history.slice(0, 5).map((t, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex justify-between items-center opacity-75">
                  <span className="font-mono text-xl font-bold">{String(t.number).padStart(3, '0')}</span>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Balcão {t.desk}</span>
                </div>
              ))}
            </div>
        </div>

      </div>
    </div>
  );
};
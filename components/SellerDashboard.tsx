import React, { useState, useEffect } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { 
  Monitor, Volume2, RotateCcw, ArrowRight, Settings, 
  LogOut, UserCircle, History, BarChart3, TrendingUp,
  Clock, AlertTriangle, Hash
} from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  const { isConnected, queueState, currentUser, actions } = useQueueSocket();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Modals/Inputs
  const [showRetroactive, setShowRetroactive] = useState(false);
  const [retroNumber, setRetroNumber] = useState('');

  // Service Timer
  useEffect(() => {
    if (!currentUser?.stats.lastCallTime) return;
    
    const interval = setInterval(() => {
      const start = currentUser.stats.lastCallTime || Date.now();
      const seconds = Math.floor((Date.now() - start) / 1000);
      setElapsedTime(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser?.stats.lastCallTime, queueState.currentTicket]); // Reset when ticket changes

  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await actions.login({ username, password });
    if (!res.success) setLoginError(res.message || 'Erro ao entrar');
  };

  const handleRetroactive = (e: React.FormEvent) => {
    e.preventDefault();
    if (retroNumber) {
        actions.callSpecific(parseInt(retroNumber), true);
        setShowRetroactive(false);
        setRetroNumber('');
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
         <div className="bg-gray-900 w-full max-w-md p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
            
            <div className="text-center mb-8">
               <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                  <UserCircle className="w-8 h-8 text-amber-500" />
               </div>
               <h1 className="text-2xl font-tech font-bold text-white tracking-widest uppercase">Login Vendedor</h1>
               <p className="text-gray-500 text-sm mt-2">Acesso ao AutoParts System</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Usuário</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="Seu usuário"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="••••••"
                />
              </div>

              {loginError && (
                 <div className="text-red-400 text-xs bg-red-900/20 p-3 rounded border border-red-900/50 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {loginError}
                 </div>
              )}

              <button 
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded uppercase tracking-wider transition-all mt-4"
              >
                Acessar Painel
              </button>

              <div className="text-center mt-6">
                <p className="text-xs text-gray-600">Usuários teste: vendedor1 / 123</p>
              </div>
            </form>
         </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-carbon-900 text-white font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR (Desktop) / TOPBAR (Mobile) */}
      <aside className="bg-gray-900 border-r border-gray-800 w-full md:w-64 flex-shrink-0 flex flex-col justify-between">
         <div className="p-6">
            <h1 className="text-xl font-tech font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-8">
               <Monitor className="w-5 h-5 text-amber-500" />
               AutoParts
            </h1>
            
            <div className="mb-8">
               <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Vendedor</div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                     <span className="font-bold text-amber-500">{currentUser.desk}</span>
                  </div>
                  <div>
                     <div className="font-bold text-white">{currentUser.name}</div>
                     <div className="text-xs text-green-500 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Online
                     </div>
                  </div>
               </div>
            </div>

            <nav className="space-y-2">
               <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800/50 text-amber-500 rounded border-l-2 border-amber-500 font-medium text-sm">
                  <BarChart3 className="w-4 h-4" /> Painel de Chamadas
               </button>
               {/* Placeholders for future routes */}
               <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors text-sm">
                  <History className="w-4 h-4" /> Histórico Completo
               </button>
            </nav>
         </div>

         <div className="p-4 border-t border-gray-800">
             <button onClick={actions.logout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm transition-colors w-full px-4 py-2">
                <LogOut className="w-4 h-4" /> Sair do Sistema
             </button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
         
         {/* Top Stats Row */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700/50">
               <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Meus Atendimentos (Hoje)</div>
               <div className="text-3xl font-tech font-bold text-white">{currentUser.stats.today}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700/50">
               <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Meus Atendimentos (Mês)</div>
               <div className="text-3xl font-tech font-bold text-gray-300">{currentUser.stats.month}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700/50">
               <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Total Loja (Hoje)</div>
               <div className="text-3xl font-tech font-bold text-amber-500">{queueState.stats.totalCallsToday}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700/50 relative overflow-hidden">
               <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Tempo de Atendimento</div>
               <div className={`text-3xl font-mono font-bold ${elapsedTime > 600 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatTime(elapsedTime)}
               </div>
               <div className="absolute right-4 top-4 opacity-10">
                  <Clock className="w-12 h-12" />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[600px]">
            
            {/* CONTROLLER (Left - 2 Cols) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
               
               {/* Main Call Button */}
               <button 
                  onClick={actions.callNext}
                  className="flex-1 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-3xl shadow-2xl shadow-amber-900/20 border border-amber-500/30 p-8 flex flex-col items-center justify-center gap-4 group transition-all transform hover:scale-[1.01] active:scale-[0.99]"
               >
                  <span className="text-amber-200/80 text-sm font-bold uppercase tracking-[0.2em]">Próximo Cliente</span>
                  <div className="flex items-center gap-6">
                     <span className="text-8xl font-tech font-bold group-hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all">
                        {String(queueState.currentTicket + 1).padStart(3, '0')}
                     </span>
                     <ArrowRight className="w-20 h-20 opacity-50 group-hover:opacity-100 group-hover:translate-x-4 transition-all" />
                  </div>
                  <div className="mt-4 bg-black/20 px-4 py-1 rounded-full text-xs font-mono text-amber-100/60">
                     Clique para chamar e iniciar contagem
                  </div>
               </button>

               {/* Secondary Actions */}
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-32">
                  <button 
                    onClick={actions.recallCurrent}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                     <Volume2 className="w-6 h-6" />
                     <span className="text-xs font-bold uppercase">Rechamar Atual</span>
                  </button>

                  <button 
                    onClick={() => setShowRetroactive(true)}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                     <Hash className="w-6 h-6" />
                     <span className="text-xs font-bold uppercase">Senha Retroativa</span>
                  </button>

                  <button 
                    onClick={actions.revertPrevious}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                     <RotateCcw className="w-6 h-6" />
                     <span className="text-xs font-bold uppercase">Corrigir Erro</span>
                  </button>
               </div>
            </div>

            {/* QUEUE VISUALIZER (Right - 1 Col) */}
            <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 flex flex-col">
               <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Fluxo da Loja
               </h3>

               <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  {queueState.history.slice(0, 8).map((t, i) => (
                     <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 ? 'bg-amber-900/10 border-amber-500/30' : 'bg-gray-800/50 border-gray-700/50'}`}>
                        <div className="flex items-center gap-3">
                           <div className={`text-xl font-tech font-bold ${i === 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                              {String(t.number).padStart(3, '0')}
                           </div>
                           {t.isRetroactive && (
                              <span className="text-[10px] bg-gray-700 px-1 rounded text-gray-300">RETRO</span>
                           )}
                        </div>
                        <div className="text-right">
                           <div className="text-xs text-gray-300 font-bold">Balcão {t.desk}</div>
                           <div className="text-[10px] text-gray-600">{t.caller || 'Sistema'}</div>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="mt-6 pt-6 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                     <span>Tempo Médio Loja</span>
                     <span>{formatTime(queueState.stats.averageServiceTime)}/atend</span>
                  </div>
                  {/* Fake Progress bar for visual */}
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                     <div className="bg-gray-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
               </div>
            </div>
         </div>
      </main>

      {/* MODAL RETROACTIVE */}
      {showRetroactive && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 w-full max-w-sm p-6 rounded-2xl border border-gray-700 shadow-2xl">
               <h3 className="text-lg font-bold text-white mb-4">Chamar Senha Retroativa</h3>
               <p className="text-sm text-gray-400 mb-6">Isso exibirá a senha na TV sem alterar a contagem principal da fila.</p>
               
               <form onSubmit={handleRetroactive}>
                  <input 
                     type="number" 
                     value={retroNumber}
                     onChange={e => setRetroNumber(e.target.value)}
                     className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-2xl font-tech font-bold text-center text-white focus:border-amber-500 outline-none mb-6"
                     placeholder="000"
                     autoFocus
                  />
                  <div className="flex gap-3">
                     <button 
                        type="button" 
                        onClick={() => setShowRetroactive(false)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold text-sm"
                     >
                        Cancelar
                     </button>
                     <button 
                        type="submit" 
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-bold text-sm"
                     >
                        Chamar
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};
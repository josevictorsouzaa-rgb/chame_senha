import React, { useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { 
  LogOut, 
  TrendingUp, Clock, Users,
  RotateCcw, ArrowRight, Repeat,
  LayoutDashboard
} from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  const { isConnected, queueState, currentUser, actions } = useQueueSocket();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await actions.login({ username, password });
    if (!res.success) setLoginError(res.message || 'Erro ao entrar');
  };

  // --- LOGIN SCREEN (Clean & Minimal) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
         <div className="bg-white w-full max-w-sm rounded-3xl shadow-soft p-10 border border-slate-100">
            <div className="mb-10 text-center">
               <div className="w-12 h-12 bg-primary-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <LayoutDashboard className="text-white w-6 h-6" />
               </div>
               <h1 className="text-2xl font-display font-bold text-slate-900">Bem-vindo</h1>
               <p className="text-slate-500 text-sm mt-2">Acesse seu terminal de atendimento</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">Usuário</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-medium focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                  placeholder="Seu ID"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-medium focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                  placeholder="••••••"
                />
              </div>

              {loginError && (
                 <div className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-lg">
                    {loginError}
                 </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/10 transition-transform active:scale-[0.98] mt-4"
              >
                Entrar
              </button>
            </form>
         </div>
      </div>
    );
  }

  // --- DASHBOARD (Modern SaaS Style) ---
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 flex flex-col">
      
      {/* HEADER */}
      <nav className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-20">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
               Q
            </div>
            <span className="font-display font-bold text-slate-800 tracking-tight">QueueMaster</span>
         </div>
         
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
               <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-primary-600 shadow-sm border border-slate-100">
                  {currentUser.desk}
               </div>
               <span className="text-sm font-semibold text-slate-700 pr-2">{currentUser.name}</span>
            </div>
            <button 
               onClick={actions.logout} 
               className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
               title="Sair"
            >
               <LogOut className="w-5 h-5" />
            </button>
         </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 flex flex-col lg:flex-row gap-8">
         
         {/* LEFT: PRIMARY ACTIONS (60%) */}
         <div className="flex-[3] flex flex-col gap-8">
            
            {/* METRICS ROW */}
            <div className="grid grid-cols-3 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                     <Users className="w-4 h-4" /> Meus Clientes
                  </div>
                  <div className="text-3xl font-display font-bold text-slate-800">{currentUser.stats.today}</div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                     <TrendingUp className="w-4 h-4" /> Total Loja
                  </div>
                  <div className="text-3xl font-display font-bold text-slate-800">{queueState.stats.totalCallsToday}</div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                     <Clock className="w-4 h-4" /> Tempo Médio
                  </div>
                  <div className="text-3xl font-display font-bold text-slate-800">
                     {Math.round(queueState.stats.averageServiceTime / 60)}<span className="text-sm text-slate-400 ml-1 font-medium">min</span>
                  </div>
               </div>
            </div>

            {/* HERO ACTION CARD */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-soft p-8 lg:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
               {/* Decorative bg gradient */}
               <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500"></div>

               <div className="mb-12">
                  <p className="text-slate-400 font-medium uppercase tracking-widest text-xs mb-3">Atendendo Agora</p>
                  <div className="text-7xl lg:text-9xl font-display font-bold text-slate-900 tracking-tighter leading-none">
                     {String(queueState.currentTicket).padStart(3, '0')}
                  </div>
               </div>

               <button 
                  onClick={actions.callNext}
                  className="group relative w-full max-w-md bg-slate-900 hover:bg-primary-600 text-white rounded-2xl p-4 pr-6 pl-8 flex items-center justify-between transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-primary-600/30 transform hover:-translate-y-1"
               >
                  <div className="flex flex-col items-start">
                     <span className="text-xs font-semibold text-slate-400 group-hover:text-primary-200 uppercase tracking-wider">Próxima Senha</span>
                     <span className="text-4xl font-display font-bold">
                        {String(queueState.currentTicket + 1).padStart(3, '0')}
                     </span>
                  </div>
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors">
                     <ArrowRight className="w-6 h-6" />
                  </div>
               </button>

               <button 
                  onClick={actions.revertPrevious}
                  className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 hover:bg-slate-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
               >
                  <RotateCcw className="w-4 h-4" />
                  Desfazer
               </button>
            </div>

         </div>

         {/* RIGHT: HISTORY (40%) */}
         <div className="flex-[2] bg-white rounded-3xl border border-slate-100 shadow-soft flex flex-col overflow-hidden h-[600px] lg:h-auto">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 text-sm">Histórico Recente</h3>
               <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">Últimos 15</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
               {queueState.history.slice(0, 15).map((ticket, i) => {
                  const isMine = ticket.desk === currentUser.desk;
                  return (
                     <div key={i} className={`
                        group flex items-center justify-between p-3 rounded-xl transition-all border border-transparent
                        ${i === 0 ? 'bg-primary-50/50 border-primary-100' : 'hover:bg-slate-50 hover:border-slate-100'}
                     `}>
                        <div className="flex items-center gap-4">
                           <div className={`
                              text-xl font-display font-bold w-12 text-center
                              ${i === 0 ? 'text-primary-600' : 'text-slate-700'}
                           `}>
                              {String(ticket.number).padStart(3, '0')}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-500 uppercase">Balcão {ticket.desk}</span>
                              {isMine && <span className="text-[10px] font-bold text-primary-600">Você</span>}
                           </div>
                        </div>

                        <button 
                           onClick={() => actions.callSpecific(ticket.number, true)}
                           className="opacity-0 group-hover:opacity-100 text-xs font-bold text-slate-500 hover:text-primary-600 hover:bg-white px-3 py-2 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100 flex items-center gap-2"
                        >
                           <Repeat className="w-3 h-3" /> Rechamar
                        </button>
                     </div>
                  );
               })}
               {queueState.history.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                     <LayoutDashboard className="w-8 h-8 mb-2 opacity-50" />
                     <p className="text-sm">Sem chamadas hoje</p>
                  </div>
               )}
            </div>
         </div>

      </main>
    </div>
  );
};
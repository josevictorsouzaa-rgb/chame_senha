import React, { useState, useEffect } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { 
  LogOut, TrendingUp, Clock, Users,
  RotateCcw, ChevronRight, Megaphone,
  Monitor, AlertCircle, Settings, 
  Menu, X, CheckCircle, AlertTriangle,
  BarChart3, Trophy, Calendar, LayoutDashboard,
  Music, Play, Pause, Square, Link as LinkIcon, Volume2,
  SkipForward, SkipBack, ListMusic
} from 'lucide-react';
import { AnalyticsData } from '../types';

// --- SHARED COMPONENTS ---

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirmar",
  isDanger = false 
}: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
             {isDanger ? (
                <div className="p-2 bg-red-100 rounded-full text-red-600"><AlertTriangle className="w-6 h-6" /></div>
             ) : (
                <div className="p-2 bg-blue-100 rounded-full text-brand-600"><AlertCircle className="w-6 h-6" /></div>
             )}
             <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </div>
        <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded transition-colors">Cancelar</button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`px-4 py-2 text-white font-bold text-sm rounded shadow-sm transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfigModal = ({ isOpen, onClose, onConfirm, current }: any) => {
  const [val, setVal] = useState(current);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 border border-slate-200">
         <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            Ajuste Manual
         </h3>
         <p className="text-sm text-slate-500 mb-4">
            Digite o número da <strong>última senha</strong> chamada. A próxima chamada será N+1.
         </p>
         <input 
            type="number" 
            value={val} 
            onChange={e => setVal(Number(e.target.value))}
            className="w-full border-2 border-slate-300 rounded-lg p-3 text-2xl font-mono font-bold text-center focus:border-brand-500 outline-none mb-6"
         />
         <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button onClick={() => { onConfirm(val); onClose(); }} className="flex-1 py-3 text-white font-bold bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md">Salvar</button>
         </div>
      </div>
    </div>
  );
};

// --- MUSIC PLAYER COMPONENT (SIMPLIFIED) ---
const MusicController = ({ musicState, onSetMusic, onCommand }: any) => {
   const [url, setUrl] = useState('');
   const [loading, setLoading] = useState(false);

   const extractId = (link: string) => {
      const vidReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const vidMatch = link.match(vidReg);
      return (vidMatch && vidMatch[2].length === 11) ? vidMatch[2] : null;
   };

   const handlePlay = async () => {
      const videoId = extractId(url);
      if (!videoId) return;
      
      setLoading(true);
      try {
         let title = 'Vídeo do YouTube';
         let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

         try {
            const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            const data = await res.json();
            title = data.title || title;
            thumbnail = data.thumbnail_url || thumbnail;
         } catch(e) {}
         
         onSetMusic({
            videoId: videoId,
            title: title,
            thumbnail: thumbnail,
            isPlaying: true,
            volume: 50
         });
         setUrl('');
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onSetMusic({ volume: Number(e.target.value) });
   };

   const hasActiveMedia = !!musicState.videoId;

   return (
      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-5 mt-6">
         <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
            <Music className="w-4 h-4 text-pink-600" />
            Som Ambiente (TV)
         </h3>

         {hasActiveMedia ? (
            <div className="flex flex-col gap-4">
               {/* Display Current Track Info */}
               <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <img src={musicState.thumbnail} className="w-16 h-16 rounded-lg object-cover bg-slate-200 shadow-sm" />
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-slate-900 truncate">{musicState.title}</p>
                     <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        {musicState.isPlaying ? (
                           <span className="text-green-600 font-bold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Reproduzindo
                           </span>
                        ) : (
                           <span className="text-slate-400 font-medium">Pausado</span>
                        )}
                     </p>
                  </div>
                  <button 
                     onClick={() => onSetMusic({ videoId: null, isPlaying: false })}
                     className="p-2 bg-red-50 hover:bg-red-100 rounded-full text-red-600 transition-colors"
                     title="Parar e Remover"
                  >
                     <Square className="w-5 h-5" />
                  </button>
               </div>

               {/* Remote Controls */}
               <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={() => {
                            if (musicState.isPlaying) onCommand('pause');
                            else onCommand('play');
                        }} 
                        className={`flex items-center justify-center p-4 rounded-xl shadow-md active:scale-95 transition-all ${musicState.isPlaying ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                        {musicState.isPlaying ? <span className="flex items-center gap-2 font-bold"><Pause className="w-5 h-5" /> PAUSAR</span> : <span className="flex items-center gap-2 font-bold"><Play className="w-5 h-5" /> TOCAR</span>}
                    </button>
               </div>
               
               {/* Volume Control */}
               <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 border border-slate-100">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     value={musicState.volume || 50} 
                     onChange={handleVolumeChange}
                     className="flex-1 accent-brand-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500 w-8 text-right">{musicState.volume || 50}%</span>
               </div>
            </div>
         ) : (
            <div className="flex gap-2">
               <input 
                  type="text" 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Cole o link do YouTube..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand-500 outline-none"
               />
               <button 
                  disabled={!url || loading}
                  onClick={handlePlay}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
               >
                  {loading ? '...' : <Play className="w-4 h-4" />}
               </button>
            </div>
         )}
      </div>
   );
};

// --- ANALYTICS VIEW COMPONENT ---
const AnalyticsView = ({ fetchAnalytics, name }: { fetchAnalytics: any, name: string }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics(setData);
  }, [fetchAnalytics]);

  if (!data) return <div className="p-8 text-center text-slate-500">Carregando indicadores...</div>;

  const maxVal = Math.max(...data.user.monthlyHistory.map(m => m.count), 1);

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full bg-slate-50">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Indicadores de Performance
         </h2>
         <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">Ano Atual</span>
      </div>

      {/* STORE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Loja (Histórico)</p>
                <p className="text-2xl font-mono font-bold text-slate-900 mt-1">{data.store.totalCalls}</p>
                <p className="text-xs text-slate-400 mt-1">Chamadas registradas no sistema</p>
             </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dia Recorde da Loja</p>
                <div className="flex items-baseline gap-2 mt-1">
                   <p className="text-2xl font-mono font-bold text-slate-900">{data.store.busiestDay.count}</p>
                   <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      {data.store.busiestDay.date}
                   </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Maior volume diário</p>
             </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Volume Hoje (Loja)</p>
                <p className="text-2xl font-mono font-bold text-slate-900 mt-1">{data.store.callsToday}</p>
             </div>
         </div>
      </div>

      <div className="h-px bg-slate-200"></div>

      {/* INDIVIDUAL STATS */}
      <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
         <Trophy className="w-5 h-5 text-amber-500" />
         Performance Individual: <span className="text-brand-600">{name}</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Trophy className="w-24 h-24" />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider relative z-10">Seu Recorde Pessoal</p>
            <p className="text-4xl font-mono font-bold mt-2 relative z-10">{data.user.bestDay.count}</p>
            <p className="text-sm text-slate-300 mt-1 relative z-10 font-medium">em {data.user.bestDay.date}</p>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Mês Atual</p>
             <p className="text-3xl font-mono font-bold text-slate-900 mt-2">{data.user.totalMonth}</p>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Anual</p>
             <p className="text-3xl font-mono font-bold text-slate-900 mt-2">{data.user.totalAnnual}</p>
         </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
         <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-6">Volume Mensal (Este Ano)</h4>
         
         <div className="flex items-end justify-between h-48 gap-2">
            {data.user.monthlyHistory.map((stat, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-slate-100 rounded-t-lg relative h-full flex items-end overflow-hidden">
                     <div 
                        className="w-full bg-brand-500 group-hover:bg-brand-400 transition-all duration-500 rounded-t-sm"
                        style={{ height: `${(stat.count / maxVal) * 100}%` }}
                     ></div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase">{stat.month}</span>
                  <span className="text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-white px-1 rounded shadow-sm border border-slate-100">
                     {stat.count}
                  </span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export const SellerDashboard: React.FC = () => {
  const { isConnected, queueState, currentUser, actions } = useQueueSocket();
  
  // App View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics'>('dashboard');

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDesk, setSelectedDesk] = useState('01');
  const [loginError, setLoginError] = useState('');

  // Interaction States
  const [modalType, setModalType] = useState<'none' | 'confirmCall' | 'confirmRecall' | 'confirmRevert' | 'config'>('none');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await actions.login({ username, password, desk: selectedDesk });
    if (!res.success) setLoginError(res.message || 'Erro ao entrar');
  };

  // --- LOGIN SCREEN (Enhanced with Desk Selector) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
         <div className="bg-white w-full max-w-md shadow-2xl shadow-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-900 p-8 text-center border-b border-slate-800 relative overflow-hidden">
               <div className="absolute inset-0 bg-brand-900/20 z-0"></div>
               <div className="relative z-10">
                  <Monitor className="w-10 h-10 text-brand-500 mx-auto mb-3" />
                  <h1 className="text-2xl font-bold text-white tracking-tight">AutoParts<span className="text-brand-400">Pro</span></h1>
                  <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-semibold">Acesso Restrito</p>
               </div>
            </div>

            <form onSubmit={handleLogin} className="p-8 space-y-5">
              
              <div className="grid grid-cols-1 gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ID Operador</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-medium focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all"
                  placeholder="Seu usuário"
                />
              </div>

              <div className="grid grid-cols-1 gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-medium focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all"
                  placeholder="••••••"
                />
              </div>

              <div className="grid grid-cols-1 gap-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selecione seu Balcão</label>
                 <select 
                    value={selectedDesk} 
                    onChange={e => setSelectedDesk(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:border-brand-600 outline-none cursor-pointer hover:border-brand-400 transition-colors"
                 >
                    {['01', '02', '03', '04', '05'].map(num => (
                       <option key={num} value={num}>Balcão {num}</option>
                    ))}
                 </select>
              </div>

              {loginError && (
                 <div className="flex items-start gap-3 text-red-700 bg-red-50 p-4 rounded-lg border border-red-100 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {loginError}
                 </div>
              )}

              <button 
                type="submit"
                className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-4 rounded-lg shadow-lg shadow-brand-900/10 transition-transform active:scale-[0.98] uppercase tracking-wide text-sm mt-4 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Iniciar Turno
              </button>
            </form>
         </div>
      </div>
    );
  }

  // --- MAIN APP (Sidebar Layout) ---
  return (
    <div className="h-screen bg-slate-100 font-sans text-slate-900 flex overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
         <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <span className="font-bold text-lg tracking-tight">AutoParts<span className="text-brand-500">Pro</span></span>
         </div>

         <div className="p-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
               <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Operador</div>
               <div className="font-bold text-lg leading-tight truncate">{currentUser.name}</div>
               <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-1 bg-brand-900 text-brand-300 rounded text-xs font-bold border border-brand-700">
                     Balcão {currentUser.desk}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online"></span>
               </div>
            </div>

            <nav className="space-y-2">
               <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`w-full px-3 py-2 rounded text-sm font-medium flex items-center gap-3 transition-colors text-left
                     ${currentView === 'dashboard' ? 'bg-slate-800/50 text-white border-l-2 border-brand-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                  `}
               >
                  <LayoutDashboard className="w-4 h-4" /> Painel Principal
               </button>

               <button 
                  onClick={() => setCurrentView('analytics')}
                  className={`w-full px-3 py-2 rounded text-sm font-medium flex items-center gap-3 transition-colors text-left
                     ${currentView === 'analytics' ? 'bg-slate-800/50 text-white border-l-2 border-brand-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                  `}
               >
                  <BarChart3 className="w-4 h-4" /> Indicadores
               </button>
               
               <div className="h-px bg-slate-800 my-2"></div>

               <button 
                  onClick={() => setModalType('config')}
                  className="w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-sm font-medium flex items-center gap-3 transition-colors text-left"
               >
                  <Settings className="w-4 h-4" /> Ajuste Manual
               </button>
            </nav>
         </div>

         <div className="mt-auto p-6 border-t border-slate-800">
            <button 
               onClick={actions.logout} 
               className="w-full flex items-center justify-center gap-2 py-3 border border-red-900/50 text-red-400 hover:bg-red-900/20 rounded font-bold text-sm uppercase transition-colors"
            >
               <LogOut className="w-4 h-4" /> Encerrar Turno
            </button>
         </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
         
         {/* Top Bar Stats (Always visible in dashboard, optional in analytics but kept for consistency) */}
         <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <div className="flex gap-8">
                <div className="flex items-center gap-3">
                   <Users className="w-5 h-5 text-slate-400" />
                   <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Atendimentos</span>
                      <span className="font-mono font-bold text-slate-800 text-lg">{currentUser.stats.today}</span>
                   </div>
                </div>
                <div className="w-px h-8 bg-slate-100 my-auto"></div>
                <div className="flex items-center gap-3">
                   <TrendingUp className="w-5 h-5 text-slate-400" />
                   <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Total Loja</span>
                      <span className="font-mono font-bold text-slate-800 text-lg">{queueState.stats.totalCallsToday}</span>
                   </div>
                </div>
            </div>
            <div className="text-xs text-slate-400 font-mono">
               {new Date().toLocaleDateString()}
            </div>
         </header>

         {/* Workspace */}
         {currentView === 'dashboard' ? (
            <div className="flex-1 p-8 flex gap-8 overflow-hidden bg-slate-50">
               {/* ACTION CENTER */}
               <div className="flex-[3] flex flex-col gap-6">
                  
                  {/* Big Card */}
                  <div className="bg-white rounded-xl shadow-card border border-slate-200 flex-1 flex flex-col relative overflow-hidden">
                     <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                           <Monitor className="w-4 h-4 text-brand-600" />
                           Status da Fila
                        </h2>
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">
                           Sistema Operante
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-10 relative">
                           <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">Senha em Atendimento</p>
                           <div className="text-[9rem] leading-none font-sans font-bold text-slate-900 tracking-tighter drop-shadow-sm">
                              {String(queueState.currentTicket).padStart(3, '0')}
                           </div>
                           {queueState.lastCalledDesk && (
                              <div className="absolute -right-24 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-start opacity-50">
                                  <span className="text-[10px] uppercase font-bold">No Balcão</span>
                                  <span className="text-2xl font-bold font-mono">{queueState.lastCalledDesk}</span>
                              </div>
                           )}
                        </div>

                        <div className="w-full max-w-3xl grid grid-cols-5 gap-4">
                           {/* RECALL */}
                           <button 
                              onClick={() => setModalType('confirmRecall')}
                              className="col-span-2 flex flex-col items-center justify-center p-6 bg-white border-2 border-amber-200 hover:border-amber-400 text-amber-700 rounded-xl hover:shadow-lg transition-all active:scale-[0.99] group"
                           >
                              <Megaphone className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                              <span className="font-bold text-lg uppercase tracking-tight">Rechamar</span>
                              <span className="text-xs font-medium opacity-70">Tocar som novamente</span>
                           </button>

                           {/* CALL NEXT */}
                           <button 
                              onClick={() => setModalType('confirmCall')}
                              className="col-span-3 flex flex-col items-center justify-center p-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-action shadow-brand-500/30 transition-all active:scale-[0.99] group relative border border-brand-500"
                           >  
                              <div className="absolute top-4 right-4 bg-brand-800/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-brand-200 border border-brand-500/50">
                                 PRÓX: {String(queueState.currentTicket + 1).padStart(3, '0')}
                              </div>
                              <ChevronRight className="w-12 h-12 mb-2 group-hover:translate-x-2 transition-transform" />
                              <span className="font-bold text-2xl uppercase tracking-wide">Chamar Próximo</span>
                           </button>
                        </div>
                     </div>

                     <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                         <button 
                            onClick={() => setModalType('confirmRevert')}
                            className="flex items-center gap-2 text-slate-400 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
                         >
                            <RotateCcw className="w-4 h-4" /> Desfazer Última Ação
                         </button>
                     </div>
                  </div>
               </div>

               {/* HISTORY & MUSIC SIDEBAR */}
               <div className="flex-[1.5] flex flex-col gap-6">
                   {/* MUSIC CONTROLLER */}
                   <MusicController musicState={queueState.music} onSetMusic={actions.setMusic} onCommand={actions.sendPlayerCommand} />

                   <div className="flex-1 bg-white rounded-xl shadow-card border border-slate-200 flex flex-col overflow-hidden">
                      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                         <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Histórico</h3>
                         <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">Últimos 15</span>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 sticky top-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                               <tr>
                                  <th className="px-5 py-2">Senha</th>
                                  <th className="px-5 py-2">Mesa</th>
                                  <th className="px-5 py-2 text-right"></th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                               {queueState.history.slice(0, 15).map((ticket, index) => {
                                  const isMine = ticket.desk === currentUser.desk;
                                  const isCurrent = index === 0;
                                  return (
                                     <tr key={index} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-brand-50/40' : ''}`}>
                                        <td className="px-5 py-3">
                                           <span className={`font-mono font-bold text-lg ${isCurrent ? 'text-brand-600' : 'text-slate-700'}`}>
                                              {String(ticket.number).padStart(3, '0')}
                                           </span>
                                        </td>
                                        <td className="px-5 py-3">
                                           <div className="flex flex-col">
                                              <span className="text-sm font-bold text-slate-600">{ticket.desk}</span>
                                              {isMine && <span className="text-[10px] text-brand-600 font-bold uppercase">Você</span>}
                                           </div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                           <button 
                                              onClick={() => actions.callSpecific(ticket.number, true)}
                                              className="text-slate-300 hover:text-brand-600 p-2 hover:bg-brand-50 rounded transition-all"
                                              title="Rechamar"
                                           >
                                              <Megaphone className="w-4 h-4" />
                                           </button>
                                        </td>
                                     </tr>
                                  );
                               })}
                            </tbody>
                         </table>
                         {queueState.history.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-xs uppercase font-medium">
                               Sem chamadas hoje
                            </div>
                         )}
                      </div>
                   </div>
               </div>
            </div>
         ) : (
            <AnalyticsView fetchAnalytics={actions.getAnalytics} name={currentUser.name} />
         )}
      </main>

      {/* --- MODALS --- */}
      <ConfirmModal 
         isOpen={modalType === 'confirmCall'}
         onClose={() => setModalType('none')}
         onConfirm={actions.callNext}
         title="Chamar Próxima Senha"
         description={`Confirma a chamada da senha ${String(queueState.currentTicket + 1).padStart(3, '0')}? Certifique-se que o atendimento anterior foi finalizado.`}
         confirmText="Sim, Chamar"
      />
      <ConfirmModal 
         isOpen={modalType === 'confirmRecall'}
         onClose={() => setModalType('none')}
         onConfirm={actions.recallCurrent}
         title="Rechamar Senha Atual"
         description="Isso tocará o sinal sonoro novamente na TV. Confirma?"
         confirmText="Rechamar"
      />
      <ConfirmModal 
         isOpen={modalType === 'confirmRevert'}
         onClose={() => setModalType('none')}
         onConfirm={actions.revertPrevious}
         title="Desfazer Ação"
         description="Isso voltará a contagem para a senha anterior. Use apenas em caso de erro de clique."
         confirmText="Desfazer"
         isDanger={true}
      />
      <ConfigModal
         isOpen={modalType === 'config'}
         onClose={() => setModalType('none')}
         onConfirm={actions.setTicketNumber}
         current={queueState.currentTicket}
      />

    </div>
  );
};

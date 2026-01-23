import React, { useState, useEffect } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { 
  LogOut, TrendingUp, Clock, Users,
  RotateCcw, ChevronRight, Megaphone,
  Monitor, AlertCircle, Settings, 
  Menu, X, CheckCircle, AlertTriangle,
  BarChart3, Trophy, Calendar, LayoutDashboard,
  Music, Play, Pause, Volume2
} from 'lucide-react';
import { AnalyticsData } from '../types';

// --- SHARED COMPONENTS ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmText = "Confirmar", isDanger = false }: any) => {
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
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-white font-bold text-sm rounded shadow-sm transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}>{confirmText}</button>
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
         <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-500" /> Ajuste Manual</h3>
         <p className="text-sm text-slate-500 mb-4">Digite o número da <strong>última senha</strong> chamada.</p>
         <input type="number" value={val} onChange={e => setVal(Number(e.target.value))} className="w-full border-2 border-slate-300 rounded-lg p-3 text-2xl font-mono font-bold text-center focus:border-brand-500 outline-none mb-6" />
         <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button onClick={() => { onConfirm(val); onClose(); }} className="flex-1 py-3 text-white font-bold bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md">Salvar</button>
         </div>
      </div>
    </div>
  );
};

const MusicModal = ({ isOpen, onClose, currentMusic, setMusic }: any) => {
    const [url, setUrl] = useState('');
    const [vol, setVol] = useState(currentMusic?.volume || 50);

    const handleSave = () => {
        let videoId = currentMusic.videoId;
        let title = currentMusic.title;
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            try {
                if (url.includes('list=')) {
                    videoId = url.split('list=')[1].split('&')[0]; // Extract List ID is safer but API uses 'listType' usually. For simple embed, we pass list as videoId param if using listType playlist.
                    // For simplicity in Iframe API, 'playlist' param takes comma separated IDs OR a list ID if listType is set.
                    // Let's assume user pastes a VIDEO ID or VIDEO URL.
                } 
                if (url.includes('v=')) {
                    videoId = url.split('v=')[1].split('&')[0];
                } else if (url.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1].split('?')[0];
                }
                title = 'Link Personalizado';
            } catch (e) { console.error(e); }
        }

        setMusic({ videoId, volume: vol, title, isPlaying: true });
        onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Music className="w-5 h-5 text-brand-500" /> Rádio TV</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Link do YouTube (Vídeo ou Playlist)</label>
                        <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:border-brand-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Volume2 className="w-4 h-4"/> Volume TV ({vol}%)</label>
                        <input type="range" min="0" max="100" value={vol} onChange={e => setVol(Number(e.target.value))} className="w-full mt-2 accent-brand-600" />
                    </div>
                    <div className="flex gap-2 pt-2">
                         <button onClick={() => setMusic({ isPlaying: !currentMusic.isPlaying })} className={`flex-1 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 ${currentMusic.isPlaying ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                             {currentMusic.isPlaying ? <><Pause className="w-4 h-4"/> Pausar TV</> : <><Play className="w-4 h-4"/> Tocar TV</>}
                         </button>
                    </div>
                </div>

                <div className="flex gap-2 mt-6 border-t pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-lg">Fechar</button>
                    <button onClick={handleSave} className="flex-1 py-3 text-white font-bold bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md">Carregar Link</button>
                </div>
            </div>
        </div>
    );
};

const AnalyticsView = ({ fetchAnalytics, name }: { fetchAnalytics: any, name: string }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  useEffect(() => { fetchAnalytics(setData); }, [fetchAnalytics]);
  if (!data) return <div className="p-8 text-center text-slate-500">Carregando indicadores...</div>;
  const maxVal = Math.max(...data.user.monthlyHistory.map(m => m.count), 1);
  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full bg-slate-50">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-brand-600" /> Indicadores de Performance</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-6 h-6" /></div>
             <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Loja</p><p className="text-2xl font-mono font-bold text-slate-900 mt-1">{data.store.totalCalls}</p></div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
             <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dia Recorde</p><div className="flex items-baseline gap-2 mt-1"><p className="text-2xl font-mono font-bold text-slate-900">{data.store.busiestDay.count}</p><span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{data.store.busiestDay.date}</span></div></div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Calendar className="w-6 h-6" /></div>
             <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hoje (Loja)</p><p className="text-2xl font-mono font-bold text-slate-900 mt-1">{data.store.callsToday}</p></div>
         </div>
      </div>
    </div>
  );
};

export const SellerDashboard: React.FC = () => {
  const { isConnected, queueState, currentUser, actions } = useQueueSocket();
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics'>('dashboard');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDesk, setSelectedDesk] = useState('01');
  const [loginError, setLoginError] = useState('');
  const [modalType, setModalType] = useState<'none' | 'confirmCall' | 'confirmRecall' | 'confirmRevert' | 'config' | 'music'>('none');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await actions.login({ username, password, desk: selectedDesk });
    if (!res.success) setLoginError(res.message || 'Erro ao entrar');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
         <div className="bg-white w-full max-w-md shadow-2xl shadow-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-900 p-8 text-center border-b border-slate-800 relative overflow-hidden">
               <div className="absolute inset-0 bg-brand-900/20 z-0"></div>
               <div className="relative z-10">
                  <Monitor className="w-10 h-10 text-brand-500 mx-auto mb-3" />
                  <h1 className="text-2xl font-bold text-white tracking-tight">AutoParts<span className="text-brand-400">Pro</span></h1>
               </div>
            </div>
            <form onSubmit={handleLogin} className="p-8 space-y-5">
              <div className="grid grid-cols-1 gap-1"><label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ID Operador</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none" placeholder="Seu usuário" /></div>
              <div className="grid grid-cols-1 gap-1"><label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Senha</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none" placeholder="••••••" /></div>
              <div className="grid grid-cols-1 gap-1"><label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Balcão</label><select value={selectedDesk} onChange={e => setSelectedDesk(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 font-bold outline-none">{['01', '02', '03', '04', '05'].map(num => (<option key={num} value={num}>Balcão {num}</option>))}</select></div>
              {loginError && <div className="text-red-700 bg-red-50 p-4 rounded-lg text-sm font-medium">{loginError}</div>}
              <button type="submit" className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-4 rounded-lg shadow-lg uppercase tracking-wide text-sm mt-4 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Iniciar Turno</button>
            </form>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 font-sans text-slate-900 flex overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
         <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950"><span className="font-bold text-lg tracking-tight">AutoParts<span className="text-brand-500">Pro</span></span></div>
         <div className="p-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6"><div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Operador</div><div className="font-bold text-lg leading-tight truncate">{currentUser.name}</div><div className="mt-3 flex items-center gap-2"><span className="px-2 py-1 bg-brand-900 text-brand-300 rounded text-xs font-bold border border-brand-700">Balcão {currentUser.desk}</span></div></div>
            <nav className="space-y-2">
               <button onClick={() => setCurrentView('dashboard')} className={`w-full px-3 py-2 rounded text-sm font-medium flex items-center gap-3 transition-colors text-left ${currentView === 'dashboard' ? 'bg-slate-800/50 text-white border-l-2 border-brand-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><LayoutDashboard className="w-4 h-4" /> Painel Principal</button>
               <button onClick={() => setCurrentView('analytics')} className={`w-full px-3 py-2 rounded text-sm font-medium flex items-center gap-3 transition-colors text-left ${currentView === 'analytics' ? 'bg-slate-800/50 text-white border-l-2 border-brand-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><BarChart3 className="w-4 h-4" /> Indicadores</button>
               <div className="h-px bg-slate-800 my-2"></div>
               <button onClick={() => setModalType('config')} className="w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-sm font-medium flex items-center gap-3 transition-colors text-left"><Settings className="w-4 h-4" /> Ajuste Manual</button>
               <button onClick={() => setModalType('music')} className="w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-sm font-medium flex items-center gap-3 transition-colors text-left"><Music className="w-4 h-4" /> Rádio TV</button>
            </nav>
         </div>
         <div className="mt-auto p-6 border-t border-slate-800"><button onClick={actions.logout} className="w-full flex items-center justify-center gap-2 py-3 border border-red-900/50 text-red-400 hover:bg-red-900/20 rounded font-bold text-sm uppercase transition-colors"><LogOut className="w-4 h-4" /> Encerrar Turno</button></div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
         <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <div className="flex gap-8">
                <div className="flex items-center gap-3"><Users className="w-5 h-5 text-slate-400" /><div><span className="text-xs font-bold text-slate-500 uppercase block">Atendimentos</span><span className="font-mono font-bold text-slate-800 text-lg">{currentUser.stats.today}</span></div></div>
                <div className="w-px h-8 bg-slate-100 my-auto"></div>
                <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-slate-400" /><div><span className="text-xs font-bold text-slate-500 uppercase block">Total Loja</span><span className="font-mono font-bold text-slate-800 text-lg">{queueState.stats.totalCallsToday}</span></div></div>
            </div>
            {queueState.music.isPlaying && <div className="flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full"><Music className="w-3 h-3 animate-pulse" /> Rádio Ativa</div>}
         </header>

         {currentView === 'dashboard' ? (
            <div className="flex-1 p-8 flex gap-8 overflow-hidden bg-slate-50">
               <div className="flex-[3] flex flex-col gap-6">
                  <div className="bg-white rounded-xl shadow-card border border-slate-200 flex-1 flex flex-col relative overflow-hidden">
                     <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center"><h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Monitor className="w-4 h-4 text-brand-600" /> Status da Fila</h2><div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">Sistema Operante</div></div>
                     <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-10 relative">
                           <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">Senha em Atendimento</p>
                           <div className="text-[9rem] leading-none font-mono font-bold text-slate-900 tracking-tighter drop-shadow-sm">{String(queueState.currentTicket).padStart(3, '0')}</div>
                           {queueState.lastCalledDesk && (<div className="absolute -right-24 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-start opacity-50"><span className="text-[10px] uppercase font-bold">No Balcão</span><span className="text-2xl font-bold font-mono">{queueState.lastCalledDesk}</span></div>)}
                        </div>
                        <div className="w-full max-w-3xl grid grid-cols-5 gap-4">
                           <button onClick={() => setModalType('confirmRecall')} className="col-span-2 flex flex-col items-center justify-center p-6 bg-white border-2 border-amber-200 hover:border-amber-400 text-amber-700 rounded-xl hover:shadow-lg transition-all active:scale-[0.99] group"><Megaphone className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" /><span className="font-bold text-lg uppercase tracking-tight">Rechamar</span><span className="text-xs font-medium opacity-70">Tocar som novamente</span></button>
                           <button onClick={() => setModalType('confirmCall')} className="col-span-3 flex flex-col items-center justify-center p-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-action shadow-brand-500/30 transition-all active:scale-[0.99] group relative border border-brand-500"><div className="absolute top-4 right-4 bg-brand-800/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-brand-200 border border-brand-500/50">PRÓX: {String(queueState.currentTicket + 1).padStart(3, '0')}</div><ChevronRight className="w-12 h-12 mb-2 group-hover:translate-x-2 transition-transform" /><span className="font-bold text-2xl uppercase tracking-wide">Chamar Próximo</span></button>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end"><button onClick={() => setModalType('confirmRevert')} className="flex items-center gap-2 text-slate-400 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"><RotateCcw className="w-4 h-4" /> Desfazer Última Ação</button></div>
                  </div>
               </div>
               <div className="flex-[1.5] bg-white rounded-xl shadow-card border border-slate-200 flex flex-col overflow-hidden">
                  <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Histórico</h3><span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">Últimos 15</span></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><tr><th className="px-5 py-2">Senha</th><th className="px-5 py-2">Mesa</th><th className="px-5 py-2 text-right"></th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{queueState.history.slice(0, 15).map((ticket, index) => { const isMine = ticket.desk === currentUser.desk; const isCurrent = index === 0; return (<tr key={index} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-brand-50/40' : ''}`}><td className="px-5 py-3"><span className={`font-mono font-bold text-lg ${isCurrent ? 'text-brand-600' : 'text-slate-700'}`}>{String(ticket.number).padStart(3, '0')}</span></td><td className="px-5 py-3"><div className="flex flex-col"><span className="text-sm font-bold text-slate-600">{ticket.desk}</span>{isMine && <span className="text-[10px] text-brand-600 font-bold uppercase">Você</span>}</div></td><td className="px-5 py-3 text-right"><button onClick={() => actions.callSpecific(ticket.number, true)} className="text-slate-300 hover:text-brand-600 p-2 hover:bg-brand-50 rounded transition-all" title="Rechamar"><Megaphone className="w-4 h-4" /></button></td></tr>); })}</tbody>
                     </table>
                     {queueState.history.length === 0 && (<div className="p-8 text-center text-slate-400 text-xs uppercase font-medium">Sem chamadas hoje</div>)}
                  </div>
               </div>
            </div>
         ) : (<AnalyticsView fetchAnalytics={actions.getAnalytics} name={currentUser.name} />)}
      </main>

      <ConfirmModal isOpen={modalType === 'confirmCall'} onClose={() => setModalType('none')} onConfirm={actions.callNext} title="Chamar Próxima Senha" description={`Confirma a chamada da senha ${String(queueState.currentTicket + 1).padStart(3, '0')}?`} confirmText="Sim, Chamar" />
      <ConfirmModal isOpen={modalType === 'confirmRecall'} onClose={() => setModalType('none')} onConfirm={actions.recallCurrent} title="Rechamar Senha Atual" description="Isso tocará o sinal sonoro novamente na TV." confirmText="Rechamar" />
      <ConfirmModal isOpen={modalType === 'confirmRevert'} onClose={() => setModalType('none')} onConfirm={actions.revertPrevious} title="Desfazer Ação" description="Isso voltará a contagem para a senha anterior." confirmText="Desfazer" isDanger={true} />
      <ConfigModal isOpen={modalType === 'config'} onClose={() => setModalType('none')} onConfirm={actions.setTicketNumber} current={queueState.currentTicket} />
      <MusicModal isOpen={modalType === 'music'} onClose={() => setModalType('none')} currentMusic={queueState.music} setMusic={actions.setMusic} />
    </div>
  );
};
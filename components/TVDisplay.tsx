import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { MonitorPlay, WifiOff } from 'lucide-react';

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp, actions } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context
  const initAudioSystem = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) {
          audioCtxRef.current = new AudioCtor();
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setHasStarted(true);
    } catch (e) {
      console.error("Failed to initialize audio system:", e);
      setHasStarted(true);
    }
  };

  const playChime = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      osc.frequency.setValueAtTime(440, now + 0.6);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch (e) {
      // Ignore audio errors
    }
  };

  const speak = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9; 
      
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang === 'pt-BR' && v.name.includes('Google')) || 
                      voices.find(v => v.lang.includes('pt-BR')) || 
                      voices.find(v => v.lang.includes('pt'));
      if (ptVoice) utterance.voice = ptVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failed", e);
    }
  };

  // Effect to trigger animations/sound
  useEffect(() => {
    if (!hasStarted) return;
    
    // In demo mode, we simulate triggers based on local state changes
    if (demoMode || (lastUpdateTimestamp > 0 && queueState.currentTicket > 0)) {
      setHighlight(true);
      playChime();

      setTimeout(() => {
          const deskText = queueState.lastCalledDesk ? `Balcão ${queueState.lastCalledDesk}` : 'Balcão não informado';
          const text = `Senha ${queueState.currentTicket}, ${deskText}`;
          speak(text);
      }, 800);

      const timer = setTimeout(() => {
        setHighlight(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, demoMode, queueState.currentTicket]);

  // Handle Loading / Offline State
  if (!isConnected && !demoMode) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-gray-500 gap-6 p-4 text-center">
        <div className="relative">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <WifiOff className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
        <div>
          <div className="font-mono text-xl text-white mb-2">AGUARDANDO SERVIDOR...</div>
          <div className="text-sm text-gray-600 max-w-md mx-auto">
            Não foi possível conectar a <code className="bg-gray-900 px-1 rounded">localhost:3001</code>.
            Certifique-se que o backend está rodando.
          </div>
        </div>
        
        <button 
          onClick={() => {
             setDemoMode(true);
             // Simulate some initial data for demo
             actions.updateNumber(42); 
             initAudioSystem();
          }}
          className="mt-8 px-6 py-2 bg-gray-900 border border-gray-800 rounded-full text-xs hover:bg-gray-800 hover:text-white transition-colors"
        >
          Entrar em Modo Demonstração (Sem Backend)
        </button>
      </div>
    );
  }

  // Start Screen (Click to Unlock Audio)
  if (!hasStarted) {
    return (
      <div 
        onClick={initAudioSystem}
        className="h-screen w-screen bg-gray-950 flex flex-col items-center justify-center text-white cursor-pointer hover:bg-gray-900 transition-colors"
      >
        <div className="bg-indigo-600 p-6 rounded-full mb-6 shadow-lg shadow-indigo-500/30 animate-bounce">
          <MonitorPlay className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Iniciar Painel de TV</h1>
        <p className="text-gray-400">Toque em qualquer lugar para ativar o som e tela cheia</p>
        {demoMode && <span className="mt-4 px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded border border-yellow-500/30">MODO DEMONSTRAÇÃO</span>}
      </div>
    );
  }

  // Main Display
  return (
    <div className="h-screen w-screen bg-black text-white flex overflow-hidden font-sans select-none cursor-none relative">
      
      {/* Demo Controls Overlay */}
      {demoMode && (
        <div className="absolute top-4 left-4 z-50 flex gap-2 opacity-20 hover:opacity-100 transition-opacity">
          <button onClick={() => actions.callNext('01')} className="bg-white text-black px-2 py-1 text-xs rounded">Próxima</button>
          <button onClick={() => actions.updateNumber(queueState.currentTicket + 10)} className="bg-white text-black px-2 py-1 text-xs rounded">+10</button>
          <div className="text-xs text-yellow-500 bg-black/50 px-2 py-1 rounded">DEMO</div>
        </div>
      )}

      {/* LEFT: Main Display (70%) */}
      <div className="w-[70%] h-full flex flex-col items-center justify-center border-r border-gray-900 relative">
        <div className={`absolute inset-0 bg-indigo-900/20 blur-3xl transition-opacity duration-1000 ${highlight ? 'opacity-100' : 'opacity-20'}`}></div>

        <div className="z-10 text-center">
          <h2 className="text-gray-500 text-3xl md:text-4xl font-light tracking-[0.2em] uppercase mb-8">
            Senha Atual
          </h2>
          
          <div className="relative">
            <div className={`
              font-mono font-bold text-[18rem] md:text-[24rem] leading-none tracking-tighter
              transition-all duration-500 transform
              ${highlight ? 'scale-110 text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.6)]' : 'scale-100 text-gray-200'}
            `}>
              {String(queueState.currentTicket).padStart(3, '0')}
            </div>
          </div>

          <div className={`
            mt-12 inline-block px-12 py-4 rounded-full border-2 
            transition-all duration-500
            ${highlight ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/50' : 'bg-gray-900 border-gray-800'}
          `}>
             <span className="text-4xl md:text-6xl font-bold tracking-widest">
                {queueState.lastCalledDesk ? `BALCÃO ${String(queueState.lastCalledDesk).padStart(2, '0')}` : 'AGUARDE'}
             </span>
          </div>
        </div>
      </div>

      {/* RIGHT: History Sidebar (30%) */}
      <div className="w-[30%] h-full bg-gray-950 flex flex-col p-8 border-l border-gray-900">
        <h3 className="text-gray-500 uppercase tracking-widest font-bold text-xl mb-8 border-b border-gray-800 pb-4">
          Últimas Chamadas
        </h3>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {(queueState.history || []).slice(0, 5).map((ticket, index) => (
            <div 
              key={`${ticket.number}-${index}`} 
              className={`
                flex items-center justify-between p-6 rounded-xl border
                ${index === 0 && highlight ? 'bg-gray-900 border-indigo-500/30' : 'bg-gray-900/50 border-gray-800'}
              `}
            >
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase mb-1">Senha</span>
                <span className="text-4xl font-mono font-bold text-gray-300">
                  {String(ticket.number).padStart(3, '0')}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 text-xs uppercase mb-1">Balcão</span>
                <span className="text-2xl font-bold text-indigo-400">
                  {ticket.desk}
                </span>
              </div>
            </div>
          ))}
          
          {(!queueState.history || queueState.history.length === 0) && (
             <div className="text-gray-700 text-center mt-10 italic">Nenhum histórico disponível</div>
          )}
        </div>

        <div className="mt-auto pt-8 text-center border-t border-gray-900">
            <p className="text-gray-800 font-mono text-sm">SYSTEM ONLINE</p>
        </div>
      </div>
    </div>
  );
};
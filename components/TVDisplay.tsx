import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud } from 'lucide-react';

// Simplified Weather (Visual only for clean look)
const WeatherWidget: React.FC = () => {
  return (
    <div className="flex items-center gap-3 text-slate-400">
      <Cloud className="w-6 h-6" />
      <span className="text-2xl font-medium text-slate-200">24°C</span>
    </div>
  );
};

const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <div className="text-5xl font-display font-bold text-white tracking-tight leading-none">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Set clean dark body
  useEffect(() => {
    document.body.style.backgroundColor = '#0f172a'; // Slate 900
    document.body.style.overflow = 'hidden'; // Prevent scrolling on TV
    return () => { 
      document.body.style.backgroundColor = ''; 
      document.body.style.overflow = '';
    };
  }, []);

  // --- AUDIO LOGIC (Ding-Dong Implementation) ---
  const initAudioSystem = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) audioCtxRef.current = new AudioCtor();
      }
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      setHasStarted(true);
    } catch (e) { setHasStarted(true); }
  };

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Volume Master
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = 0.4; // Ajuste de volume global

      // TONE 1: "Ding" (Higher pitch, rich harmonic)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(660, now); // Nota Mi (E5)
      
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(1, now + 0.05); // Attack rápido
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Decay longo
      
      osc1.connect(gain1);
      gain1.connect(masterGain);
      
      osc1.start(now);
      osc1.stop(now + 1.5);

      // TONE 2: "Dong" (Lower pitch, warm)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(550, now + 0.6); // Nota Dó sustenido (C#5) - atrasado 0.6s
      
      gain2.gain.setValueAtTime(0, now + 0.6);
      gain2.gain.linearRampToValueAtTime(1, now + 0.65);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      
      osc2.connect(gain2);
      gain2.connect(masterGain);
      
      osc2.start(now + 0.6);
      osc2.stop(now + 2.5);

    } catch (e) {
      console.error("Audio error", e);
    }
  };

  // Trigger effects on update
  useEffect(() => {
    if (!hasStarted) return;
    if (lastUpdateTimestamp > 0 && queueState.currentTicket > 0) {
      setHighlight(true);
      playDingDong();
      
      // Voice Synthesis (Native Browser) - Aguarda o "Ding Dong" terminar
      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         const text = `Senha ${queueState.currentTicket}, Balcão ${queueState.lastCalledDesk}`;
         const msg = new SpeechSynthesisUtterance(text);
         msg.lang = 'pt-BR';
         msg.rate = 1.0; // Velocidade normal
         msg.pitch = 1.0;
         
         // Tenta pegar uma voz feminina em português se disponível (geralmente soa melhor)
         const voices = window.speechSynthesis.getVoices();
         const ptVoice = voices.find(v => v.lang.includes('PT') || v.lang.includes('pt'));
         if (ptVoice) msg.voice = ptVoice;

         setTimeout(() => window.speechSynthesis.speak(msg), 1500); // Wait for Ding-Dong
      }

      const timer = setTimeout(() => setHighlight(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, queueState.currentTicket]);

  if (!hasStarted) {
    return (
      <div onClick={initAudioSystem} className="h-screen w-screen bg-slate-900 flex items-center justify-center cursor-pointer">
        <div className="text-center space-y-6 animate-pulse">
           <div className="w-24 h-24 bg-brand-600 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.5)]">
              <Clock className="w-12 h-12 text-white" />
           </div>
           <div>
             <h1 className="text-3xl font-bold text-white mb-2">Queue Master TV</h1>
             <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-sm">Toque para Iniciar Som</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex overflow-hidden font-display relative select-none">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0B1120] z-0"></div>
      
      {/* LEFT: MAIN (65%) */}
      <div className="w-[66%] z-10 flex flex-col relative border-r border-slate-800/50">
         
         <header className="p-12 flex justify-between items-start">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-900/50">
                  AP
               </div>
               <div>
                  <h1 className="text-2xl font-bold leading-none text-white tracking-tight">AutoParts</h1>
                  <p className="text-sm text-slate-400 uppercase tracking-[0.15em] mt-1 font-semibold">Terminal de Chamadas</p>
               </div>
            </div>
            <WeatherWidget />
         </header>

         <div className="flex-1 flex flex-col items-center justify-center relative -mt-10">
            {/* Dynamic Glow Effect */}
            <div className={`
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] 
              bg-brand-600/20 rounded-full blur-[120px] transition-all duration-1000
              ${highlight ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}
            `}></div>

            <p className="text-slate-400 uppercase tracking-[0.5em] font-bold text-lg mb-4 relative z-10">
              Senha Atual
            </p>
            
            {/* O NÚMERO GIGANTE */}
            <div className={`
               font-mono font-bold tracking-tighter relative z-10 transition-all duration-700 leading-none
               ${highlight ? 'text-white scale-110 drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]' : 'text-slate-200'}
            `} style={{ fontSize: '18rem' }}>
               {String(queueState.currentTicket).padStart(3, '0')}
            </div>
            
            <div className="mt-16 text-center relative z-10 bg-slate-900/50 backdrop-blur-md px-12 py-6 rounded-2xl border border-slate-800/50 shadow-2xl">
               <p className="text-slate-500 uppercase tracking-widest text-sm font-bold mb-2">Dirija-se ao</p>
               <div className={`text-6xl font-bold transition-colors duration-300 ${highlight ? 'text-brand-400' : 'text-white'}`}>
                  {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : 'Aguarde...'}
               </div>
            </div>
         </div>
      </div>

      {/* RIGHT: SIDEBAR (35%) */}
      <div className="w-[34%] z-10 bg-slate-900/80 flex flex-col backdrop-blur-md border-l border-slate-800/50">
         <div className="p-10 border-b border-slate-800/50 bg-slate-900/50">
            <DigitalClock />
         </div>

         <div className="flex-1 p-8 flex flex-col overflow-hidden">
            <h3 className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mb-8 flex items-center gap-3">
               <Clock className="w-4 h-4" /> Últimas Chamadas
            </h3>

            <div className="flex-1 flex flex-col gap-4">
               {queueState.history.slice(0, 5).map((t, i) => (
                  <div key={i} className={`
                     flex items-center justify-between p-6 rounded-2xl border transition-all duration-500
                     ${i === 0 && highlight 
                        ? 'bg-brand-900/40 border-brand-500/50 translate-x-0 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                        : 'bg-slate-800/40 border-slate-700/30 text-slate-400'}
                  `}>
                     <span className={`text-5xl font-mono font-bold ${i === 0 && highlight ? 'text-white' : 'text-slate-300'}`}>
                        {String(t.number).padStart(3, '0')}
                     </span>
                     <div className="text-right">
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Balcão</p>
                        <p className={`text-2xl font-bold ${i === 0 && highlight ? 'text-brand-400' : 'text-slate-500'}`}>
                           {String(t.desk).padStart(2, '0')}
                        </p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
         
         <div className="p-6 text-center border-t border-slate-800/50 bg-slate-900">
            <p className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold">
              Sistema Operacional Online
            </p>
         </div>
      </div>
    </div>
  );
};
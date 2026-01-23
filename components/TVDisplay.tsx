import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, MapPin } from 'lucide-react';

// Simplified Weather (Visual only for clean look)
const WeatherWidget: React.FC = () => {
  return (
    <div className="flex items-center gap-3 text-slate-400">
      <Cloud className="w-5 h-5" />
      <span className="text-xl font-medium text-slate-200">24°C</span>
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
      <div className="text-4xl font-display font-bold text-white tracking-tight">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-slate-400 text-sm font-medium uppercase tracking-widest">
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
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  // --- AUDIO LOGIC (Same robust implementation) ---
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

  const playChime = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      // Soft modern chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.8);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2);
    } catch (e) {}
  };

  // Trigger effects on update
  useEffect(() => {
    if (!hasStarted) return;
    if (lastUpdateTimestamp > 0 && queueState.currentTicket > 0) {
      setHighlight(true);
      playChime();
      
      // Voice Synthesis (Native Browser)
      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         const msg = new SpeechSynthesisUtterance(`Senha ${queueState.currentTicket}, Balcão ${queueState.lastCalledDesk}`);
         msg.lang = 'pt-BR';
         msg.rate = 0.9;
         setTimeout(() => window.speechSynthesis.speak(msg), 1000); // Wait for chime
      }

      const timer = setTimeout(() => setHighlight(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, queueState.currentTicket]);

  if (!hasStarted) {
    return (
      <div onClick={initAudioSystem} className="h-screen w-screen bg-slate-900 flex items-center justify-center cursor-pointer">
        <div className="text-center space-y-4 animate-pulse">
           <div className="w-20 h-20 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center shadow-glow">
              <Clock className="w-10 h-10 text-white" />
           </div>
           <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Toque para Iniciar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex overflow-hidden font-display relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 z-0"></div>
      
      {/* LEFT: MAIN (65%) */}
      <div className="w-[65%] z-10 flex flex-col relative border-r border-slate-800">
         
         <header className="p-10 flex justify-between items-start">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-900 font-bold">Q</div>
               <div>
                  <h1 className="text-xl font-bold leading-none">QueueMaster</h1>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Atendimento</p>
               </div>
            </div>
            <WeatherWidget />
         </header>

         <div className="flex-1 flex flex-col items-center justify-center relative -mt-10">
            {/* Highlight Glow */}
            <div className={`absolute inset-0 bg-primary-600/10 blur-3xl transition-opacity duration-1000 ${highlight ? 'opacity-100' : 'opacity-0'}`}></div>

            <p className="text-slate-400 uppercase tracking-[0.4em] font-semibold text-sm mb-6 relative z-10">Senha Atual</p>
            <div className={`
               text-[16rem] leading-none font-bold tracking-tighter relative z-10 transition-all duration-500
               ${highlight ? 'text-white scale-105 drop-shadow-[0_0_60px_rgba(255,255,255,0.3)]' : 'text-slate-200'}
            `}>
               {String(queueState.currentTicket).padStart(3, '0')}
            </div>
            
            <div className="mt-12 text-center relative z-10">
               <p className="text-slate-500 uppercase tracking-widest text-xs mb-2">Dirija-se ao</p>
               <div className={`text-5xl font-bold transition-colors duration-300 ${highlight ? 'text-primary-400' : 'text-white'}`}>
                  {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : 'Aguarde'}
               </div>
            </div>
         </div>
      </div>

      {/* RIGHT: SIDEBAR (35%) */}
      <div className="w-[35%] z-10 bg-slate-950/50 flex flex-col backdrop-blur-sm">
         <div className="p-10 border-b border-slate-800 flex justify-end">
            <DigitalClock />
         </div>

         <div className="p-10 flex-1 overflow-hidden">
            <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
               <Clock className="w-4 h-4" /> Chamadas Anteriores
            </h3>

            <div className="space-y-4">
               {queueState.history.slice(0, 5).map((t, i) => (
                  <div key={i} className={`
                     flex items-center justify-between p-5 rounded-2xl border transition-all
                     ${i === 0 && highlight 
                        ? 'bg-primary-900/30 border-primary-500/50 translate-x-2' 
                        : 'bg-slate-900 border-slate-800'}
                  `}>
                     <span className="text-4xl font-bold text-slate-200">{String(t.number).padStart(3, '0')}</span>
                     <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Balcão</p>
                        <p className={`text-xl font-bold ${i === 0 && highlight ? 'text-primary-400' : 'text-slate-400'}`}>
                           {String(t.desk).padStart(2, '0')}
                        </p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
         
         <div className="p-6 text-center border-t border-slate-800">
            <p className="text-slate-600 text-[10px] uppercase tracking-widest">QueueMaster Systems</p>
         </div>
      </div>
    </div>
  );
};
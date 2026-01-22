import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { WifiOff, Clock, Cloud, CloudRain, Sun, CloudSun, MapPin, Ticket } from 'lucide-react';

// --- Weather Component ---
const WeatherWidget: React.FC = () => {
  const [temp, setTemp] = useState<number | null>(null);
  const [wCode, setWCode] = useState<number>(0);
  
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Piracicaba Coordinates: -22.7253, -47.6492
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.7253&longitude=-47.6492&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo');
        const data = await res.json();
        if (data.current) {
          setTemp(Math.round(data.current.temperature_2m));
          setWCode(data.current.weather_code);
        }
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // Update every 30 mins
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code >= 0 && code <= 1) return <Sun className="w-8 h-8 text-amber-500" />;
    if (code >= 2 && code <= 3) return <CloudSun className="w-8 h-8 text-gray-400" />;
    if (code >= 51) return <CloudRain className="w-8 h-8 text-blue-400" />;
    return <Cloud className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <div className="flex flex-col items-end">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Piracicaba-SP
        </span>
        <span className="text-2xl font-tech font-bold text-white leading-none">
            {temp !== null ? `${temp}°C` : '--'}
        </span>
      </div>
      <div className="pl-2 border-l border-gray-700">
          {getWeatherIcon(wCode)}
      </div>
    </div>
  );
};

// --- Clock Component ---
const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <div className="text-5xl font-tech font-bold text-white tracking-wide tabular-nums leading-none">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        <span className="text-2xl text-amber-500 ml-1 font-medium">
            {time.toLocaleTimeString('pt-BR', { second: '2-digit' })}
        </span>
      </div>
      <div className="text-gray-400 text-sm font-medium uppercase tracking-widest mt-1">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

// --- Main Display Component ---
export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp, actions } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio
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

  // Professional "Ding-Dong" Sound
  const playChime = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;

      // First Tone (Higher, Attention) - E5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); 
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.5);

      // Second Tone (Lower, Resolution) - C5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.6); // Delayed start
      gain2.gain.setValueAtTime(0, now + 0.6);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.65);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.6);
      osc2.stop(now + 3.0);

    } catch (e) {
      // Ignore audio errors
    }
  };

  // Trigger Effect
  useEffect(() => {
    if (!hasStarted) return;
    
    // Trigger on update (skip 0)
    if (demoMode || (lastUpdateTimestamp > 0 && queueState.currentTicket > 0)) {
      setHighlight(true);
      playChime();
      
      const timer = setTimeout(() => {
        setHighlight(false);
      }, 5000); // Glow lasts longer

      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, demoMode, queueState.currentTicket]);

  // --- Screens ---

  // 1. Offline / Loading
  if (!isConnected && !demoMode) {
    return (
      <div className="h-screen w-screen bg-carbon-900 flex flex-col items-center justify-center text-gray-500 font-tech">
        <div className="animate-spin w-16 h-16 border-t-4 border-amber-500 border-r-4 border-r-transparent rounded-full mb-6"></div>
        <div className="text-2xl text-white tracking-widest uppercase">Sistema Offline</div>
        <p className="mt-2 text-sm text-gray-600">Aguardando conexão com o servidor...</p>
        <button 
          onClick={() => { setDemoMode(true); initAudioSystem(); }}
          className="mt-8 px-8 py-3 bg-gray-800 border border-gray-700 text-white rounded hover:bg-gray-700 transition-colors uppercase tracking-wider text-sm font-bold"
        >
          Iniciar Modo Demonstração
        </button>
      </div>
    );
  }

  // 2. Click to Start (Autoplay policy)
  if (!hasStarted) {
    return (
      <div 
        onClick={initAudioSystem}
        className="h-screen w-screen bg-carbon-900 flex flex-col items-center justify-center text-white cursor-pointer relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="z-10 bg-amber-600/10 p-8 rounded-full border border-amber-500/30 animate-pulse mb-8">
            <Clock className="w-16 h-16 text-amber-500" />
        </div>
        <h1 className="text-4xl font-tech font-bold tracking-widest uppercase mb-2">Iniciar Terminal</h1>
        <p className="text-gray-500 font-mono text-sm">Toque na tela para ativar o áudio</p>
      </div>
    );
  }

  // 3. Main Dashboard
  return (
    <div className="h-screen w-screen bg-carbon-900 text-white flex flex-col font-sans select-none overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.07] z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-transparent to-black z-0"></div>

      {/* --- TOP BAR --- */}
      <header className="h-[15vh] w-full flex justify-between items-center px-12 z-10 border-b border-gray-800 bg-gray-900/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
           {/* Logo Placeholder */}
           <div className="w-12 h-12 bg-amber-600 rounded flex items-center justify-center shadow-lg shadow-amber-900/20">
              <Ticket className="text-white w-7 h-7" />
           </div>
           <div>
              <h1 className="text-2xl font-tech font-bold uppercase tracking-widest text-white leading-none">Auto Peças</h1>
              <span className="text-xs text-amber-500 font-mono tracking-[0.3em] uppercase">Atendimento Prioritário</span>
           </div>
        </div>

        <div className="flex items-center gap-12">
           <WeatherWidget />
           <DigitalClock />
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 flex z-10">
        
        {/* LEFT: Main Ticket (70%) */}
        <div className="w-[70%] flex flex-col items-center justify-center relative border-r border-gray-800">
           {/* Glow Effect behind number */}
           <div className={`
              absolute w-[600px] h-[600px] rounded-full blur-[120px] bg-amber-600/20 pointer-events-none transition-all duration-1000
              ${highlight ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}
           `}></div>

           <div className="relative z-10 text-center">
              <h2 className="text-gray-500 font-mono text-xl tracking-[0.5em] uppercase mb-4">Senha Atual</h2>
              
              <div className={`
                font-tech font-bold text-[22rem] leading-[0.8] tracking-tighter transition-all duration-500
                ${highlight ? 'text-white drop-shadow-[0_0_30px_rgba(245,158,11,0.6)] scale-105' : 'text-gray-300'}
              `}>
                {String(queueState.currentTicket).padStart(3, '0')}
              </div>

              <div className="mt-12 flex flex-col items-center">
                 <div className="h-px w-32 bg-gray-700 mb-6"></div>
                 <span className="text-gray-400 text-sm uppercase tracking-widest mb-1">Dirija-se ao</span>
                 <div className={`
                    text-6xl font-tech font-bold uppercase transition-colors duration-300
                    ${highlight ? 'text-amber-500' : 'text-white'}
                 `}>
                    {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : 'AGUARDE'}
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: History (30%) */}
        <div className="w-[30%] bg-gray-900/30 flex flex-col">
            <div className="p-8 border-b border-gray-800">
               <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Chamadas Anteriores
               </h3>
            </div>
            
            <div className="flex-1 p-8 space-y-4 overflow-hidden">
               {queueState.history.slice(0, 5).map((ticket, i) => (
                 <div key={i} className={`
                    flex items-center justify-between p-4 rounded border-l-4 backdrop-blur-sm transition-all
                    ${i === 0 && highlight 
                       ? 'bg-amber-900/20 border-amber-500 translate-x-2' 
                       : 'bg-gray-800/40 border-gray-600'}
                 `}>
                    <div className="flex flex-col">
                       <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Senha</span>
                       <span className="text-4xl font-tech font-bold text-gray-200">
                          {String(ticket.number).padStart(3, '0')}
                       </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Balcão</span>
                       <span className={`text-2xl font-tech font-bold ${i === 0 && highlight ? 'text-amber-500' : 'text-gray-400'}`}>
                          {String(ticket.desk).padStart(2, '0')}
                       </span>
                    </div>
                 </div>
               ))}
               
               {queueState.history.length === 0 && (
                 <div className="text-gray-600 text-center mt-12 font-mono text-sm">
                   Aguardando chamadas...
                 </div>
               )}
            </div>

            {/* Footer Tag */}
            <div className="p-4 border-t border-gray-800 text-center">
               <span className="text-[10px] text-gray-700 font-mono uppercase tracking-[0.2em]">
                  AutoParts System v2.0
               </span>
            </div>
        </div>
      </div>

      {/* Demo Controls */}
      {demoMode && (
        <div className="absolute bottom-4 left-4 z-50 flex gap-2 opacity-30 hover:opacity-100 transition-opacity">
          <button onClick={() => actions.callNext()} className="bg-amber-600 text-white px-3 py-1 text-xs rounded uppercase font-bold">Próxima</button>
          <div className="text-xs text-amber-500 bg-black/80 px-2 py-1 rounded border border-amber-900">DEMO MODE</div>
        </div>
      )}
    </div>
  );
};
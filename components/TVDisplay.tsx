import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music, Wind } from 'lucide-react';

// --- WEATHER WIDGET (PIRACICABA FIXED + 4 DAYS) ---
const WeatherWidget: React.FC = () => {
  // Mocking 4-day forecast for Piracicaba
  const days = [
     { name: 'Hoje', temp: '31°', icon: <Sun className="w-5 h-5 text-amber-400" /> },
     { name: 'Amanhã', temp: '29°', icon: <Cloud className="w-5 h-5 text-slate-400" /> },
     { name: 'Qua', temp: '27°', icon: <CloudRain className="w-5 h-5 text-blue-400" /> },
     { name: 'Qui', temp: '30°', icon: <Sun className="w-5 h-5 text-amber-400" /> }
  ];

  return (
    <div className="flex flex-col bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-lg">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-brand-300">
             <MapPin className="w-5 h-5" />
             <span className="text-sm font-bold uppercase tracking-widest">Piracicaba, SP</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Atualizado agora</span>
       </div>
       
       <div className="flex items-center gap-6 mb-6">
          <Sun className="w-16 h-16 text-amber-400 animate-pulse" />
          <div className="flex flex-col">
             <span className="text-6xl font-bold text-white tracking-tighter">31°</span>
             <span className="text-sm text-slate-400 font-bold uppercase tracking-wide">Parcialmente Nublado</span>
          </div>
       </div>
       
       {/* 4 Day Forecast */}
       <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-700/50">
          {days.map((d, i) => (
             <div key={i} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-slate-800/30">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                {d.icon}
                <span className="text-sm font-bold text-slate-200">{d.temp}</span>
             </div>
          ))}
       </div>
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
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-lg text-center">
      <div className="text-7xl font-sans font-bold text-white tracking-tight leading-none tabular-nums">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-brand-400 text-sm font-bold uppercase tracking-[0.2em] mt-2">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

// --- YOUTUBE BACKGROUND PLAYER WITH DUCKING ---
const MusicPlayer = ({ videoId, isPlaying, volume, ducking }: { videoId: string | null, isPlaying: boolean, volume: number, ducking: boolean }) => {
   const playerRef = useRef<HTMLIFrameElement>(null);
   const currentVolRef = useRef(volume);

   // Volume Smoothing Logic
   useEffect(() => {
      if (!playerRef.current || !videoId) return;
      const iframe = playerRef.current;
      if (!iframe.contentWindow) return;

      const targetVolume = ducking ? 10 : volume; // Drop to 10% on ducking
      
      const fadeInterval = setInterval(() => {
         const diff = targetVolume - currentVolRef.current;
         if (Math.abs(diff) < 2) {
            currentVolRef.current = targetVolume;
         } else {
            currentVolRef.current += diff * 0.1; // Smooth fade factor
         }

         iframe.contentWindow?.postMessage(JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [Math.round(currentVolRef.current)]
         }), '*');
      }, 50);

      return () => clearInterval(fadeInterval);
   }, [ducking, volume, videoId]);

   if (!videoId) return null;

   const src = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&enablejsapi=1`;

   return (
      <div className="absolute w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
         <iframe 
            ref={playerRef}
            width="560" 
            height="315" 
            src={src} 
            title="YouTube video player" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
         ></iframe>
      </div>
   );
};

const NowPlaying = ({ music }: { music: any }) => {
   if (!music.videoId || !music.isPlaying) return null;

   return (
      <div className="absolute bottom-8 left-8 z-30 flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl pr-8 max-w-md animate-in slide-in-from-bottom-10 fade-in duration-700">
         <div className="relative">
            <img src={music.thumbnail} className="w-16 h-16 rounded-xl object-cover shadow-lg" />
            <div className="absolute -bottom-2 -right-2 bg-brand-600 rounded-full p-1.5 shadow-lg">
               <Music className="w-3 h-3 text-white animate-spin-slow" />
            </div>
         </div>
         <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Som Ambiente</span>
             </div>
             <p className="text-white font-bold leading-tight line-clamp-1 text-sm">{music.title}</p>
         </div>
      </div>
   );
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // FIX: Track last played ticket to prevent re-triggering on music updates
  const lastPlayedTicketRef = useRef(0);
  const lastRecallRef = useRef(false); // Can interpret generic updates as recall if needed, but easier to track state changes.

  useEffect(() => {
    document.body.style.backgroundColor = '#020617'; 
    document.body.style.overflow = 'hidden'; 
    return () => { 
      document.body.style.backgroundColor = ''; 
      document.body.style.overflow = '';
    };
  }, []);

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
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = 0.6; 

      // Ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(660, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(1, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.5);

      // Dong
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(550, now + 0.6);
      gain2.gain.setValueAtTime(0, now + 0.6);
      gain2.gain.linearRampToValueAtTime(1, now + 0.65);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.6);
      osc2.stop(now + 2.5);

    } catch (e) { console.error(e); }
  };

  const speak = (ticket: number, desk: string) => {
     if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         const text = `Senha ${ticket}, Balcão ${desk}`;
         const msg = new SpeechSynthesisUtterance(text);
         msg.lang = 'pt-BR';
         msg.rate = 0.9; 
         setTimeout(() => window.speechSynthesis.speak(msg), 1500); 
      }
  };

  // Trigger Logic
  useEffect(() => {
    if (!hasStarted) return;
    
    // Check if it's a new ticket OR a recall (detected via boolean in payload, or if same ticket timestamp updated)
    // Simplified: Check if number changed. For recall, we'd need the socket event 'recall', but here we rely on state.
    // To support Recall via state update: The server usually re-emits state. 
    // We will assume if `queueState` updates and `recall` flag is present (requires type update) or just rely on manual triggering.
    // For now, let's fix the music bug: Only ring if ticket != lastPlayed.
    
    // NOTE: 'recall' property is passed in the update payload in `useQueueSocket`.
    const isNewTicket = queueState.currentTicket !== lastPlayedTicketRef.current;
    // Check if it's a recall (we can infer this if ticket is same but lastUpdateTimestamp changed significantly? 
    // Ideally use the `recall` flag passed from hook, but here we just check valid ticket > 0).
    
    // To handle recall properly without prop drilling the 'recall' flag deeply, 
    // we can check if the timestamp of the *latest history item* changed, 
    // as a recall/new call pushes to history or updates it.
    
    const latestHistory = queueState.history[0];
    const latestTimestamp = latestHistory ? new Date(latestHistory.timestamp).getTime() : 0;
    
    const shouldPlay = (queueState.currentTicket > 0) && (
       isNewTicket || 
       // Logic to detect re-trigger/recall if needed: 
       // Currently `useQueueSocket` sets `lastUpdateTimestamp`.
       // If we want to strictly avoid music triggering it, we assume music updates DON'T change currentTicket.
       (queueState.currentTicket === lastPlayedTicketRef.current && (queueState as any).recall === true) 
    );

    if (shouldPlay || ((queueState as any).recall)) {
      setHighlight(true);
      playDingDong();
      speak(queueState.currentTicket, queueState.lastCalledDesk || '??');
      
      lastPlayedTicketRef.current = queueState.currentTicket;

      const timer = setTimeout(() => setHighlight(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, queueState.currentTicket, (queueState as any).recall]);

  if (!hasStarted) {
    return (
      <div onClick={initAudioSystem} className="h-screen w-screen bg-slate-950 flex items-center justify-center cursor-pointer">
        <div className="text-center space-y-8 animate-pulse">
           <div className="w-32 h-32 bg-brand-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.4)]">
              <Clock className="w-16 h-16 text-white" />
           </div>
           <div>
             <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Queue Master TV</h1>
             <p className="text-brand-400 font-bold tracking-[0.2em] uppercase text-sm border border-brand-800 bg-brand-900/20 py-2 px-6 rounded-full inline-block">
                Toque para Iniciar
             </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex overflow-hidden font-sans relative select-none">
      
      <MusicPlayer 
         videoId={queueState.music?.videoId} 
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         ducking={highlight} 
      />

      <NowPlaying music={queueState.music} />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>

      {/* GRID LAYOUT */}
      <div className="absolute inset-0 z-10 p-12 flex gap-12">
         
         {/* LEFT COLUMN: MAIN DISPLAY (2/3 width) */}
         <div className="flex-[2] flex flex-col justify-center relative">
             {/* Center Glow */}
             <div className={`
                 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh]
                 bg-brand-600/30 rounded-full blur-[120px] transition-all duration-1000 ease-out
                 ${highlight ? 'opacity-100 scale-100' : 'opacity-20 scale-75'}
             `}></div>

             <div className="relative z-10 flex flex-col items-center">
                 <h2 className="text-brand-200/60 font-bold text-2xl uppercase tracking-[0.5em] mb-4">Senha Atual</h2>
                 
                 <div className={`
                     text-[18rem] leading-none font-bold tracking-tighter text-white transition-all duration-500
                     ${highlight ? 'scale-110 drop-shadow-[0_0_60px_rgba(255,255,255,0.5)]' : 'scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 <div className={`
                     mt-16 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl px-16 py-8
                     flex flex-col items-center gap-2 shadow-2xl transition-all duration-500
                     ${highlight ? 'border-brand-500/50 bg-brand-900/20 translate-y-2' : ''}
                 `}>
                     <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Dirija-se ao</span>
                     <span className={`text-6xl font-bold ${highlight ? 'text-brand-400' : 'text-white'}`}>
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT COLUMN: SIDEBAR (1/3 width) */}
         <div className="flex-[1] flex flex-col gap-8 min-w-[400px]">
             {/* Top Widgets */}
             <DigitalClock />
             <WeatherWidget />

             {/* History List */}
             <div className="flex-1 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-8 flex flex-col shadow-xl overflow-hidden relative">
                 <div className="flex items-center gap-3 mb-8 text-slate-500 font-bold uppercase tracking-widest text-xs">
                    <Clock className="w-4 h-4" />
                    Últimas Chamadas
                 </div>

                 <div className="flex flex-col gap-5 relative">
                    {/* Fade Out Mask for History */}
                    {queueState.history.slice(0, 5).map((t, i) => {
                       // Opacity Logic for "Disappearing" effect
                       const opacity = i === 0 ? 1 : i === 1 ? 0.7 : i === 2 ? 0.4 : i === 3 ? 0.2 : 0.1;
                       
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-4 rounded-2xl border transition-all duration-500
                             ${i === 0 && highlight 
                                ? 'bg-white/10 border-brand-400/50 scale-105 shadow-lg' 
                                : 'bg-slate-800/30 border-slate-700/30'}
                          `}>
                             <span className={`text-4xl font-bold tracking-tight ${i === 0 ? 'text-white' : 'text-slate-400'}`}>
                                {String(t.number).padStart(3, '0')}
                             </span>
                             <div className="text-right">
                                <span className="block text-[10px] uppercase font-bold text-slate-500">Balcão</span>
                                <span className={`text-xl font-bold ${i === 0 ? 'text-brand-300' : 'text-slate-500'}`}>
                                   {String(t.desk).padStart(2, '0')}
                                </span>
                             </div>
                          </div>
                       );
                    })}
                 </div>
             </div>
         </div>

      </div>
    </div>
  );
};
import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music } from 'lucide-react';

// --- WEATHER WIDGET (Simulated) ---
const WeatherWidget: React.FC = () => {
  return (
    <div className="flex flex-col items-end">
       <div className="flex items-center gap-2 text-slate-400 mb-1">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">São Paulo, SP</span>
       </div>
       <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span className="text-5xl font-bold text-white tracking-tighter">24°</span>
             <span className="text-xs text-slate-400 font-bold uppercase">Ensolarado</span>
          </div>
          <Sun className="w-12 h-12 text-amber-400 animate-pulse" />
       </div>
       
       {/* Mini Forecast */}
       <div className="flex gap-4 mt-6 border-t border-slate-800 pt-4">
          <div className="flex flex-col items-center gap-1 text-slate-500">
             <span className="text-[10px] font-bold uppercase">Seg</span>
             <Cloud className="w-4 h-4 text-slate-400" />
             <span className="text-xs font-bold">22°</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-slate-500">
             <span className="text-[10px] font-bold uppercase">Ter</span>
             <Sun className="w-4 h-4 text-amber-500" />
             <span className="text-xs font-bold">28°</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-slate-500">
             <span className="text-[10px] font-bold uppercase">Qua</span>
             <CloudRain className="w-4 h-4 text-blue-400" />
             <span className="text-xs font-bold">19°</span>
          </div>
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
    <div className="text-right">
      <div className="text-6xl font-sans font-bold text-white tracking-tight leading-none">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-brand-400 text-sm font-bold uppercase tracking-[0.2em] mt-2">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

// --- YOUTUBE BACKGROUND PLAYER ---
const MusicPlayer = ({ videoId, isPlaying, highlight }: { videoId: string | null, isPlaying: boolean, highlight: boolean }) => {
   const playerRef = useRef<HTMLIFrameElement>(null);
   
   // We use simple embed for stability. 
   // Note: To control volume for "ducking" (lowering volume when speaking), we would need the full YouTube IFrame API.
   // Since we are avoiding external script injections for simplicity in this specific "file-only" update, 
   // we will assume the ding-dong is loud enough or the user sets the music volume lower manually on the PC.
   // HOWEVER, we can simulate ducking visually or via opacity if we could overlay audio, but iframe audio is separate.
   // FIX: We can mask the iframe with a pointer-events-none div, but volume control requires 'enablejsapi=1' and postMessage.
   
   useEffect(() => {
      if (!playerRef.current || !videoId) return;
      const iframe = playerRef.current;
      
      // Basic Volume Ducking implementation via postMessage
      if (iframe.contentWindow) {
         const vol = highlight ? 10 : 60; // Lower volume when highlight (calling password)
         iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [vol]
         }), '*');
      }
   }, [highlight, videoId]);

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
   if (!music.videoId || !music.isPlaying) return (
      <div className="h-32 flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900/50">
         <div className="flex items-center gap-3 opacity-30">
            <Music className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Som Ambiente Off</span>
         </div>
      </div>
   );

   return (
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
         {/* Animated Bar Visualizer (Fake) */}
         <div className="absolute bottom-0 left-0 right-0 h-1 flex items-end gap-0.5 opacity-30">
            {[...Array(20)].map((_, i) => (
               <div key={i} className="flex-1 bg-brand-500 animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}></div>
            ))}
         </div>
         
         <img src={music.thumbnail} className="w-20 h-20 rounded-lg object-cover shadow-lg relative z-10" />
         <div className="flex-1 min-w-0 relative z-10">
             <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Tocando Agora</span>
             </div>
             <p className="text-white font-bold leading-tight line-clamp-2 text-lg">{music.title}</p>
         </div>
      </div>
   );
};


export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = '#0f172a'; 
    document.body.style.overflow = 'hidden'; 
    return () => { 
      document.body.style.backgroundColor = ''; 
      document.body.style.overflow = '';
    };
  }, []);

  // --- AUDIO LOGIC ---
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
      masterGain.gain.value = 0.5; 

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

  useEffect(() => {
    if (!hasStarted) return;
    if (lastUpdateTimestamp > 0 && queueState.currentTicket > 0) {
      setHighlight(true);
      playDingDong();
      
      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         const text = `Senha ${queueState.currentTicket}, Balcão ${queueState.lastCalledDesk}`;
         const msg = new SpeechSynthesisUtterance(text);
         msg.lang = 'pt-BR';
         msg.rate = 0.9; 
         setTimeout(() => window.speechSynthesis.speak(msg), 1500); 
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
             <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-sm">Toque para Iniciar Sistema</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex overflow-hidden font-display relative select-none">
      
      <MusicPlayer videoId={queueState.music?.videoId} isPlaying={queueState.music?.isPlaying} highlight={highlight} />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0B1120] z-0"></div>
      
      {/* LEFT: MAIN (65%) */}
      <div className="w-[65%] z-10 flex flex-col relative border-r border-slate-800/50">
         
         {/* CLEAN AREA - NO HEADER */}
         <div className="flex-1 flex flex-col items-center justify-center relative">
            
            {/* Dynamic Glow Effect */}
            <div className={`
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] 
              bg-brand-600/20 rounded-full blur-[100px] transition-all duration-1000
              ${highlight ? 'opacity-100 scale-125' : 'opacity-10 scale-90'}
            `}></div>

            <p className="text-slate-400 uppercase tracking-[0.5em] font-bold text-xl mb-8 relative z-10 opacity-60">
              Senha Atual
            </p>
            
            {/* O NÚMERO GIGANTE (CHANGED FONT TO SANS TO FIX ZERO) */}
            <div className={`
               font-sans font-bold tracking-tighter relative z-10 transition-all duration-500 leading-none
               ${highlight ? 'text-white scale-125 drop-shadow-[0_0_80px_rgba(255,255,255,0.6)]' : 'text-slate-100'}
            `} style={{ fontSize: '20rem' }}>
               {String(queueState.currentTicket).padStart(3, '0')}
            </div>
            
            <div className={`
               mt-20 text-center relative z-10 bg-slate-900/40 backdrop-blur-md px-16 py-8 rounded-3xl border border-slate-800/50 shadow-2xl transition-transform duration-500
               ${highlight ? 'translate-y-4 scale-110 border-brand-500/30' : ''}
            `}>
               <p className="text-slate-500 uppercase tracking-widest text-sm font-bold mb-3">Dirija-se ao</p>
               <div className={`text-7xl font-bold transition-colors duration-300 ${highlight ? 'text-brand-400' : 'text-white'}`}>
                  {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
               </div>
            </div>
         </div>
      </div>

      {/* RIGHT: SIDEBAR (35%) */}
      <div className="w-[35%] z-10 bg-slate-900/60 flex flex-col backdrop-blur-md border-l border-slate-800/50">
         
         {/* TOP: CLOCK & WEATHER */}
         <div className="p-10 border-b border-slate-800/50 bg-slate-900/50 flex flex-col gap-8">
            <div className="flex justify-between items-start">
               <DigitalClock />
               <WeatherWidget />
            </div>
         </div>
         
         {/* MIDDLE: MUSIC */}
         <div className="p-6 border-b border-slate-800/50">
            <NowPlaying music={queueState.music} />
         </div>

         {/* BOTTOM: HISTORY */}
         <div className="flex-1 p-8 flex flex-col overflow-hidden">
            <h3 className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-3">
               <Clock className="w-4 h-4" /> Últimas Chamadas
            </h3>

            <div className="flex-1 flex flex-col gap-4">
               {queueState.history.slice(0, 4).map((t, i) => (
                  <div key={i} className={`
                     flex items-center justify-between p-5 rounded-xl border transition-all duration-500
                     ${i === 0 && highlight 
                        ? 'bg-brand-600 border-brand-500 translate-x-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
                        : 'bg-slate-800/40 border-slate-700/30 text-slate-400'}
                  `}>
                     <span className={`text-4xl font-sans font-bold tracking-tight ${i === 0 && highlight ? 'text-white' : 'text-slate-300'}`}>
                        {String(t.number).padStart(3, '0')}
                     </span>
                     <div className="text-right">
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${i === 0 && highlight ? 'text-brand-200' : 'opacity-40'}`}>Balcão</p>
                        <p className={`text-xl font-bold ${i === 0 && highlight ? 'text-white' : 'text-slate-500'}`}>
                           {String(t.desk).padStart(2, '0')}
                        </p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
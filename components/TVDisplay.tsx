import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const WeatherWidget: React.FC = () => {
  return (
    <div className="flex items-center gap-3 text-slate-400 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
      <Cloud className="w-6 h-6 text-slate-300" />
      <span className="text-xl font-bold text-white">24°C</span>
      <span className="text-xs uppercase tracking-wider font-bold ml-2 border-l border-white/20 pl-3">Piracicaba</span>
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
    <div className="flex flex-col items-end">
      <div className="text-6xl font-sans font-bold text-white tracking-tight leading-none tabular-nums">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mt-1">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

const MusicPlayer = ({ videoId, isPlaying, volume }: any) => {
   const playerRef = useRef<any>(null);

   useEffect(() => {
       if (!window.YT) {
           const tag = document.createElement('script');
           tag.src = "https://www.youtube.com/iframe_api";
           const firstScriptTag = document.getElementsByTagName('script')[0];
           firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
       }
   }, []);

   useEffect(() => {
       if (!window.YT || !videoId) return;

       const createPlayer = () => {
           if (playerRef.current) {
                playerRef.current.loadVideoById(videoId);
                return;
           }
           playerRef.current = new window.YT.Player('yt-player-frame', {
               height: '1', width: '1', // Hidden
               playerVars: {
                   'autoplay': 1, 'controls': 0, 'disablekb': 1, 'fs': 0, 'rel': 0, 
                   'showinfo': 0, 'modestbranding': 1, 'mute': 0, 'loop': 1,
                   'playlist': videoId // Loop single video or playlist
               },
               events: {
                   'onReady': (event: any) => {
                       event.target.setVolume(volume);
                       if(isPlaying) event.target.playVideo();
                   }
               }
           });
       };
       if (window.YT && window.YT.Player) createPlayer();
       else window.onYouTubeIframeAPIReady = createPlayer;
   }, [videoId]);

   useEffect(() => {
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(volume);
      }
   }, [volume]);

   useEffect(() => {
       if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
           if (isPlaying) playerRef.current.playVideo();
           else playerRef.current.pauseVideo();
       }
   }, [isPlaying]);

   return <div id="yt-player-frame" className="absolute bottom-0 left-0 opacity-0 pointer-events-none w-px h-px"></div>;
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    document.body.style.background = 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)'; // Clean dark gradient
    document.body.style.overflow = 'hidden'; 
    return () => { document.body.style.background = ''; };
  }, []);

  const startTVExperience = () => {
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
      masterGain.gain.value = 1.0; // Alto volume

      // Ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(660, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(1, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Dong
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(550, now + 0.5);
      gain2.gain.setValueAtTime(0, now + 0.5);
      gain2.gain.linearRampToValueAtTime(1, now + 0.55);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.5);
      osc2.stop(now + 2.0);
    } catch (e) { console.error(e); }
  };

  // TTS FIX: Use Google Translate TTS Endpoint (Returns MP3)
  // Smart TVs fail with speechSynthesis, but play Audio() tags perfectly.
  const speak = (ticket: number, desk: string) => {
     const text = `Senha ${ticket}, Balcão ${desk}`;
     const safeText = encodeURIComponent(text);
     // This API returns an MP3 file
     const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${safeText}`;
     
     try {
         const audio = new Audio(url);
         audio.play().catch(e => console.error("TTS Play Blocked", e));
     } catch (e) {
         console.error("Audio creation failed", e);
     }
  };

  useEffect(() => {
    if (hasStarted && queueState.currentTicket > 0) {
      setHighlight(true);
      playDingDong();
      
      // Delay speech slightly to not overlap with Ding
      setTimeout(() => {
          speak(queueState.currentTicket, queueState.lastCalledDesk || '01');
      }, 1000);

      const timer = setTimeout(() => setHighlight(false), 5000); 
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, queueState.currentTicket]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans select-none relative">
      
      <MusicPlayer 
         videoId={queueState.music?.videoId} 
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
      />

      {!hasStarted && (
        <div 
          onClick={startTVExperience} 
          className="absolute inset-0 z-[9999] bg-slate-900/90 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
        >
             <div className="w-32 h-32 bg-brand-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)] animate-pulse mb-6">
                <Music className="w-12 h-12 text-white" />
             </div>
             <h1 className="text-4xl font-bold text-white mb-2">Toque para Iniciar</h1>
             <p className="text-slate-400">Ativa Som e Vídeo</p>
        </div>
      )}

      {/* --- MAIN GRID --- */}
      <div className="flex h-full p-8 gap-8">
         
         {/* LEFT: BIG TICKET (70%) */}
         <div className="flex-[2] flex flex-col relative bg-slate-900/50 rounded-[3rem] border border-slate-800/50 backdrop-blur-md shadow-2xl overflow-hidden">
             
             {/* Info Bar */}
             <div className="absolute top-8 left-8 flex items-center gap-4 opacity-50">
                 <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <span className="text-xs uppercase font-bold tracking-widest">Sistema Conectado</span>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center w-full">
                 <h2 className="text-slate-500 font-bold text-3xl uppercase tracking-[0.4em] mb-4">Senha Atual</h2>
                 
                 {/* BIG NUMBER - Sans Serif, Clean Zero */}
                 <div className={`
                     text-[22rem] leading-none font-bold tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-300
                     ${highlight ? 'text-white scale-110' : 'text-slate-200 scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 <div className={`
                     mt-12 rounded-2xl px-12 py-6 border-2 flex flex-col items-center justify-center transition-all duration-500
                     ${highlight 
                        ? 'bg-brand-600 border-brand-400 shadow-[0_0_60px_rgba(37,99,235,0.4)] scale-105' 
                        : 'bg-slate-800/50 border-white/5 text-slate-400'}
                 `}>
                     <span className="font-bold uppercase tracking-[0.2em] text-sm mb-1 opacity-70">Dirija-se ao</span>
                     <span className="text-6xl font-bold leading-none">
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT: SIDEBAR (30%) */}
         <div className="flex-1 flex flex-col gap-6">
             
             {/* Header Widgets */}
             <div className="flex justify-between items-center bg-slate-900/50 rounded-3xl p-6 border border-white/5 shadow-lg">
                 <WeatherWidget />
                 <DigitalClock />
             </div>

             {/* History List */}
             <div className="flex-1 bg-slate-900/50 rounded-3xl border border-white/5 shadow-lg flex flex-col overflow-hidden p-6 relative">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Histórico Recente</span>
                 </div>

                 <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    {queueState.history.slice(0, 5).map((t, i) => (
                       <div key={i} className={`
                          flex items-center justify-between p-5 rounded-2xl border transition-all duration-500
                          ${i === 0 && highlight 
                             ? 'bg-brand-500/20 border-brand-500/50 scale-105 z-10' 
                             : 'bg-black/20 border-white/5'}
                       `}>
                          <span className={`text-5xl font-sans font-bold tracking-tight ${i === 0 && highlight ? 'text-white' : 'text-slate-500'}`}>
                             {String(t.number).padStart(3, '0')}
                          </span>
                          <div className="text-right">
                             <span className={`text-2xl font-bold ${i === 0 && highlight ? 'text-brand-400' : 'text-slate-600'}`}>
                                Balcão {String(t.desk).padStart(2, '0')}
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>

                 {/* Music Info at Bottom */}
                 {queueState.music?.isPlaying && (
                     <div className="absolute bottom-0 left-0 w-full p-4 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <div className="overflow-hidden">
                            <p className="text-xs text-slate-400 uppercase font-bold">Rádio Loja</p>
                            <p className="text-sm font-bold text-white truncate">{queueState.music.title || 'Música Ambiente'}</p>
                         </div>
                     </div>
                 )}
             </div>

         </div>
      </div>
    </div>
  );
};
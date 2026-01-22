import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music, CloudLightning, CloudDrizzle, CalendarDays } from 'lucide-react';

// --- REAL WEATHER WIDGET ---
const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-22.7253&longitude=-47.6492&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo'
        );
        const data = await res.json();
        setWeather(data);
      } catch (e) {
        console.error("Weather fetch error", e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); 
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number, className = "w-5 h-5") => {
    if (code <= 1) return <Sun className={`${className} text-amber-400`} />;
    if (code <= 3) return <Cloud className={`${className} text-slate-400`} />;
    if (code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
    if (code >= 95) return <CloudLightning className={`${className} text-purple-400`} />;
    return <CloudDrizzle className={`${className} text-blue-300`} />;
  };

  if (!weather) return <div className="text-slate-500 text-xs">...</div>;

  const currentTemp = Math.round(weather.current.temperature_2m);
  const currentCode = weather.current.weather_code;

  return (
    <div className="flex flex-col justify-center items-center bg-slate-800/80 rounded-2xl border border-slate-700 h-full w-full relative overflow-hidden">
       <div className="flex items-center gap-4 relative z-10">
          <div className="animate-pulse-slow">
            {getWeatherIcon(currentCode, "w-10 h-10")}
          </div>
          <div className="flex flex-col">
             <span className="text-4xl font-bold text-white tracking-tighter leading-none">{currentTemp}°</span>
             <div className="flex items-center gap-1 mt-1 text-slate-400">
                <MapPin className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Piracicaba</span>
             </div>
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
    <div className="flex flex-col justify-center items-center bg-slate-800/80 rounded-2xl border border-slate-700 h-full w-full relative overflow-hidden">
      <div className="relative z-10 text-center">
          <div className="text-[5vh] font-sans font-bold text-white tracking-tight leading-none tabular-nums">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-brand-400">
            <CalendarDays className="w-4 h-4" />
            <div className="text-[1.2vh] font-bold uppercase tracking-[0.15em]">
                {time.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}
            </div>
          </div>
      </div>
    </div>
  );
};

// --- YOUTUBE PLAYER ---
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

const MusicPlayer = ({ 
    videoId, 
    playlistId,
    isPlaying, 
    volume, 
    ducking, 
    command 
}: { 
    videoId: string | null, 
    playlistId: string | null,
    isPlaying: boolean, 
    volume: number, 
    ducking: boolean,
    command: { action: string, timestamp: number } | null
}) => {
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
       if (!window.YT || (!videoId && !playlistId)) return;

       const createPlayer = () => {
           if (playerRef.current) {
                // If player exists, just load new content
                if (playlistId) playerRef.current.loadPlaylist({ list: playlistId, listType: 'playlist' });
                else if (videoId) playerRef.current.loadVideoById(videoId);
                return;
           }

           playerRef.current = new window.YT.Player('yt-player-frame', {
               height: '1',
               width: '1',
               playerVars: {
                   'autoplay': 1,
                   'controls': 0,
                   'disablekb': 1,
                   'fs': 0,
                   'rel': 0,
                   'listType': playlistId ? 'playlist' : undefined,
                   'list': playlistId,
                   'loop': 1,
                   'playsinline': 1,
                   'origin': window.location.origin 
               },
               events: {
                   'onReady': (event: any) => {
                       event.target.setVolume(volume);
                       if (isPlaying) {
                           event.target.playVideo();
                       }
                   },
                   'onStateChange': (event: any) => {
                        if (event.data === 0 && playlistId) {
                            event.target.nextVideo();
                        }
                   }
               }
           });
       };

       if (window.YT && window.YT.Player) {
           createPlayer();
       } else {
           window.onYouTubeIframeAPIReady = createPlayer;
       }

   }, [videoId, playlistId]);

   // Handle Remote Commands
   useEffect(() => {
       if (!playerRef.current || !command) return;
       const player = playerRef.current;
       if (typeof player.playVideo !== 'function') return;

       switch(command.action) {
           case 'play': player.playVideo(); break;
           case 'pause': player.pauseVideo(); break;
           case 'next': player.nextVideo(); break;
           case 'prev': player.previousVideo(); break;
       }
   }, [command]);

   // Handle Volume Ducking
   useEffect(() => {
      if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
      const targetVolume = ducking ? 10 : volume; 
      playerRef.current.setVolume(targetVolume);
   }, [ducking, volume]);

   return <div id="yt-player-frame" className="absolute opacity-0 pointer-events-none"></div>;
};

// Moved inside Sidebar to avoid overlap
const NowPlayingWidget = ({ music }: { music: any }) => {
   if ((!music.videoId && !music.playlistId) || !music.isPlaying) return (
       <div className="mt-auto bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 flex items-center justify-center gap-2 text-slate-600">
           <Music className="w-4 h-4" />
           <span className="text-xs font-medium uppercase tracking-wider">Silêncio</span>
       </div>
   );

   return (
      <div className="mt-auto bg-slate-800 rounded-2xl border border-blue-900/30 p-4 flex items-center gap-3 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-[#2563eb]"></div>
         
         <div className="relative shrink-0">
            <img src={music.thumbnail} className="w-10 h-10 rounded-md object-cover bg-slate-900" />
         </div>
         <div className="flex-1 min-w-0 z-10">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Som Ambiente</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
             </div>
             <p className="text-white font-bold leading-tight line-clamp-1 text-xs">{music.title}</p>
         </div>
      </div>
   );
};

export const TVDisplay: React.FC = () => {
  const { queueState, lastUpdateTimestamp, playerCommand } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const lastPlayedTicketRef = useRef(0);

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
      
      const ctx = audioCtxRef.current;
      if (ctx) {
        // Unlock browser audio policy
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        // Play a silent sound to force wake up audio subsystem
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.1);
      }
      
      setHasStarted(true);
    } catch (e) { setHasStarted(true); }
  };

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') {
         // Attempt recovery
         if(ctx) ctx.resume();
         return; 
      }
      
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = 1.0; // Max volume

      // "Ding" - High Tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(660, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(1, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // "Dong" - Low Tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
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

  const speak = (ticket: number, desk: string) => {
     if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         // Delay speech slightly to allow Visuals + DingDong to happen first
         setTimeout(() => {
            const text = `Senha, ${ticket}. Balcão, ${desk}`;
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'pt-BR';
            msg.rate = 1.0;
            msg.volume = 1.0;
            window.speechSynthesis.speak(msg);
         }, 1200);
      }
  };

  useEffect(() => {
    if (!hasStarted) return;
    
    const isNewTicket = queueState.currentTicket !== lastPlayedTicketRef.current;
    const isRecall = (queueState as any).recall === true;
    
    if ((queueState.currentTicket > 0) && (isNewTicket || isRecall)) {
      
      // Update ref immediately to prevent double firing
      lastPlayedTicketRef.current = queueState.currentTicket;

      // 1. Play Sound Immediately (Audio is faster than React render on slow TV)
      // Actually, we delay slightly to let React render the NEW number first
      setTimeout(() => {
          setHighlight(true);
          playDingDong();
          speak(queueState.currentTicket, queueState.lastCalledDesk || '??');
      }, 300); // 300ms delay to ensure DOM updated the number before attention is drawn

      // 2. Turn off highlight after animation
      const timer = setTimeout(() => setHighlight(false), 5000); 
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, queueState.currentTicket, (queueState as any).recall]);

  if (!hasStarted) {
    return (
      <div onClick={initAudioSystem} className="h-screen w-screen bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden relative">
        <div className="z-10 text-center">
           <div className="w-24 h-24 bg-[#2563eb] rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-slate-800 animate-pulse mb-6">
              <Music className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-3xl font-bold text-white mb-2">AutoParts TV</h1>
           <p className="text-slate-400 text-sm uppercase tracking-widest">Toque para iniciar Áudio e Vídeo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex overflow-hidden font-sans relative select-none">
      
      <MusicPlayer 
         videoId={queueState.music?.videoId} 
         playlistId={queueState.music?.playlistId}
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         ducking={highlight} 
         command={playerCommand}
      />

      {/* --- LAYOUT OPTIMIZED FOR 720p 32" TV --- */}
      <div className="absolute inset-0 z-10 grid grid-cols-12 gap-0 p-6">
         
         {/* LEFT: MAIN DISPLAY (8 cols) */}
         <div className="col-span-8 flex flex-col items-center justify-center relative border-r border-slate-800 pr-6">
             
             <div className="flex flex-col items-center w-full">
                 <h2 className="text-slate-500 font-bold text-[3vh] uppercase tracking-[0.4em] mb-[2vh]">Senha Atual</h2>
                 
                 {/* NUMBER - Removed Text-Shadow for Performance */}
                 <div className={`
                     text-[45vh] leading-none font-bold tracking-tighter transition-all duration-300
                     ${highlight 
                        ? 'text-[#2563eb] animate-pop-blue scale-110' 
                        : 'text-white scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 {/* DESK */}
                 <div className={`
                     mt-[4vh] bg-slate-800 rounded-3xl w-[85%] py-[3vh] border
                     flex flex-col items-center gap-1 transition-colors duration-500
                     ${highlight ? 'border-[#2563eb] bg-blue-900/20' : 'border-slate-700'}
                 `}>
                     <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[1.5vh]">Dirija-se ao</span>
                     <span className={`text-[8vh] font-bold leading-none ${highlight ? 'text-blue-400' : 'text-white'}`}>
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT: SIDEBAR (4 cols) */}
         <div className="col-span-4 flex flex-col h-full pl-6 py-2 gap-4">
             
             {/* TOP: CLOCK & WEATHER */}
             <div className="h-[18%] flex gap-4">
                <div className="flex-1"><DigitalClock /></div>
                <div className="flex-1"><WeatherWidget /></div>
             </div>

             {/* MIDDLE: HISTORY */}
             <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 flex flex-col overflow-hidden relative">
                 <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase tracking-widest text-xs border-b border-slate-700 pb-2">
                    <Clock className="w-3 h-3 text-[#2563eb]" />
                    Últimas Chamadas
                 </div>

                 <div className="flex-1 flex flex-col gap-2">
                    {queueState.history.slice(0, 5).map((t, i) => {
                       // Reduce opacity for older items
                       const opacity = 1 - (i * 0.15); 
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-3 rounded-xl border transition-all duration-500
                             ${i === 0 && highlight 
                                ? 'bg-[#2563eb]/20 border-[#2563eb] scale-105' 
                                : 'bg-slate-800 border-slate-700/50'}
                          `}>
                             <span className={`text-3xl font-bold tracking-tight ${i === 0 && highlight ? 'text-[#2563eb]' : 'text-slate-300'}`}>
                                {String(t.number).padStart(3, '0')}
                             </span>
                             <div className="text-right">
                                <span className={`text-lg font-bold ${i === 0 && highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                                   Balcão {String(t.desk).padStart(2, '0')}
                                </span>
                             </div>
                          </div>
                       );
                    })}
                 </div>
             </div>

             {/* BOTTOM: NOW PLAYING (Safe zone, no overlap) */}
             <div className="h-[12%] min-h-[80px]">
                 <NowPlayingWidget music={queueState.music} />
             </div>

         </div>

      </div>
    </div>
  );
};
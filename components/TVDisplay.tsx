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
    <div className="flex flex-col justify-center items-center bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl h-full w-full relative overflow-hidden group">
       <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
       
       <div className="flex items-center gap-4 relative z-10">
          <div className="animate-pulse-slow drop-shadow-lg">
            {getWeatherIcon(currentCode, "w-12 h-12")}
          </div>
          <div className="flex flex-col">
             <span className="text-5xl font-bold text-white tracking-tighter leading-none">{currentTemp}°</span>
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
    <div className="flex flex-col justify-center items-center bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl h-full w-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <div className="relative z-10 text-center">
          <div className="text-[5vh] font-sans font-bold text-white tracking-tight leading-none tabular-nums drop-shadow-2xl">
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
   const currentVolRef = useRef(volume);

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
           if (playerRef.current) playerRef.current.destroy();

           playerRef.current = new window.YT.Player('yt-player-frame', {
               height: '1',
               width: '1',
               playerVars: {
                   'autoplay': 1, // FORCE AUTOPLAY
                   'controls': 0,
                   'disablekb': 1,
                   'fs': 0,
                   'rel': 0,
                   'listType': playlistId ? 'playlist' : undefined,
                   'list': playlistId,
                   'loop': 1, // Loop playlists
                   'playsinline': 1,
               },
               events: {
                   'onReady': (event: any) => {
                       event.target.setVolume(volume);
                       if (isPlaying) {
                           event.target.playVideo();
                       }
                   },
                   'onStateChange': (event: any) => {
                        // If ended (0), play next
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
      const targetVolume = ducking ? 10 : volume; // Duck to 10%
      playerRef.current.setVolume(targetVolume);
      currentVolRef.current = targetVolume;
   }, [ducking, volume]);

   return <div id="yt-player-frame" className="absolute opacity-0 pointer-events-none"></div>;
};

const NowPlaying = ({ music }: { music: any }) => {
   if ((!music.videoId && !music.playlistId) || !music.isPlaying) return null;

   return (
      <div className="absolute bottom-6 left-8 z-30 flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl pr-8 max-w-[35vw] animate-in slide-in-from-bottom-10 fade-in duration-700 shadow-2xl">
         <div className="relative shrink-0">
            <img src={music.thumbnail} className="w-12 h-12 rounded-lg object-cover shadow-lg ring-1 ring-white/10" />
            <div className="absolute -bottom-2 -right-2 bg-[#2563eb] rounded-full p-1.5 shadow-lg flex items-center justify-center">
               <Music className="w-3 h-3 text-white animate-spin-slow" />
            </div>
         </div>
         <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tocando Agora</span>
             </div>
             <p className="text-white font-bold leading-tight line-clamp-1 text-sm">{music.title}</p>
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
      masterGain.gain.value = 0.8;

      // Elegant Ding Dong
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine'; // Smoother sine wave
      osc1.frequency.setValueAtTime(600, now);
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
      osc2.frequency.setValueAtTime(450, now + 0.8); // Lower pitch for Dong
      gain2.gain.setValueAtTime(0, now + 0.8);
      gain2.gain.linearRampToValueAtTime(1, now + 0.85);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.8);
      osc2.stop(now + 3.0);

    } catch (e) { console.error(e); }
  };

  const speak = (ticket: number, desk: string) => {
     if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         // Small delay to let Ding Dong finish partialy
         setTimeout(() => {
            const text = `Senha, ${ticket}. Balcão, ${desk}`;
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'pt-BR';
            msg.rate = 0.9; // Slightly slower for clarity
            window.speechSynthesis.speak(msg);
         }, 1000);
      }
  };

  useEffect(() => {
    if (!hasStarted) return;
    
    const isNewTicket = queueState.currentTicket !== lastPlayedTicketRef.current;
    
    const shouldPlay = (queueState.currentTicket > 0) && (
       isNewTicket || 
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
      <div onClick={initAudioSystem} className="h-screen w-screen bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="text-center space-y-8 animate-pulse relative z-10">
           <div className="w-32 h-32 bg-[#2563eb] rounded-[2rem] mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.6)] border border-blue-400/30">
              <Clock className="w-16 h-16 text-white" />
           </div>
           <div>
             <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Queue Master TV</h1>
             <p className="text-blue-200 font-bold tracking-[0.2em] uppercase text-sm border border-blue-500/30 bg-blue-500/10 py-3 px-8 rounded-full inline-block backdrop-blur-md">
                Toque para Iniciar Sistema
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
         playlistId={queueState.music?.playlistId}
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         ducking={highlight} 
         command={playerCommand}
      />

      <NowPlaying music={queueState.music} />

      {/* Modern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] z-0 pointer-events-none mix-blend-overlay"></div>

      {/* --- NEW GRID LAYOUT WITH GAPS --- */}
      <div className="absolute inset-0 z-10 grid grid-cols-12 gap-0 p-8">
         
         {/* LEFT COLUMN: MAIN DISPLAY (Col Span 8) */}
         <div className="col-span-8 flex flex-col items-center justify-center relative">
             
             {/* Dynamic Glow Background */}
             <div className={`
                 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%]
                 rounded-full blur-[120px] transition-all duration-700 ease-out
                 ${highlight ? 'bg-[#2563eb]/30 opacity-100 scale-110' : 'bg-[#2563eb]/5 opacity-10 scale-90'}
             `}></div>

             <div className="relative z-10 flex flex-col items-center w-full">
                 <h2 className="text-blue-200/50 font-bold text-[3vh] uppercase tracking-[0.6em] mb-[4vh] animate-pulse">Senha Atual</h2>
                 
                 {/* BIG NUMBER - POP ANIMATION BLUE */}
                 <div className={`
                     text-[42vh] leading-none font-bold tracking-tighter transition-all duration-300
                     ${highlight 
                        ? 'text-[#2563eb] animate-pop-blue drop-shadow-[0_0_100px_rgba(37,99,235,0.8)]' 
                        : 'text-white scale-100 drop-shadow-2xl'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 {/* DESK CARD */}
                 <div className={`
                     mt-[6vh] backdrop-blur-2xl border rounded-[2rem] w-[80%] max-w-3xl py-[4vh]
                     flex flex-col items-center gap-2 shadow-2xl transition-all duration-700
                     ${highlight 
                        ? 'border-[#2563eb]/50 bg-[#2563eb]/20 translate-y-0 shadow-[#2563eb]/20' 
                        : 'border-slate-800/50 bg-slate-900/40 shadow-black/50'}
                 `}>
                     <span className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[1.8vh]">Dirija-se ao</span>
                     <span className={`text-[10vh] font-bold leading-none ${highlight ? 'text-blue-100' : 'text-white'}`}>
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT COLUMN: SIDEBAR (Col Span 4) */}
         {/* Added large left padding/gap to visually separate from main number */}
         <div className="col-span-4 flex flex-col h-full pl-8 py-4 gap-6">
             
             {/* TOP WIDGETS ROW - SEPARATED */}
             <div className="h-[22%] flex gap-6">
                <div className="flex-1">
                   <DigitalClock />
                </div>
                <div className="flex-1">
                   <WeatherWidget />
                </div>
             </div>

             {/* HISTORY LIST - SEPARATED CONTAINER */}
             <div className="flex-1 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-6 flex flex-col shadow-2xl overflow-hidden relative">
                 <div className="flex items-center gap-3 mb-6 text-slate-500 font-bold uppercase tracking-widest text-sm shrink-0 border-b border-slate-800 pb-4">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Últimas Chamadas
                 </div>

                 <div className="flex-1 flex flex-col gap-3">
                    {queueState.history.slice(0, 6).map((t, i) => {
                       const opacity = i === 0 ? 1 : i === 1 ? 0.8 : i === 2 ? 0.6 : i === 3 ? 0.4 : 0.2;
                       
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-4 rounded-2xl border transition-all duration-700
                             ${i === 0 && highlight 
                                ? 'bg-[#2563eb]/20 border-[#2563eb]/50 scale-[1.02] shadow-lg shadow-blue-900/20 translate-x-2' 
                                : 'bg-slate-800/30 border-slate-700/30'}
                          `}>
                             <span className={`text-4xl font-bold tracking-tight leading-none ${i === 0 && highlight ? 'text-[#2563eb]' : 'text-slate-300'}`}>
                                {String(t.number).padStart(3, '0')}
                             </span>
                             <div className="text-right leading-tight">
                                <span className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Balcão</span>
                                <span className={`text-xl font-bold ${i === 0 && highlight ? 'text-blue-200' : 'text-slate-400'}`}>
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
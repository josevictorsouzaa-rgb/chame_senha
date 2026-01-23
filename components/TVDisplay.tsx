import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music, CloudLightning, CloudDrizzle } from 'lucide-react';

// --- REAL WEATHER WIDGET (PIRACICABA) ---
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

  const getWeatherLabel = (code: number) => {
    if (code <= 1) return "Ensolarado";
    if (code <= 3) return "Nublado";
    if (code <= 67) return "Chuvoso";
    if (code >= 95) return "Tempestade";
    return "Instável";
  };

  if (!weather) return <div className="text-slate-500 text-xs">...</div>;

  const currentTemp = Math.round(weather.current.temperature_2m);
  const currentCode = weather.current.weather_code;
  
  const daily = weather.daily;
  const days = daily.time.slice(1, 4).map((t: string, i: number) => {
    const date = new Date(t);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    return {
      name: dayName,
      max: Math.round(daily.temperature_2m_max[i + 1]),
      code: daily.weather_code[i + 1]
    };
  });

  return (
    <div className="flex flex-col bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-slate-700/50 shadow-lg h-full justify-between">
       <div className="flex items-center gap-1.5 text-brand-300 mb-1">
          <MapPin className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Piracicaba, SP</span>
       </div>
       
       <div className="flex items-center gap-3">
          <div className="animate-pulse-slow">
            {getWeatherIcon(currentCode, "w-8 h-8")}
          </div>
          <div className="flex flex-col">
             <span className="text-3xl font-bold text-white tracking-tighter leading-none">{currentTemp}°</span>
             <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wide">{getWeatherLabel(currentCode)}</span>
          </div>
       </div>
       
       <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700/50 mt-1">
          {days.map((d: any, i: number) => (
             <div key={i} className="flex flex-col items-center justify-center p-1 rounded bg-slate-800/40">
                <span className="text-[8px] font-bold text-slate-400 uppercase">{d.name}</span>
                <span className="text-[10px] font-bold text-white">{d.max}°</span>
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
    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-slate-700/50 shadow-lg text-center h-full flex flex-col justify-center">
      <div className="text-[4vh] font-sans font-bold text-white tracking-tight leading-none tabular-nums">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-brand-400 text-[1vh] font-bold uppercase tracking-[0.2em] mt-1">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

// --- YOUTUBE PLAYER WITH PLAYLIST SUPPORT & REMOTE CONTROL ---
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

   // Load YouTube API
   useEffect(() => {
       if (!window.YT) {
           const tag = document.createElement('script');
           tag.src = "https://www.youtube.com/iframe_api";
           const firstScriptTag = document.getElementsByTagName('script')[0];
           firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
       }

       window.onYouTubeIframeAPIReady = () => {
           // Ready state logic handled in init effect
       };
   }, []);

   // Initialize or Update Player
   useEffect(() => {
       if (!window.YT || (!videoId && !playlistId)) return;

       if (!playerRef.current) {
           playerRef.current = new window.YT.Player('yt-player-frame', {
               height: '1',
               width: '1',
               playerVars: {
                   'playsinline': 1,
                   'controls': 0,
                   'disablekb': 1,
                   'fs': 0,
                   'rel': 0, // Minimize related videos
                   'modestbranding': 1,
                   'listType': playlistId ? 'playlist' : undefined,
                   'list': playlistId
               },
               events: {
                   'onReady': (event: any) => {
                       if (isPlaying) event.target.playVideo();
                       event.target.setVolume(volume);
                   }
               }
           });
       } else {
           // If IDs change
           const player = playerRef.current;
           if (playlistId) {
               player.loadPlaylist({ list: playlistId, listType: 'playlist' });
           } else if (videoId) {
               player.loadVideoById(videoId);
           }
       }
   }, [videoId, playlistId]); // Only re-init if content source changes

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
      
      const targetVolume = ducking ? 5 : volume;
      const player = playerRef.current;
      
      const fadeInterval = setInterval(() => {
         const diff = targetVolume - currentVolRef.current;
         if (Math.abs(diff) < 2) {
            currentVolRef.current = targetVolume;
         } else {
            currentVolRef.current += diff * 0.15; 
         }
         player.setVolume(Math.round(currentVolRef.current));
      }, 50);

      return () => clearInterval(fadeInterval);
   }, [ducking, volume]);

   return <div id="yt-player-frame" className="absolute opacity-0 pointer-events-none"></div>;
};

const NowPlaying = ({ music }: { music: any }) => {
   if ((!music.videoId && !music.playlistId) || !music.isPlaying) return null;

   return (
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-3 rounded-xl pr-6 max-w-[30vw] animate-in slide-in-from-bottom-10 fade-in duration-700">
         <div className="relative shrink-0">
            <img src={music.thumbnail} className="w-10 h-10 rounded-lg object-cover shadow-lg" />
            <div className="absolute -bottom-1 -right-1 bg-brand-600 rounded-full p-1 shadow-lg">
               <Music className="w-2 h-2 text-white animate-spin-slow" />
            </div>
         </div>
         <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Som Ambiente</span>
             </div>
             <p className="text-white font-bold leading-tight line-clamp-1 text-xs">{music.title}</p>
         </div>
      </div>
   );
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp, playerCommand } = useQueueSocket();
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

      // Ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(660, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(1, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.2);

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
         msg.rate = 1.0; 
         setTimeout(() => window.speechSynthesis.speak(msg), 1400); 
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

      const timer = setTimeout(() => setHighlight(false), 8000); // 8 seconds highlight
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
         playlistId={queueState.music?.playlistId}
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         ducking={highlight} 
         command={playerCommand}
      />

      <NowPlaying music={queueState.music} />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>

      {/* RIGID GRID LAYOUT - NO OVERLAPPING */}
      <div className="absolute inset-0 z-10 grid grid-cols-12 gap-0">
         
         {/* LEFT COLUMN: MAIN DISPLAY (Col Span 8 = 66%) */}
         <div className="col-span-8 flex flex-col items-center justify-center relative p-8">
             {/* Glow Effect behind number */}
             <div className={`
                 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh]
                 rounded-full blur-[100px] transition-all duration-300 ease-out
                 ${highlight ? 'bg-yellow-500/30 opacity-100 scale-125' : 'bg-brand-600/10 opacity-20 scale-75'}
             `}></div>

             <div className="relative z-10 flex flex-col items-center w-full">
                 <h2 className="text-brand-200/60 font-bold text-[3vh] uppercase tracking-[0.5em] mb-[2vh]">Senha Atual</h2>
                 
                 {/* BIG NUMBER - Turns Yellow on Highlight */}
                 <div className={`
                     text-[40vh] leading-none font-bold tracking-tighter transition-all duration-300 ease-out
                     ${highlight 
                        ? 'text-yellow-400 scale-110 drop-shadow-[0_0_80px_rgba(250,204,21,0.6)] animate-shake' 
                        : 'text-white scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 {/* DESK CARD - Turns Yellowish on Highlight */}
                 <div className={`
                     mt-[4vh] backdrop-blur-xl border rounded-3xl w-[80%] py-[3vh]
                     flex flex-col items-center gap-1 shadow-2xl transition-all duration-500
                     ${highlight 
                        ? 'border-yellow-500/50 bg-yellow-900/40 translate-y-2 shadow-yellow-500/20' 
                        : 'border-slate-700/50 bg-slate-900/60 shadow-black/50'}
                 `}>
                     <span className="text-slate-400 font-bold uppercase tracking-widest text-[1.5vh]">Dirija-se ao</span>
                     <span className={`text-[9vh] font-bold leading-none ${highlight ? 'text-yellow-100' : 'text-white'}`}>
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT COLUMN: SIDEBAR (Col Span 4 = 33%) */}
         <div className="col-span-4 p-[3vh] h-full flex flex-col gap-[2vh] bg-slate-900/20 border-l border-white/5">
             
             {/* TOP WIDGETS (Fixed Height Section: 20%) */}
             <div className="h-[20%] flex gap-[2vh]">
                <div className="flex-1 min-w-0">
                   <DigitalClock />
                </div>
                <div className="flex-1 min-w-0">
                   <WeatherWidget />
                </div>
             </div>

             {/* HISTORY LIST (Remaining Height: 80%) */}
             <div className="h-[80%] bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/50 p-[3vh] flex flex-col shadow-xl overflow-hidden relative">
                 <div className="flex items-center gap-3 mb-[2vh] text-slate-500 font-bold uppercase tracking-widest text-[1.5vh] shrink-0">
                    <Clock className="w-4 h-4" />
                    Últimas Chamadas
                 </div>

                 {/* Scrollable container if needed, but fixed items usually fit */}
                 <div className="flex-1 flex flex-col gap-[1.5vh]">
                    {queueState.history.slice(0, 5).map((t, i) => {
                       const opacity = i === 0 ? 1 : i === 1 ? 0.7 : i === 2 ? 0.45 : i === 3 ? 0.25 : 0.15;
                       
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-[1.8vh] rounded-xl border transition-all duration-500
                             ${i === 0 && highlight 
                                ? 'bg-yellow-500/10 border-yellow-500/50 scale-105 shadow-lg translate-x-1' 
                                : 'bg-slate-800/30 border-slate-700/30'}
                          `}>
                             <span className={`text-[5vh] font-bold tracking-tight leading-none ${i === 0 && highlight ? 'text-yellow-400' : (i===0 ? 'text-white' : 'text-slate-400')}`}>
                                {String(t.number).padStart(3, '0')}
                             </span>
                             <div className="text-right leading-tight">
                                <span className="block text-[1.1vh] uppercase font-bold text-slate-500">Balcão</span>
                                <span className={`text-[2.5vh] font-bold ${i === 0 && highlight ? 'text-yellow-200' : (i===0 ? 'text-brand-300' : 'text-slate-500')}`}>
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

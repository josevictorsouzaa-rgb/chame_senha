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
    <div className="flex flex-col justify-center items-center h-full w-full">
       <div className="flex items-center gap-4">
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
    <div className="flex flex-col justify-center items-center h-full w-full border-r border-slate-700/50">
      <div className="text-center">
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
    command,
    onPlayerReady 
}: { 
    videoId: string | null, 
    playlistId: string | null,
    isPlaying: boolean, 
    volume: number, 
    ducking: boolean,
    command: { action: string, timestamp: number } | null,
    onPlayerReady: (player: any) => void
}) => {
   const playerRef = useRef<any>(null);
   const volumeRef = useRef(volume);

   // Sync volume ref for callbacks
   useEffect(() => { volumeRef.current = volume; }, [volume]);

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
           // Helper to load content
           const loadContent = (player: any) => {
               if (playlistId) {
                   player.loadPlaylist({
                       listType: 'playlist',
                       list: playlistId,
                   });
               } else if (videoId) {
                   player.loadVideoById(videoId);
               }
           };

           if (playerRef.current) {
                loadContent(playerRef.current);
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
                   'mute': 1, // START MUTED TO ALLOW AUTOPLAY ON TV
                   'loop': 1,
                   'playsinline': 1,
                   'origin': window.location.origin,
                   'enablejsapi': 1
               },
               events: {
                   'onReady': (event: any) => {
                       onPlayerReady(event.target);
                       event.target.mute();
                       if (isPlaying) {
                           if (playlistId) {
                               event.target.loadPlaylist({ listType: 'playlist', list: playlistId });
                           } else {
                               event.target.playVideo();
                           }
                       }
                   },
                   'onStateChange': (event: any) => {
                        // YT.PlayerState.ENDED = 0
                        if (event.data === 0 && playlistId) {
                            event.target.nextVideo();
                        }
                   },
                   'onError': (event: any) => {
                       console.log("YT Error", event.data);
                       if (playlistId) event.target.nextVideo();
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

const NowPlayingWidget = ({ music }: { music: any }) => {
   if ((!music.videoId && !music.playlistId) || !music.isPlaying) return (
       <div className="h-full bg-slate-800 rounded-2xl border border-slate-700 p-4 flex items-center justify-center gap-2 text-slate-500">
           <Music className="w-5 h-5" />
           <span className="text-xs font-bold uppercase tracking-wider">Aguardando Música...</span>
       </div>
   );

   return (
      <div className="h-full bg-slate-800 rounded-2xl border border-blue-900/50 p-4 flex items-center gap-4 relative overflow-hidden shadow-lg">
         <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse w-full"></div>
         <div className="relative shrink-0">
            <img src={music.thumbnail} className="w-12 h-12 rounded-lg object-cover bg-slate-900 shadow-md" />
         </div>
         <div className="flex-1 min-w-0 z-10">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tocando Agora</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
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
  const playerApiRef = useRef<any>(null); // REF TO HOLD YT PLAYER INSTANCE
  
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
      // 1. Initialize Audio Context (Ding Dong)
      if (!audioCtxRef.current) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) audioCtxRef.current = new AudioCtor();
      }
      const ctx = audioCtxRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.1);
      }
      
      // 2. Unmute YouTube Player (Bridge User Gesture)
      if (playerApiRef.current && typeof playerApiRef.current.unMute === 'function') {
         console.log("Unmuting player via user gesture...");
         playerApiRef.current.unMute();
         playerApiRef.current.setVolume(queueState.music.volume || 50);
         // Force play to be sure
         if(queueState.music.isPlaying) playerApiRef.current.playVideo();
      }

      setHasStarted(true);
    } catch (e) { 
        console.error(e);
        setHasStarted(true); 
    }
  };

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') {
         if(ctx) ctx.resume();
         return; 
      }
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = 1.0; 

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
    // Only play sound if user has started the context
    if (!hasStarted) return;
    
    const isNewTicket = queueState.currentTicket !== lastPlayedTicketRef.current;
    const isRecall = (queueState as any).recall === true;
    
    if ((queueState.currentTicket > 0) && (isNewTicket || isRecall)) {
      lastPlayedTicketRef.current = queueState.currentTicket;
      setTimeout(() => {
          setHighlight(true);
          playDingDong();
          speak(queueState.currentTicket, queueState.lastCalledDesk || '??');
      }, 300);
      const timer = setTimeout(() => setHighlight(false), 5000); 
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, queueState.currentTicket, (queueState as any).recall]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex overflow-hidden font-sans relative select-none">
      
      {/* ALWAYS RENDER PLAYER TO PRELOAD IT */}
      <MusicPlayer 
         videoId={queueState.music?.videoId} 
         playlistId={queueState.music?.playlistId}
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         ducking={highlight} 
         command={playerCommand}
         onPlayerReady={(player) => {
             playerApiRef.current = player;
         }}
      />

      {/* OVERLAY: CLICK TO START */}
      {!hasStarted && (
        <div 
          onClick={initAudioSystem} 
          className="absolute inset-0 z-50 bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden animate-in fade-in duration-500"
        >
            <div className="z-10 text-center">
                <div className="w-24 h-24 bg-[#2563eb] rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-slate-800 animate-pulse mb-6">
                    <Music className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">AutoParts TV</h1>
                <p className="text-slate-400 text-sm uppercase tracking-widest">Toque para iniciar Áudio e Vídeo</p>
            </div>
        </div>
      )}

      {/* MAIN DISPLAY - HIDDEN UNTIL STARTED (OR JUST BEHIND OVERLAY) */}
      <div className={`absolute inset-0 z-10 grid grid-cols-12 gap-8 p-10 transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
         
         {/* LEFT: MAIN DISPLAY (8 cols) */}
         <div className="col-span-8 flex flex-col items-center justify-center relative bg-slate-900/20 rounded-[3rem] border border-slate-800/50">
             
             <div className="flex flex-col items-center w-full">
                 <h2 className="text-slate-500 font-bold text-[3vh] uppercase tracking-[0.4em] mb-[4vh]">Senha Atual</h2>
                 
                 <div className={`
                     text-[45vh] leading-none font-bold tracking-tighter transition-all duration-300
                     ${highlight 
                        ? 'text-[#2563eb] animate-pop-blue scale-110' 
                        : 'text-white scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 <div className={`
                     mt-[6vh] bg-slate-800 rounded-3xl w-[85%] py-[4vh] border
                     flex flex-col items-center gap-1 transition-colors duration-500 shadow-2xl
                     ${highlight ? 'border-[#2563eb] bg-blue-900/30' : 'border-slate-700'}
                 `}>
                     <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[1.8vh]">Dirija-se ao</span>
                     <span className={`text-[9vh] font-bold leading-none ${highlight ? 'text-blue-400' : 'text-white'}`}>
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT: SIDEBAR (4 cols) - GAP 16 (BIGGER) */}
         <div className="col-span-4 flex flex-col h-full gap-16">
             
             {/* BLOCK 1: CLOCK & WEATHER */}
             <div className="h-[20%] bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex overflow-hidden">
                <div className="flex-1"><DigitalClock /></div>
                <div className="flex-1"><WeatherWidget /></div>
             </div>

             {/* BLOCK 2: HISTORY - STRONGER AGGRESSIVE FADE */}
             <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col overflow-hidden p-6">
                 <div className="flex items-center gap-2 mb-6 text-slate-500 font-bold uppercase tracking-widest text-xs border-b border-slate-700 pb-4">
                    <Clock className="w-3 h-3 text-[#2563eb]" />
                    Últimas Chamadas
                 </div>

                 <div className="flex-1 flex flex-col gap-4">
                    {queueState.history.slice(0, 5).map((t, i) => {
                       // AGGRESSIVE FADE: 100% -> 30% -> 15% -> 10% -> 5%
                       const opacity = i === 0 ? 1 : Math.max(0.05, 0.4 - (i * 0.15));
                       
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-4 rounded-xl border transition-all duration-500 relative overflow-hidden
                             ${i === 0 && highlight 
                                ? 'bg-[#2563eb]/20 border-[#2563eb] scale-105 shadow-lg z-10' 
                                : 'bg-slate-900/50 border-slate-700/50'}
                          `}>
                             {i === 0 && highlight && <div className="absolute left-0 top-0 w-1 h-full bg-[#2563eb]"></div>}
                             <span className={`text-4xl font-bold tracking-tight ${i === 0 && highlight ? 'text-[#2563eb]' : 'text-slate-300'}`}>
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

             {/* BLOCK 3: MUSIC */}
             <div className="h-[15%] min-h-[100px]">
                 <NowPlayingWidget music={queueState.music} />
             </div>

         </div>

      </div>
    </div>
  );
};
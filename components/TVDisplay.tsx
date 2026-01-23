import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music, CloudLightning, CloudDrizzle, CalendarDays, Wifi, WifiOff, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// --- SUB-COMPONENTS ---

const NewsTicker = () => (
  <div className="fixed bottom-0 left-0 w-full bg-lubel-primary text-white h-12 flex items-center overflow-hidden border-t-4 border-yellow-500 z-50 shadow-2xl">
    <div className="animate-marquee whitespace-nowrap font-bold uppercase tracking-[0.15em] text-[2vh] text-yellow-50 drop-shadow-md">
      Bem-vindo à Lubel Auto Peças • Confira nossas ofertas de óleos e filtros • Atendimento de segunda a sexta das 08:00 às 18:00 • Peças originais com garantia • Qualidade e Confiança
    </div>
  </div>
);

const ConnectionStatus = ({ isConnected }: { isConnected: boolean }) => (
  <div className="fixed top-6 right-6 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 z-50">
     <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500 animate-pulse'}`}></div>
     <span className={`text-[1.5vh] font-bold uppercase tracking-wider ${isConnected ? 'text-slate-300' : 'text-red-400'}`}>
        {isConnected ? 'Sistema Online' : 'Reconectando...'}
     </span>
     {isConnected ? <Wifi className="w-4 h-4 text-slate-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
  </div>
);

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
    if (code <= 1) return <Sun className={`${className} text-yellow-400`} />;
    if (code <= 3) return <Cloud className={`${className} text-slate-400`} />;
    if (code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
    if (code >= 95) return <CloudLightning className={`${className} text-purple-400`} />;
    return <CloudDrizzle className={`${className} text-blue-300`} />;
  };

  if (!weather) return <div className="text-slate-600 font-bold text-xs uppercase animate-pulse">Carregando Clima...</div>;

  const currentTemp = Math.round(weather.current.temperature_2m);
  const currentCode = weather.current.weather_code;

  return (
    <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
        <div className="animate-pulse-slow drop-shadow-lg">
           {getWeatherIcon(currentCode, "w-10 h-10")}
        </div>
        <div className="flex flex-col">
            <span className="text-3xl font-bold text-white tracking-tighter leading-none drop-shadow-md">{currentTemp}°</span>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
               <MapPin className="w-3 h-3" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Piracicaba</span>
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
    <div className="flex flex-col items-end">
          <div className="text-[5vh] font-mono font-bold text-white tracking-tight leading-none tabular-nums drop-shadow-lg">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-1 text-yellow-500">
            <CalendarDays className="w-4 h-4" />
            <div className="text-[1.5vh] font-bold uppercase tracking-[0.1em]">
                {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
    </div>
  );
};

// --- YOUTUBE PLAYER ---
const MusicPlayer = ({ 
    videoId, 
    playlistId,
    isPlaying, 
    volume, 
    ducking, 
    command,
    onPlayerReady 
}: any) => {
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
                if (playlistId) playerRef.current.loadPlaylist({ listType: 'playlist', list: playlistId });
                else if (videoId) playerRef.current.loadVideoById(videoId);
                return;
           }

           playerRef.current = new window.YT.Player('yt-player-frame', {
               height: '1', width: '1',
               playerVars: {
                   'autoplay': 1, 'controls': 0, 'disablekb': 1,
                   'fs': 0, 'rel': 0, 'mute': 1, 'loop': 1,
                   'playsinline': 1, 'origin': window.location.origin, 'enablejsapi': 1
               },
               events: {
                   'onReady': (event: any) => {
                       onPlayerReady(event.target);
                       event.target.mute(); // Start muted to satisfy autoplay policy
                       if (isPlaying) {
                           if (playlistId) event.target.loadPlaylist({ listType: 'playlist', list: playlistId });
                           else event.target.playVideo();
                       }
                   },
                   'onStateChange': (event: any) => {
                        if (event.data === 0 && playlistId) event.target.nextVideo();
                   },
                   'onError': (event: any) => {
                       console.log("YT Error", event.data);
                       if (playlistId) event.target.nextVideo();
                   }
               }
           });
       };

       if (window.YT && window.YT.Player) createPlayer();
       else window.onYouTubeIframeAPIReady = createPlayer;

   }, [videoId, playlistId]);

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

   useEffect(() => {
      if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
      const targetVolume = ducking ? 10 : volume; 
      playerRef.current.setVolume(targetVolume);
   }, [ducking, volume]);

   return <div id="yt-player-frame" className="absolute opacity-0 pointer-events-none"></div>;
};

const NowPlayingWidget = ({ music }: { music: any }) => {
   if ((!music.videoId && !music.playlistId) || !music.isPlaying) return (
       <div className="h-full bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 flex items-center justify-center gap-2 text-slate-500">
           <Music className="w-5 h-5" />
           <span className="text-xs font-bold uppercase tracking-wider">Rádio Lubel</span>
       </div>
   );

   return (
      <div className="h-full bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex items-center gap-4 relative overflow-hidden">
         <div className="relative shrink-0">
            <img src={music.thumbnail} className="w-12 h-12 rounded-lg object-cover bg-slate-900 shadow-lg border border-white/10" />
         </div>
         <div className="flex-1 min-w-0 z-10">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">No Ar</span>
                <div className="flex gap-0.5 items-end h-3">
                    <span className="w-1 h-3 bg-green-500 animate-[pulse_0.6s_ease-in-out_infinite]"></span>
                    <span className="w-1 h-2 bg-green-500 animate-[pulse_0.8s_ease-in-out_infinite]"></span>
                    <span className="w-1 h-3 bg-green-500 animate-[pulse_1s_ease-in-out_infinite]"></span>
                </div>
             </div>
             <p className="text-white font-bold leading-tight line-clamp-1 text-sm drop-shadow-md">{music.title}</p>
         </div>
      </div>
   );
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp, playerCommand } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playerApiRef = useRef<any>(null); 
  const lastPlayedTicketRef = useRef(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Force dark gradient background immediately
    document.body.style.background = 'radial-gradient(ellipse at center, #1e293b 0%, #020617 100%)'; 
    document.body.style.overflow = 'hidden'; 

    // 2. Initialize Audio System Logic (Auto-Start Attempt)
    const initAudio = () => {
        try {
            const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtor && !audioCtxRef.current) {
                audioCtxRef.current = new AudioCtor();
                // Create dummy osc to unlock audio engine if allowed
                const ctx = audioCtxRef.current;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                gain.gain.value = 0;
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(0); 
                osc.stop(0.1);
            }

            // Aggressive Unmute Logic
            if (playerApiRef.current && typeof playerApiRef.current.unMute === 'function') {
                console.log("Auto-unmuting player...");
                playerApiRef.current.unMute();
                playerApiRef.current.setVolume(queueState.music.volume || 50);
                if (queueState.music.isPlaying) playerApiRef.current.playVideo();
            }
        } catch (e) { console.error("Audio Init Error", e); }
    };

    // Attempt to init immediately on mount
    initAudio();

    // Also add a global listener to ensure unmute happens on ANY interaction (remote click, keypress)
    const unlockAudio = () => {
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        initAudio();
        // Don't remove listener immediately, keep it for retry
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => { 
        document.body.style.background = ''; 
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
  }, []); // Run once on mount

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') {
         if(ctx) ctx.resume();
      }
      if (!ctx) return;

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
  }, [lastUpdateTimestamp, queueState.currentTicket, (queueState as any).recall]);

  return (
    <div className="h-screen w-screen text-slate-100 flex overflow-hidden font-sans relative select-none pb-12">
      
      <MusicPlayer 
         videoId={queueState.music?.videoId} 
         playlistId={queueState.music?.playlistId}
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         ducking={highlight} 
         command={playerCommand}
         onPlayerReady={(player) => { playerApiRef.current = player; }}
      />

      <ConnectionStatus isConnected={isConnected} />

      {/* MAIN GRID - SAFE AREA PADDING INCREASED */}
      <div className="absolute inset-0 z-10 grid grid-cols-12 gap-10 p-16 pb-20">
         
         {/* LEFT: MAIN DISPLAY (7 cols) */}
         <div className="col-span-7 flex flex-col justify-center relative">
             
             {/* Dynamic Highlight Container */}
             <div className={`
                flex flex-col items-center justify-center w-full aspect-[4/3] rounded-[3rem] border-2 transition-all duration-500
                ${highlight 
                    ? 'bg-blue-900/40 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.2)]' 
                    : 'bg-slate-900/30 border-white/5'}
             `}>
                 <h2 className="text-slate-400 font-bold text-[3vh] uppercase tracking-[0.4em] mb-4">Senha Atual</h2>
                 
                 <div className={`
                     text-[40vh] leading-none font-bold tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-300
                     ${highlight 
                        ? 'text-white scale-110' 
                        : 'text-[#f1f5f9] scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 <div className={`
                     mt-8 rounded-2xl w-[80%] py-6 border-2 flex flex-col items-center gap-1 transition-all duration-500 shadow-2xl
                     ${highlight 
                        ? 'bg-yellow-500 text-blue-950 border-yellow-400 scale-105' 
                        : 'bg-lubel-primary border-white/10 text-white'}
                 `}>
                     <span className={`font-bold uppercase tracking-[0.3em] text-[2vh] ${highlight ? 'text-blue-900' : 'text-slate-400'}`}>Dirija-se ao</span>
                     <span className="text-[10vh] font-bold leading-none">
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT: SIDEBAR (5 cols) */}
         <div className="col-span-5 flex flex-col h-full gap-8">
             
             {/* HEADER: CLOCK & WEATHER */}
             <div className="h-[15%] flex justify-between items-center bg-lubel-surface/80 rounded-2xl p-6 border border-white/5 shadow-card">
                <WeatherWidget />
                <div className="w-px h-12 bg-white/10 mx-4"></div>
                <DigitalClock />
             </div>

             {/* HISTORY */}
             <div className="flex-1 bg-lubel-surface/80 rounded-3xl border border-white/5 shadow-card flex flex-col overflow-hidden p-8 relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
                 
                 <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Últimas Chamadas</span>
                 </div>

                 <div className="flex-1 flex flex-col gap-5">
                    {queueState.history.slice(0, 5).map((t, i) => {
                       const opacity = i === 0 ? 1 : Math.max(0.2, 0.6 - (i * 0.15));
                       const isRetroactive = t.isRetroactive;
                       
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden group
                             ${i === 0 && highlight 
                                ? 'bg-yellow-500/10 border-yellow-500/50 scale-105 z-10' 
                                : 'bg-black/20 border-white/5'}
                          `}>
                             {isRetroactive && (
                                 <div className="absolute right-0 top-0 p-1">
                                    <div className="bg-red-500 text-white text-[8px] font-bold px-1.5 rounded uppercase">Rechamada</div>
                                 </div>
                             )}
                             <span className={`text-5xl font-mono font-bold tracking-tighter drop-shadow-md ${i === 0 && highlight ? 'text-yellow-400' : 'text-slate-200'}`}>
                                {String(t.number).padStart(3, '0')}
                             </span>
                             <div className="text-right">
                                <span className={`text-2xl font-bold ${i === 0 && highlight ? 'text-white' : 'text-slate-500'}`}>
                                   Balcão {String(t.desk).padStart(2, '0')}
                                </span>
                             </div>
                          </div>
                       );
                    })}
                 </div>
             </div>

             {/* MUSIC WIDGET */}
             <div className="h-[12%] min-h-[90px]">
                 <NowPlayingWidget music={queueState.music} />
             </div>

         </div>
      </div>

      <NewsTicker />
    </div>
  );
};
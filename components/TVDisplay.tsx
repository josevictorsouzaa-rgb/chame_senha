import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music, CloudLightning, CloudDrizzle, CalendarDays, Wifi, WifiOff } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// --- SUB-COMPONENTS ---

const NewsTicker = () => (
  <div className="fixed bottom-0 left-0 w-full bg-lubel-primary text-white h-[8vh] max-h-20 flex items-center overflow-hidden border-t-4 border-yellow-500 z-50 shadow-2xl">
    <div className="animate-marquee font-bold uppercase tracking-[0.15em] text-[2.8vh] text-yellow-50 drop-shadow-md leading-none whitespace-nowrap">
      BEM-VINDO À LUBEL AUTO PEÇAS • CONFIRA NOSSAS OFERTAS DE ÓLEOS E FILTROS • ATENDIMENTO DE SEGUNDA A SEXTA DAS 08:00 ÀS 18:00 • PEÇAS ORIGINAIS COM GARANTIA • QUALIDADE E CONFIANÇA
    </div>
  </div>
);

const ConnectionStatus = ({ isConnected }: { isConnected: boolean }) => (
  <div className="fixed top-6 right-6 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 z-50 shadow-lg">
     <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500 animate-pulse'}`}></div>
     <span className={`text-[1.8vh] font-bold uppercase tracking-wider ${isConnected ? 'text-slate-200' : 'text-red-400'}`}>
        {isConnected ? 'ONLINE' : 'OFFLINE'}
     </span>
     {isConnected ? <Wifi className="w-5 h-5 text-slate-300" /> : <WifiOff className="w-5 h-5 text-red-400" />}
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

  if (!weather) return <div className="text-slate-600 font-bold text-xs uppercase animate-pulse">...</div>;

  const currentTemp = Math.round(weather.current.temperature_2m);
  const currentCode = weather.current.weather_code;

  return (
    <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-xl border border-white/5 h-full justify-center w-full">
        <div className="animate-pulse-slow drop-shadow-lg">
           {getWeatherIcon(currentCode, "w-14 h-14")}
        </div>
        <div className="flex flex-col">
            <span className="text-5xl font-bold text-white tracking-tighter leading-none drop-shadow-md">{currentTemp}°</span>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
               <MapPin className="w-3 h-3" />
               <span className="text-[1.2vh] font-bold uppercase tracking-widest">Piracicaba</span>
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
    <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="text-[7vh] font-mono font-bold text-white tracking-tight leading-none tabular-nums drop-shadow-lg">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-yellow-500">
            <CalendarDays className="w-5 h-5" />
            <div className="text-[1.8vh] font-bold uppercase tracking-[0.1em]">
                {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
    </div>
  );
};

// --- MUSIC PLAYER ---
const MusicPlayer = ({ videoId, isPlaying, volume, onPlayerReady }: any) => {
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
               height: '100%', width: '100%',
               playerVars: {
                   'autoplay': 1, 'controls': 0, 'disablekb': 1, 'fs': 0, 'rel': 0, 
                   'showinfo': 0, 'modestbranding': 1, 'mute': 1, 'loop': 1,
                   'playlist': videoId, 'playsinline': 1, 'origin': window.location.origin, 
                   'enablejsapi': 1
               },
               events: {
                   'onReady': (event: any) => onPlayerReady(event.target),
                   'onError': (event: any) => console.log("YT Error", event.data)
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
       const checkInterval = setInterval(() => {
           if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
               const state = playerRef.current.getPlayerState();
               if (isPlaying && (state === 2 || state === 0 || state === -1)) playerRef.current.playVideo();
               if (!isPlaying && state === 1) playerRef.current.pauseVideo();
           }
       }, 2000);
       return () => clearInterval(checkInterval);
   }, [isPlaying]);

   return (
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none overflow-hidden" style={{ width: '1px', height: '1px', opacity: 0.01 }}>
          <div id="yt-player-frame" className="w-full h-full"></div>
      </div>
   );
};

const NowPlayingWidget = ({ music }: { music: any }) => {
   if (!music.videoId || !music.isPlaying) return (
       <div className="h-full w-full bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 flex items-center justify-center gap-2 text-slate-500">
           <Music className="w-5 h-5" />
           <span className="text-[1.2vh] font-bold uppercase tracking-wider">Rádio Pausada</span>
       </div>
   );

   return (
      <div className="h-full w-full bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex items-center gap-4 relative overflow-hidden">
         <div className="relative shrink-0">
            <img src={music.thumbnail} className="w-12 h-12 rounded-lg object-cover bg-slate-900 shadow-lg border border-white/10" />
         </div>
         <div className="flex-1 min-w-0 z-10">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[1.2vh] font-bold text-yellow-400 uppercase tracking-widest">No Ar</span>
                <div className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-3 bg-green-500 animate-[pulse_0.6s_ease-in-out_infinite]"></span>
                    <span className="w-0.5 h-2 bg-green-500 animate-[pulse_0.8s_ease-in-out_infinite]"></span>
                    <span className="w-0.5 h-4 bg-green-500 animate-[pulse_1s_ease-in-out_infinite]"></span>
                </div>
             </div>
             <p className="text-white font-bold leading-tight line-clamp-1 text-[1.8vh] drop-shadow-md">{music.title}</p>
         </div>
      </div>
   );
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playerApiRef = useRef<any>(null); 
  const lastPlayedTicketRef = useRef(0);
  
  const queueRef = useRef(queueState);
  useEffect(() => { queueRef.current = queueState; }, [queueState]);

  useEffect(() => {
    document.body.style.background = 'radial-gradient(ellipse at center, #1e293b 0%, #020617 100%)'; 
    document.body.style.overflow = 'hidden'; 
    return () => { document.body.style.background = ''; };
  }, []);

  const startTVExperience = () => {
      try {
          if (!audioCtxRef.current) {
              const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtor) audioCtxRef.current = new AudioCtor();
          }
          const ctx = audioCtxRef.current;
          if (ctx && ctx.state === 'suspended') ctx.resume();

          const player = playerApiRef.current;
          if (player && typeof player.unMute === 'function') {
              player.unMute();
              player.setVolume(queueRef.current.music.volume || 50);
              player.playVideo(); 
          }
          setHasStarted(true);
      } catch (e) { console.error("TV Start Error", e); setHasStarted(true); }
  };

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if(ctx.state === 'suspended') ctx.resume();

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

  // --- TTS FUNCIONANDO NA TV (FALLBACK) ---
  const speak = (ticket: number, desk: string) => {
     const text = `Senha ${ticket}, Balcão ${desk}`;
     
     // 1. Tenta API Nativa (PC/Android/Algumas TVs novas)
     if ('speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0) {
         window.speechSynthesis.cancel();
         const msg = new SpeechSynthesisUtterance(text);
         msg.lang = 'pt-BR';
         msg.rate = 1.0;
         window.speechSynthesis.speak(msg);
     } else {
         // 2. Fallback para TVs (Usa Google Translate TTS Hack)
         // Isso gera um MP3 on-the-fly. Funciona na maioria das Smart TVs onde a API nativa falha.
         try {
             console.log("Using TV TTS Fallback");
             const safeText = encodeURIComponent(text);
             const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${safeText}`;
             const audio = new Audio(url);
             audio.play().catch(e => console.error("TTS Audio Play Blocked", e));
         } catch (e) {
             console.error("TTS Fallback failed", e);
         }
     }
  };

  useEffect(() => {
    const isNewTicket = queueState.currentTicket !== lastPlayedTicketRef.current;
    const isRecall = (queueState as any).recall === true;
    
    if (hasStarted && (queueState.currentTicket > 0) && (isNewTicket || isRecall)) {
      lastPlayedTicketRef.current = queueState.currentTicket;
      setTimeout(() => {
          setHighlight(true);
          playDingDong();
          // Pequeno delay para a fala não atropelar o ding-dong
          setTimeout(() => speak(queueState.currentTicket, queueState.lastCalledDesk || '01'), 800);
      }, 300);
      const timer = setTimeout(() => setHighlight(false), 5000); 
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, queueState.currentTicket, (queueState as any).recall, hasStarted]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans select-none relative">
      
      <MusicPlayer 
         videoId={queueState.music?.videoId} 
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         onPlayerReady={(player) => { playerApiRef.current = player; }}
      />

      {!hasStarted && (
        <div 
          onClick={startTVExperience} 
          className="absolute inset-0 z-[9999] bg-slate-950/95 flex flex-col items-center justify-center cursor-pointer backdrop-blur-md"
        >
             <div className="w-40 h-40 bg-lubel-primary rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.6)] border-8 border-yellow-500 animate-pulse mb-8">
                <Music className="w-16 h-16 text-white" />
             </div>
             <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">AutoParts TV</h1>
             <p className="text-yellow-400 text-2xl font-bold uppercase tracking-[0.2em] bg-yellow-900/30 px-8 py-4 rounded-full border border-yellow-500/50">
               Toque para Iniciar Som e Vídeo
             </p>
        </div>
      )}

      <ConnectionStatus isConnected={isConnected} />

      {/* --- GRID LAYOUT RÍGIDO (CORREÇÃO "ESPREMIDO") --- */}
      {/* Usando CSS Grid em vez de Flexbox para garantir proporções exatas na TV */}
      <div className={`w-full h-full grid grid-cols-12 gap-8 p-10 pb-28 transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
         
         {/* ESQUERDA: SENHA (8 colunas = 66% da tela) */}
         <div className="col-span-8 h-full flex flex-col relative bg-slate-900/40 rounded-[3rem] border border-slate-800/50 backdrop-blur-sm shadow-2xl overflow-hidden">
             <div className="flex-1 flex flex-col items-center justify-center w-full">
                 <h2 className="text-slate-500 font-bold text-[4vh] uppercase tracking-[0.4em] mb-4">Senha Atual</h2>
                 
                 {/* Fonte gigante ajustada para caber no grid */}
                 <div className={`
                     text-[40vh] leading-none font-bold tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-300
                     ${highlight ? 'text-white scale-110 animate-pop-blue' : 'text-[#f1f5f9] scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 <div className={`
                     mt-8 rounded-full px-12 py-4 border-2 flex flex-col items-center justify-center transition-all duration-500 shadow-xl
                     ${highlight 
                        ? 'bg-yellow-500 text-blue-950 border-yellow-400 scale-105' 
                        : 'bg-lubel-primary border-white/10 text-white'}
                 `}>
                     <span className={`font-bold uppercase tracking-[0.3em] text-[2.5vh] ${highlight ? 'text-blue-900' : 'text-slate-400'}`}>Dirija-se ao</span>
                     <span className="text-[10vh] font-bold leading-none mt-2">
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* DIREITA: SIDEBAR (4 colunas = 33% da tela) */}
         <div className="col-span-4 h-full flex flex-col gap-6">
             
             {/* RELÓGIO E CLIMA (20%) */}
             <div className="h-[20%] w-full bg-lubel-surface/80 rounded-3xl border border-white/5 shadow-card flex overflow-hidden">
                <div className="w-1/2 border-r border-white/5 h-full"><DigitalClock /></div>
                <div className="w-1/2 h-full"><WeatherWidget /></div>
             </div>

             {/* HISTÓRICO (Flex Grow) */}
             <div className="flex-1 w-full bg-lubel-surface/80 rounded-3xl border border-white/5 shadow-card flex flex-col overflow-hidden p-6 relative">
                 <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 shrink-0">
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Últimas Chamadas</span>
                 </div>

                 <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {queueState.history.slice(0, 5).map((t, i) => {
                       const opacity = i === 0 ? 1 : Math.max(0.2, 0.6 - (i * 0.15));
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 relative overflow-hidden
                             ${i === 0 && highlight 
                                ? 'bg-yellow-500/10 border-yellow-500/50 scale-105 z-10 shadow-lg' 
                                : 'bg-black/20 border-white/5'}
                          `}>
                             {t.isRetroactive && (
                                 <div className="absolute right-0 top-0 p-1">
                                    <div className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded uppercase">Rechamada</div>
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

             {/* MUSIC WIDGET (12%) */}
             <div className="h-[12%] min-h-[100px] w-full">
                 <NowPlayingWidget music={queueState.music} />
             </div>

         </div>
      </div>

      <NewsTicker />
    </div>
  );
};
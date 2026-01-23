import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Sun, CloudRain, MapPin, Music, CloudLightning, CloudDrizzle } from 'lucide-react';

// --- REAL WEATHER WIDGET (PIRACICABA) ---
const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coordinates for Piracicaba, SP: -22.7253, -47.6492
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
    const interval = setInterval(fetchWeather, 600000); // Update every 10 mins
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

  if (!weather) return <div className="text-slate-500 text-xs">Carregando tempo...</div>;

  const currentTemp = Math.round(weather.current.temperature_2m);
  const currentCode = weather.current.weather_code;
  
  // Forecast for next 3 days
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
    <div className="flex flex-col bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 shadow-lg h-full justify-between">
       <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-brand-300">
             <MapPin className="w-4 h-4" />
             <span className="text-xs font-bold uppercase tracking-widest">Piracicaba, SP</span>
          </div>
       </div>
       
       <div className="flex items-center gap-4 mb-2">
          <div className="animate-pulse-slow">
            {getWeatherIcon(currentCode, "w-12 h-12")}
          </div>
          <div className="flex flex-col">
             <span className="text-5xl font-bold text-white tracking-tighter leading-none">{currentTemp}°</span>
             <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wide mt-1">{getWeatherLabel(currentCode)}</span>
          </div>
       </div>
       
       {/* 3 Day Forecast */}
       <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-700/50">
          {days.map((d: any, i: number) => (
             <div key={i} className="flex flex-col items-center justify-center p-1 rounded bg-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{d.name}</span>
                <div className="my-1">{getWeatherIcon(d.code, "w-4 h-4")}</div>
                <span className="text-xs font-bold text-white">{d.max}°</span>
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
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 shadow-lg text-center h-full flex flex-col justify-center">
      <div className="text-[6vh] font-sans font-bold text-white tracking-tight leading-none tabular-nums">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-brand-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
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

      const targetVolume = ducking ? 5 : volume; // Drop to 5% on ducking (agressive)
      
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
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
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
      masterGain.gain.value = 0.8; // Louder for attention

      // Ding (Harmonics for richness)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle'; // Triangle wave cuts through better on TV speakers
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
      osc2.type = 'sine'; // Sine for warmth
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

      {/* Screen Flash Effect */}
      <div className={`
         absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-700 ease-out
         ${highlight ? 'opacity-30' : 'opacity-0'}
      `}></div>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>

      {/* GRID LAYOUT - OPTIMIZED FOR 720p TV */}
      <div className="absolute inset-0 z-10 p-[4vh] flex gap-[4vh]">
         
         {/* LEFT COLUMN: MAIN DISPLAY (65% width) */}
         <div className="w-[65%] flex flex-col justify-center relative">
             {/* Center Glow */}
             <div className={`
                 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vh] h-[70vh]
                 bg-brand-600/30 rounded-full blur-[100px] transition-all duration-300 ease-out
                 ${highlight ? 'opacity-100 scale-110' : 'opacity-20 scale-75'}
             `}></div>

             <div className="relative z-10 flex flex-col items-center">
                 <h2 className="text-brand-200/60 font-bold text-[3vh] uppercase tracking-[0.5em] mb-[2vh]">Senha Atual</h2>
                 
                 {/* MASSIVE NUMBER - USING VH FOR PERFECT SCALING */}
                 <div className={`
                     text-[35vh] leading-none font-bold tracking-tighter text-white transition-all duration-300 ease-out
                     ${highlight ? 'scale-125 drop-shadow-[0_0_60px_rgba(255,255,255,0.8)] animate-shake' : 'scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 <div className={`
                     mt-[6vh] bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl px-[6vw] py-[3vh]
                     flex flex-col items-center gap-1 shadow-2xl transition-all duration-500
                     ${highlight ? 'border-brand-500/50 bg-brand-900/40 translate-y-2' : ''}
                 `}>
                     <span className="text-slate-400 font-bold uppercase tracking-widest text-[1.5vh]">Dirija-se ao</span>
                     <span className={`text-[8vh] font-bold leading-none ${highlight ? 'text-brand-300' : 'text-white'}`}>
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* RIGHT COLUMN: SIDEBAR (35% width) */}
         <div className="w-[35%] flex flex-col gap-[3vh]">
             {/* Top Widgets Container - Fixed height ratio */}
             <div className="h-[25%] flex gap-[2vh]">
                <div className="flex-1">
                   <DigitalClock />
                </div>
                <div className="flex-1">
                   <WeatherWidget />
                </div>
             </div>

             {/* History List */}
             <div className="h-[75%] bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-[3vh] flex flex-col shadow-xl overflow-hidden relative">
                 <div className="flex items-center gap-3 mb-[3vh] text-slate-500 font-bold uppercase tracking-widest text-[1.5vh]">
                    <Clock className="w-4 h-4" />
                    Últimas Chamadas
                 </div>

                 <div className="flex flex-col gap-[2vh] relative">
                    {/* Render History */}
                    {queueState.history.slice(0, 5).map((t, i) => {
                       // Opacity Logic
                       const opacity = i === 0 ? 1 : i === 1 ? 0.7 : i === 2 ? 0.4 : i === 3 ? 0.2 : 0.1;
                       
                       return (
                          <div key={i} style={{ opacity }} className={`
                             flex items-center justify-between p-[2vh] rounded-2xl border transition-all duration-500
                             ${i === 0 && highlight 
                                ? 'bg-white/10 border-brand-400/50 scale-105 shadow-lg translate-x-1' 
                                : 'bg-slate-800/30 border-slate-700/30'}
                          `}>
                             <span className={`text-[5vh] font-bold tracking-tight leading-none ${i === 0 ? 'text-white' : 'text-slate-400'}`}>
                                {String(t.number).padStart(3, '0')}
                             </span>
                             <div className="text-right leading-tight">
                                <span className="block text-[1.2vh] uppercase font-bold text-slate-500">Balcão</span>
                                <span className={`text-[2.5vh] font-bold ${i === 0 ? 'text-brand-300' : 'text-slate-500'}`}>
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
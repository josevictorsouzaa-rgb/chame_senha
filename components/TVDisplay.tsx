import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Cloud, Music, Wifi, WifiOff } from 'lucide-react';

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

// Componente Player Robusto para TV
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
           // Se já existe, apenas carrega o novo vídeo
           if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
                playerRef.current.loadVideoById(videoId);
                return;
           }

           // Cria nova instância
           playerRef.current = new window.YT.Player('yt-player-frame', {
               height: '100%', 
               width: '100%',
               videoId: videoId,
               playerVars: {
                   'autoplay': 1, 
                   'controls': 0, 
                   'disablekb': 1, 
                   'fs': 0, 
                   'rel': 0, 
                   'showinfo': 0, 
                   'modestbranding': 1, 
                   'mute': 0, // Tenta desmutado
                   'loop': 1,
                   'playlist': videoId, // Necessário para loop funcionar
                   'playsinline': 1,
                   'origin': window.location.origin // Crítico para Localhost/HTTP
               },
               events: {
                   'onReady': (event: any) => {
                       event.target.setVolume(volume);
                       if (onPlayerReady) onPlayerReady(event.target);
                       if (isPlaying) event.target.playVideo();
                   },
                   'onError': (e: any) => console.error("YouTube Error:", e.data),
                   'onStateChange': (e: any) => {
                       // Se terminar (0), toca de novo (loop manual de segurança)
                       if (e.data === 0) e.target.playVideo();
                   }
               }
           });
       };

       if (window.YT && window.YT.Player) createPlayer();
       else window.onYouTubeIframeAPIReady = createPlayer;
   }, [videoId]);

   // Sincronia de Volume
   useEffect(() => {
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(volume);
      }
   }, [volume]);

   // Sincronia de Play/Pause
   useEffect(() => {
       if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
           if (isPlaying) playerRef.current.playVideo();
           else playerRef.current.pauseVideo();
       }
   }, [isPlaying]);

   // O Player fica no Z-Index 0 (Fundo), ocupando toda a tela.
   // O App fica no Z-Index 10 (Frente) com background sólido.
   // Isso engana a TV para achar que o usuário está assistindo o vídeo.
   return (
      <div className="fixed inset-0 z-0 pointer-events-none opacity-100">
          <div id="yt-player-frame" className="w-full h-full"></div>
      </div>
   );
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const [highlight, setHighlight] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  
  // Refs para controle direto
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playerInstanceRef = useRef<any>(null); 

  useEffect(() => {
    // Fundo sólido para cobrir o vídeo do YouTube
    document.body.style.background = '#020617'; 
    document.body.style.overflow = 'hidden'; 
    return () => { document.body.style.background = ''; };
  }, []);

  // --- STARTUP SEQUENCE (The Click) ---
  const startTVExperience = () => {
      try {
          // 1. Web Audio API (Ding Dong)
          if (!audioCtxRef.current) {
              const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtor) audioCtxRef.current = new AudioCtor();
          }
          if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();

          // 2. TTS Unlock (Play silent audio)
          const silent = new Audio();
          silent.play().catch(() => {});

          // 3. YouTube Force Play (Crucial for TV/Mobile)
          if (playerInstanceRef.current && typeof playerInstanceRef.current.playVideo === 'function') {
              playerInstanceRef.current.unMute();
              playerInstanceRef.current.setVolume(queueState.music?.volume || 50);
              playerInstanceRef.current.playVideo();
          }

          setHasStarted(true);
      } catch (e) { 
          console.error("Start Error", e);
          setHasStarted(true); 
      }
  };

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = 1.0; 

      // Ding (High)
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

      // Dong (Low)
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
    } catch (e) { console.error("DingDong Error", e); }
  };

  const speak = (ticket: number, desk: string) => {
     const text = `Senha ${ticket}, Balcão ${desk}`;
     // Google Translate TTS (MP3) - Funciona melhor que speechSynthesis em TVs antigas
     const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${encodeURIComponent(text)}`;
     
     try {
         const audio = new Audio(url);
         audio.playbackRate = 0.9;
         const playPromise = audio.play();
         if (playPromise !== undefined) {
             playPromise.catch(e => console.error("TTS Play Blocked (User interaction needed?):", e));
         }
     } catch (e) {
         console.error("TTS Error", e);
     }
  };

  useEffect(() => {
    if (hasStarted && queueState.currentTicket > 0) {
      setHighlight(true);
      
      // Sequência de Anúncio
      playDingDong();
      
      // Delay pequeno para a voz não atropelar o sino
      setTimeout(() => {
          speak(queueState.currentTicket, queueState.lastCalledDesk || '01');
      }, 1200);

      const timer = setTimeout(() => setHighlight(false), 5000); 
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, hasStarted, queueState.currentTicket]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans select-none relative">
      
      {/* CAMADA 0: PLAYER (Invisível visualmente pois está coberto, mas renderizado para a TV) */}
      <MusicPlayer 
         videoId={queueState.music?.videoId} 
         isPlaying={queueState.music?.isPlaying} 
         volume={queueState.music?.volume || 50}
         onPlayerReady={(player: any) => { playerInstanceRef.current = player; }}
      />

      {/* CAMADA 9999: OVERLAY DE INÍCIO */}
      {!hasStarted && (
        <div 
          onClick={startTVExperience} 
          className="absolute inset-0 z-[9999] bg-slate-900/95 flex flex-col items-center justify-center cursor-pointer backdrop-blur-md"
        >
             <div className="w-40 h-40 bg-brand-600 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.6)] animate-pulse mb-8 border-4 border-white/20">
                <Music className="w-16 h-16 text-white" />
             </div>
             <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">TV MODE</h1>
             <p className="text-slate-300 text-xl font-medium bg-white/10 px-6 py-2 rounded-full border border-white/10">Toque para Iniciar Som e Vídeo</p>
        </div>
      )}

      {/* CAMADA 10: INTERFACE PRINCIPAL (Cobre o vídeo) */}
      <div className="relative z-10 w-full h-full bg-slate-950 flex p-8 gap-8">
         
         {/* ESQUERDA: SENHA GIGANTE (70%) */}
         <div className="flex-[2] flex flex-col relative bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden">
             
             {/* Barra de Status */}
             <div className="absolute top-8 left-8 flex items-center gap-4">
                 <div className={`px-4 py-2 rounded-full flex items-center gap-2 border ${isConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    <span className="text-xs font-bold uppercase tracking-wider">{isConnected ? 'Online' : 'Offline'}</span>
                 </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center w-full">
                 <h2 className="text-slate-500 font-bold text-3xl uppercase tracking-[0.4em] mb-4">Senha Atual</h2>
                 
                 {/* NÚMERO GIGANTE */}
                 <div className={`
                     text-[22rem] leading-none font-bold tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-300
                     ${highlight ? 'text-white scale-110' : 'text-slate-200 scale-100'}
                 `}>
                    {String(queueState.currentTicket).padStart(3, '0')}
                 </div>

                 {/* LOCAL DE ATENDIMENTO */}
                 <div className={`
                     mt-12 rounded-2xl px-16 py-8 border-2 flex flex-col items-center justify-center transition-all duration-500
                     ${highlight 
                        ? 'bg-brand-600 border-brand-400 shadow-[0_0_60px_rgba(37,99,235,0.4)] scale-105' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'}
                 `}>
                     <span className="font-bold uppercase tracking-[0.2em] text-sm mb-2 opacity-70">Dirija-se ao</span>
                     <span className="text-7xl font-bold leading-none">
                        {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '---'}
                     </span>
                 </div>
             </div>
         </div>

         {/* DIREITA: SIDEBAR (30%) */}
         <div className="flex-1 flex flex-col gap-6">
             
             {/* Widgets */}
             <div className="flex justify-between items-center bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg">
                 <WeatherWidget />
                 <DigitalClock />
             </div>

             {/* Histórico */}
             <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 shadow-lg flex flex-col overflow-hidden p-6 relative">
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
                             : 'bg-white/5 border-white/5'}
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

                 {/* Info da Música (Rodapé do Histórico) */}
                 {queueState.music?.isPlaying && (
                     <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                         <div className="overflow-hidden">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rádio Ativa</p>
                            <p className="text-sm font-bold text-slate-300 truncate">{queueState.music.title || 'Música Ambiente'}</p>
                         </div>
                     </div>
                 )}
             </div>

         </div>
      </div>
    </div>
  );
};
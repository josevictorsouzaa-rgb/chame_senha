import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock, Wifi, WifiOff, Music } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// --- CONFIGURAÇÃO DA TV ---
// Usamos 1280x720 como base. É a resolução segura para TVs de 32".
// O sistema vai esticar ou encolher isso proporcionalmente.
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="text-white text-center">
      <div className="text-[60px] font-bold leading-none font-mono">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-[18px] text-slate-400 font-bold uppercase mt-1">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
};

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const [hasStarted, setHasStarted] = useState(false);
  const [highlight, setHighlight] = useState(false);
  
  // Estado para controle de escala (zoom)
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Referências de Áudio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTicketRef = useRef(0);
  const dingRef = useRef<HTMLAudioElement | null>(null); // Fallback caso WebAudio falhe

  // --- 1. LÓGICA DE ESCALA (THE SCALER HACK) ---
  useEffect(() => {
    const handleResize = () => {
      const windowW = window.innerWidth;
      const windowH = window.innerHeight;
      
      const scaleX = windowW / BASE_WIDTH;
      const scaleY = windowH / BASE_HEIGHT;
      
      // Usa o menor fator para garantir que tudo caiba na tela (contain)
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executa ao iniciar
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 2. ÁUDIO DO YOUTUBE (Compatibilidade LG) ---
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    
    window.onYouTubeIframeAPIReady = () => {
       // O Player será inicializado quando o usuário clicar em "Iniciar"
    };
  }, []);

  const initYouTube = () => {
    if (window.YT && window.YT.Player) {
      new window.YT.Player('tv-player', {
        height: '100%',
        width: '100%',
        videoId: queueState.music?.videoId || 'jfKfPfyJRdk',
        playerVars: {
          'autoplay': 1,
          'controls': 0,
          'showinfo': 0,
          'modestbranding': 1,
          'loop': 1,
          'playlist': queueState.music?.videoId || 'jfKfPfyJRdk',
          'mute': 0 // Tenta iniciar com som
        },
        events: {
          'onReady': (event: any) => {
             event.target.setVolume(queueState.music?.volume || 50);
             event.target.playVideo();
          }
        }
      });
    }
  };

  // --- 3. SISTEMA DE VOZ E SOM ---
  const playDingDong = () => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(660, t);
      osc.frequency.setValueAtTime(550, t + 0.6);
      
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);
      
      osc.start(t);
      osc.stop(t + 2.5);
    } catch (e) {
      console.error("WebAudio Error", e);
    }
  };

  const speakTicket = (text: string) => {
    // Truque: Google Translate TTS via Audio Tag (Funciona em 99% das Smart TVs)
    try {
      const safeText = encodeURIComponent(text);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${safeText}`;
      
      const audio = new Audio(url);
      audio.playbackRate = 0.9; // Falar um pouco mais devagar
      audio.play().catch(e => console.error("TTS Blocked:", e));
    } catch (e) {
      console.error("TTS Fail", e);
    }
  };

  const handleStart = () => {
    // 1. Iniciar AudioContext (precisa de clique)
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtor) {
      audioCtxRef.current = new AudioCtor();
      audioCtxRef.current.resume();
    }

    // 2. Play em um áudio vazio para desbloquear a policy do navegador da TV
    const silent = new Audio();
    silent.play().catch(() => {});

    // 3. Iniciar YouTube
    initYouTube();

    setHasStarted(true);
  };

  // --- 4. DETECÇÃO DE CHAMADA ---
  useEffect(() => {
    if (!hasStarted) return;
    
    // Se a senha mudou ou é um recall
    const current = queueState.currentTicket;
    const isRecall = (queueState as any).recall;

    if (current > 0 && (current !== lastTicketRef.current || isRecall)) {
       lastTicketRef.current = current;
       
       setHighlight(true);
       
       // Sequência de eventos
       playDingDong();
       
       setTimeout(() => {
         const deskName = queueState.lastCalledDesk || '01';
         speakTicket(`Senha ${current}, Balcão ${deskName}`);
       }, 1500); // Espera o Ding acabar

       const timer = setTimeout(() => setHighlight(false), 8000);
       return () => clearTimeout(timer);
    }
  }, [queueState.currentTicket, lastUpdateTimestamp, (queueState as any).recall, hasStarted]);

  // --- RENDERIZAÇÃO ---
  return (
    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative">
      
      {/* PLAYER DE FUNDO */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div id="tv-player" className="w-full h-full"></div>
      </div>

      {/* OVERLAY DE INÍCIO (Obrigatório para TV) */}
      {!hasStarted && (
        <div 
          onClick={handleStart}
          className="fixed inset-0 z-[9999] bg-blue-900 flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="animate-bounce mb-6">
             <Music className="w-24 h-24 text-yellow-400" />
          </div>
          <h1 className="text-white text-4xl font-bold uppercase mb-4">Sistema de Senhas</h1>
          <button className="bg-yellow-500 text-blue-900 px-8 py-4 rounded-xl text-2xl font-bold shadow-lg border-4 border-white">
            CLIQUE AQUI PARA INICIAR
          </button>
          <p className="text-blue-300 mt-4 text-lg">Necessário para ativar o áudio na TV</p>
        </div>
      )}

      {/* CONTAINER ESCALÁVEL (1280x720) */}
      <div 
        style={{ 
          width: BASE_WIDTH, 
          height: BASE_HEIGHT, 
          transform: `scale(${scale})`,
          // Mantém o container centralizado mesmo após o scale
          position: 'absolute'
        }}
        className="bg-slate-900/80 backdrop-blur-sm border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col z-10"
      >
        
        {/* CABEÇALHO */}
        <div className="h-[80px] bg-blue-950 flex items-center justify-between px-8 border-b border-white/10">
           <div className="text-white text-2xl font-bold tracking-widest uppercase flex items-center gap-2">
             <span className="text-yellow-400">Lubel</span> Auto Peças
           </div>
           <div className="flex items-center gap-4">
              <div className={`px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${isConnected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                 {isConnected ? <Wifi className="w-4 h-4"/> : <WifiOff className="w-4 h-4"/>}
                 {isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
           </div>
        </div>

        {/* CORPO PRINCIPAL */}
        <div className="flex-1 flex p-8 gap-8">
            
            {/* COLUNA ESQUERDA: SENHA ATUAL */}
            <div className={`
                flex-1 bg-slate-800 rounded-3xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500
                ${highlight ? 'border-yellow-400 bg-blue-900 shadow-[0_0_50px_rgba(250,204,21,0.3)]' : 'border-slate-600'}
            `}>
                <h2 className="text-slate-400 text-3xl uppercase font-bold tracking-[0.3em] mb-4">Senha Atual</h2>
                
                <div className={`
                   font-mono font-bold leading-none transition-all duration-300
                   ${highlight ? 'text-[320px] text-white scale-110' : 'text-[280px] text-slate-200'}
                `}>
                   {String(queueState.currentTicket).padStart(3, '0')}
                </div>

                <div className="mt-8 bg-white/10 px-12 py-4 rounded-xl text-center backdrop-blur-md w-[80%]">
                   <p className="text-slate-400 text-xl font-bold uppercase tracking-widest mb-1">Dirija-se ao</p>
                   <p className="text-yellow-400 text-[80px] font-bold leading-none">
                      {queueState.lastCalledDesk ? `Balcão ${String(queueState.lastCalledDesk).padStart(2, '0')}` : '--'}
                   </p>
                </div>
            </div>

            {/* COLUNA DIREITA: INFO */}
            <div className="w-[400px] flex flex-col gap-6">
                
                {/* RELÓGIO */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-600 shadow-lg">
                   <DigitalClock />
                </div>

                {/* HISTÓRICO */}
                <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-600 p-6 overflow-hidden flex flex-col">
                   <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4 border-b border-slate-600 pb-2">
                     Últimas Chamadas
                   </div>
                   
                   <div className="flex flex-col gap-3">
                      {queueState.history.slice(0, 4).map((ticket, i) => (
                        <div key={i} className={`
                           flex justify-between items-center p-4 rounded-xl border
                           ${i === 0 && highlight ? 'bg-yellow-500/20 border-yellow-500' : 'bg-black/20 border-white/5'}
                        `}>
                           <span className={`text-4xl font-mono font-bold ${i === 0 && highlight ? 'text-yellow-400' : 'text-white'}`}>
                             {String(ticket.number).padStart(3, '0')}
                           </span>
                           <span className="text-xl font-bold text-slate-400">
                             Balcão {String(ticket.desk).padStart(2, '0')}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* RODAPÉ LATERAL (Música) */}
                <div className="h-[80px] bg-blue-900/50 rounded-2xl flex items-center px-4 gap-3 border border-white/10">
                   {queueState.music.isPlaying ? (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex-1 overflow-hidden">
                           <div className="text-white text-sm font-bold truncate">{queueState.music.title || 'Música Ambiente'}</div>
                           <div className="text-blue-300 text-xs uppercase font-bold">Rádio Lubel</div>
                        </div>
                      </>
                   ) : (
                      <div className="text-slate-500 text-sm font-bold uppercase w-full text-center">Rádio Pausada</div>
                   )}
                </div>

            </div>
        </div>

        {/* RODAPÉ SCROLLING */}
        <div className="h-[60px] bg-yellow-500 flex items-center overflow-hidden whitespace-nowrap relative">
           <div className="animate-marquee text-blue-950 font-bold text-2xl uppercase tracking-widest px-4">
              Bem-vindo à Lubel Auto Peças • Ofertas especiais em óleos e filtros • Consulte nossos vendedores • Peças originais com garantia
           </div>
        </div>

      </div>
    </div>
  );
};
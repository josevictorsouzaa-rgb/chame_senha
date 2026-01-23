import React, { useEffect, useRef, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Ticket } from '../types';

export const TVDisplay: React.FC = () => {
  const { isConnected, queueState, lastUpdateTimestamp } = useQueueSocket();
  const prevTicketRef = useRef<number>(0);
  const [highlight, setHighlight] = useState(false);

  // Sound Logic
  const playChime = () => {
    // Creating a simple synthesized chime using Web Audio API to avoid external file dependencies
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Ding (High pitch)
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      
      // Dong (Lower pitch)
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.6);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Slightly slower for clarity
    
    // Try to find a good Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Logic: If timestamp updates, it's either a new call or a recall
    if (lastUpdateTimestamp === 0) return;
    if (queueState.currentTicket === 0) return;

    setHighlight(true);
    playChime();

    // Delay speech slightly to let chime start
    setTimeout(() => {
        // Format: "Senha 45, Balcão 2"
        const text = `Senha ${queueState.currentTicket}, Balcão ${queueState.lastCalledDesk || 'um'}`;
        speak(text);
    }, 1000);

    // Remove highlight animation after a few seconds
    const timer = setTimeout(() => {
      setHighlight(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [lastUpdateTimestamp, queueState.currentTicket, queueState.lastCalledDesk]);

  // Handle Loading State
  if (!isConnected) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-gray-500 font-mono animate-pulse">TERMINAL OFFLINE - AGUARDANDO CONEXÃO</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex overflow-hidden font-sans select-none cursor-none">
      
      {/* LEFT: Main Display (70% width) */}
      <div className="w-[70%] h-full flex flex-col items-center justify-center border-r border-gray-900 relative">
        
        {/* Background Ambient Glow */}
        <div className={`absolute inset-0 bg-indigo-900/20 blur-3xl transition-opacity duration-1000 ${highlight ? 'opacity-100' : 'opacity-20'}`}></div>

        <div className="z-10 text-center">
          <h2 className="text-gray-400 text-3xl md:text-4xl font-light tracking-[0.2em] uppercase mb-8">
            Senha Atual
          </h2>
          
          <div className="relative">
             {/* The Big Number */}
            <div className={`
              font-mono font-bold text-[18rem] md:text-[24rem] leading-none tracking-tighter
              transition-all duration-500 transform
              ${highlight ? 'scale-110 text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.6)]' : 'scale-100 text-gray-100'}
            `}>
              {String(queueState.currentTicket).padStart(3, '0')}
            </div>
          </div>

          <div className={`
            mt-12 inline-block px-12 py-4 rounded-full border-2 
            transition-all duration-500
            ${highlight ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/50' : 'bg-gray-900 border-gray-800'}
          `}>
             <span className="text-4xl md:text-6xl font-bold tracking-widest">
                BALCÃO {String(queueState.lastCalledDesk).padStart(2, '0')}
             </span>
          </div>
        </div>
      </div>

      {/* RIGHT: History Sidebar (30% width) */}
      <div className="w-[30%] h-full bg-gray-950 flex flex-col p-8 border-l border-gray-900">
        <h3 className="text-gray-500 uppercase tracking-widest font-bold text-xl mb-8 border-b border-gray-800 pb-4">
          Chamadas Anteriores
        </h3>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {queueState.history.slice(0, 5).map((ticket, index) => (
             /* Skip the very first one if it matches current, though history logic usually handles this. 
                Based on server logic, history includes current. So we skip index 0 if we want "Previous" only, 
                but typically displays show the "Last Called" list including current or strictly previous. 
                Let's show strictly previous (index 1 to 5) if index 0 is current.
                Actually, the prompt asks for "Last 5 called". 
             */
            <div 
              key={`${ticket.number}-${ticket.timestamp}`}
              className={`
                flex items-center justify-between p-6 rounded-xl border
                ${index === 0 && highlight ? 'bg-gray-900 border-indigo-500/30' : 'bg-gray-900/50 border-gray-800'}
              `}
            >
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase mb-1">Senha</span>
                <span className="text-4xl font-mono font-bold text-gray-300">
                  {String(ticket.number).padStart(3, '0')}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 text-xs uppercase mb-1">Balcão</span>
                <span className="text-2xl font-bold text-indigo-400">
                  {ticket.desk}
                </span>
              </div>
            </div>
          ))}
          
          {queueState.history.length === 0 && (
             <div className="text-gray-600 text-center mt-10 italic">Nenhum histórico</div>
          )}
        </div>

        {/* Footer/Brand */}
        <div className="mt-auto pt-8 text-center border-t border-gray-900">
            <p className="text-gray-700 font-mono text-sm">SYSTEM READY • 2024</p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { GameNode, Language } from '../types';
import { t } from '../utils/i18n';
import { LanguageSwitcher } from './ui/LanguageSwitcher';
import { playSfx } from '../services/audioService';

interface Props {
  nodes: GameNode[];
  onNodeSelect: (nodeId: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenDevMode: () => void;
}

export const Hub: React.FC<Props> = ({ nodes, onNodeSelect, language, onLanguageChange }) => {
  // Find the HUB_CONFIG node to get the background image
  const hubConfig = nodes.find(n => n.id === 'HUB_CONFIG');
  const backgroundImage = hubConfig?.data.backgroundImage;
  const [imgError, setImgError] = useState(false);

  // Filter out Intro and Hub Config, and nodes without coordinates (hidden scenarios)
  const activeNodes = nodes.filter(n => n.type !== 'INTRO' && n.type !== 'HUB' && n.coordinates);

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900 overflow-hidden font-sans select-none">
      
      {/* Background Layer - Full Screen */}
      <div className="absolute inset-0 z-0">
        {backgroundImage && !imgError ? (
           <img 
             src={backgroundImage} 
             alt="City Map" 
             className="w-full h-full object-cover transition-transform duration-[60s] ease-linear hover:scale-105"
             onError={() => setImgError(true)} 
           />
        ) : (
           /* Stylish Vector Map Fallback */
           <div className="w-full h-full relative bg-[#f0f4f8]">
             {/* Water */}
             <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#bfdbfe] rounded-tl-[100px] opacity-60"></div>
             <div className="absolute top-20 left-[-10%] w-1/3 h-20 bg-[#bfdbfe] -rotate-12 opacity-40"></div>
             
             {/* Roads Pattern */}
             <div className="absolute inset-0 opacity-10" 
                  style={{ backgroundImage: 'linear-gradient(#94a3b8 2px, transparent 2px), linear-gradient(90deg, #94a3b8 2px, transparent 2px)', backgroundSize: '60px 60px' }}>
             </div>
             
             {/* Label */}
             <div className="absolute bottom-4 right-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                NOVE OR CITY MAP
             </div>
           </div>
        )}
        {/* Subtle overlay to make UI elements pop */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
      </div>

      {/* Dev Hint - Top Left (Safe Zone) */}
      <div className="absolute top-2 left-2 z-50 text-[10px] text-white/50 font-mono hover:text-white transition-colors bg-black/20 px-2 py-1 rounded">
         Dev: Ctrl+Shift+D
      </div>

      {/* Map Pins / Nodes Layer */}
      <div className="absolute inset-0 z-10">
        {activeNodes.map((node, index) => {
          if (!node.coordinates) return null;
          
          // Smart Tooltip Positioning:
          // If node is in the bottom 40% of the screen, show tooltip ABOVE the pin to avoid overlap with bottom UI
          const isBottom = node.coordinates.y > 60;
          
          return (
            <div 
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:z-50 transition-all duration-300"
              style={{ left: `${node.coordinates.x}%`, top: `${node.coordinates.y}%` }}
            >
              <button 
                onClick={() => {
                   if (!node.isLocked) {
                     playSfx('click');
                     onNodeSelect(node.id);
                   }
                }}
                disabled={node.isLocked}
                className={`relative group/pin flex flex-col items-center transition-all duration-300 ${node.isLocked ? 'opacity-90 grayscale-[0.8]' : 'hover:scale-110 cursor-pointer'}`}
              >
                {/* Connection Line to Ground */}
                <div className="hidden sm:block w-0.5 h-8 bg-black/30 absolute top-full left-1/2 -translate-x-1/2 origin-top transform scale-y-0 transition-transform duration-300 group-hover/pin:scale-y-100"></div>
                <div className="hidden sm:block w-4 h-1 bg-black/40 rounded-full absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/pin:opacity-100 transition-opacity duration-300 blur-[2px]"></div>

                {/* Number Badge */}
                <div className="absolute -top-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 text-blue-900 rounded-full border-[3px] border-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md z-30 transform transition-transform group-hover/pin:rotate-12">
                  {index + 1}
                </div>

                {/* Pin Icon - Responsive Size */}
                <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl rotate-45 flex items-center justify-center shadow-2xl border-[3px] sm:border-[5px] border-white transition-all relative z-20 overflow-hidden
                  ${node.isCompleted ? 'bg-gradient-to-br from-green-400 to-green-600' : node.isLocked ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:shadow-blue-500/50'}
                `}>
                  <span className="-rotate-45 text-2xl sm:text-4xl drop-shadow-md filter text-white">
                     {node.isCompleted ? '✓' : node.isLocked ? '🔒' : node.type === 'QUIZ' ? '🔑' : '📍'}
                  </span>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-white/30 -skew-x-12 -translate-x-full group-hover/pin:animate-shine"></div>
                </div>

                {/* Pulse Effect for active unlocked nodes */}
                {!node.isLocked && !node.isCompleted && (
                  <div className="absolute inset-0 bg-blue-400 rounded-2xl rotate-45 animate-ping opacity-30 -z-10 scale-150"></div>
                )}

                {/* Label (Tooltip style) - Smart Positioning */}
                <div className={`
                  absolute px-4 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-blue-100 
                  text-sm font-bold text-gray-800 whitespace-nowrap opacity-0 
                  group-hover/pin:opacity-100 transition-all duration-300 z-30 flex flex-col items-center 
                  after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent pointer-events-none
                  ${isBottom 
                    ? 'bottom-[calc(100%+20px)] translate-y-2 group-hover/pin:translate-y-0 after:-bottom-4 after:border-t-white/95 after:border-b-transparent' 
                    : 'top-[calc(100%+20px)] -translate-y-2 group-hover/pin:translate-y-0 after:-top-4 after:border-b-white/95 after:border-t-transparent'
                  }
                `}>
                  {node.title}
                  {node.isLocked && <span className="text-[10px] text-red-400 font-normal uppercase tracking-wider mt-0.5">LOCKED</span>}
                </div>
              </button>
            </div>
          );
        })}
      </div>
      
      {/* UI Controls - Positioned in BOTTOM CORNERS to avoid overlap with map pins */}

      {/* Legend - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-40 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-2xl border border-gray-100 animate-fade-in-up">
        <LegendItem color="bg-blue-600" label={t('open', language)} />
        <div className="w-px h-3 bg-gray-200"></div>
        <LegendItem color="bg-green-500" label={t('completed', language)} />
        <div className="w-px h-3 bg-gray-200"></div>
        <LegendItem color="bg-slate-500" label={t('locked', language)} />
      </div>

    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm ring-2 ring-gray-100`}></div>
    <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{label}</span>
  </div>
);

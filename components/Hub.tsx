
import React, { useState } from 'react';
import { GameNode, Language } from '../types';
import { t } from '../utils/i18n';
import { playSfx } from '../services/audioService';

interface Props {
  nodes: GameNode[];
  onNodeSelect: (nodeId: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenDevMode: () => void;
  onBackToIntro: () => void;
}

export const Hub: React.FC<Props> = ({ nodes, onNodeSelect, language, onBackToIntro, onOpenDevMode }) => {
  const hubConfig = nodes.find(n => n.id === 'HUB_CONFIG');
  const backgroundImage = hubConfig?.data.backgroundImage;
  const [imgError, setImgError] = useState(false);
  const activeNodes = nodes.filter(n => n.type !== 'INTRO' && n.type !== 'HUB' && n.coordinates);

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900 overflow-hidden font-sans select-none">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {backgroundImage && !imgError ? (
           <img 
             src={backgroundImage} 
             alt="City Map" 
             className="w-full h-full object-cover transition-transform duration-[60s] ease-linear hover:scale-105"
             onError={() => setImgError(true)} 
           />
        ) : (
           <div className="w-full h-full relative bg-[#f0f4f8]">
             <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#bfdbfe] rounded-tl-[100px] opacity-60"></div>
             <div className="absolute top-20 left-[-10%] w-1/3 h-20 bg-[#bfdbfe] -rotate-12 opacity-40"></div>
             <div className="absolute inset-0 opacity-10" 
                  style={{ backgroundImage: 'linear-gradient(#94a3b8 2px, transparent 2px), linear-gradient(90deg, #94a3b8 2px, transparent 2px)', backgroundSize: '60px 60px' }}>
             </div>
             <div className="absolute bottom-4 right-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                NOVE OR CITY MAP
             </div>
           </div>
        )}
        <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
      </div>

      {/* Dev Mode Button (Always visible) */}
      <button 
        onClick={() => {
           playSfx('click');
           onOpenDevMode();
        }}
        className="absolute top-2 left-2 z-50 text-[10px] text-white/70 font-bold hover:text-white transition-all bg-black/30 px-3 py-1.5 rounded-full border border-white/10 hover:bg-black/50 hover:scale-105 active:scale-95 flex items-center gap-1.5 backdrop-blur-sm"
      >
         <span>🛠️</span> Dev Mode
      </button>

      {/* Back to Intro Button */}
      <div className="absolute top-5 right-5 z-50">
        <button 
          onClick={() => {
            playSfx('click');
            onBackToIntro();
          }}
          className="bg-white text-slate-700 px-5 py-2.5 rounded-full shadow-lg font-black text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>🏠</span>
          {language === 'en' ? 'Main Menu' : language === 'ar' ? 'القائمة الرئيسية' : 'תפריט ראשי'}
        </button>
      </div>

      {/* Map Pins */}
      <div className="absolute inset-0 z-10">
        {activeNodes.map((node, index) => {
          if (!node.coordinates) return null;
          const isBottom = node.coordinates.y > 60;
          const isActive = !node.isLocked && !node.isCompleted;
          
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
                   } else {
                     playSfx('error');
                   }
                }}
                disabled={node.isLocked}
                className={`relative group/pin flex flex-col items-center transition-all duration-300 ${node.isLocked ? 'opacity-80 grayscale cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}`}
              >
                <div className="hidden sm:block w-0.5 h-6 bg-black/30 absolute top-full left-1/2 -translate-x-1/2 origin-top transform scale-y-0 transition-transform duration-300 group-hover/pin:scale-y-100"></div>
                
                {/* Badge */}
                <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-7 sm:h-7 bg-yellow-400 text-blue-900 rounded-full border-[2px] border-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-md z-30 transform transition-transform group-hover/pin:rotate-12">
                  {index + 1}
                </div>
                
                {isActive && (
                   <>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white animate-bounce z-40 whitespace-nowrap">
                      {language === 'he' ? '!חדש' : 'New!'}
                    </div>
                    <div className="absolute inset-0 rounded-3xl ring-4 ring-blue-400 animate-ping opacity-50"></div>
                   </>
                )}

                {/* Pin Icon */}
                <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl rotate-45 flex items-center justify-center shadow-2xl border-[3px] sm:border-[4px] border-white transition-all relative z-20 overflow-hidden
                  ${node.isCompleted ? 'bg-gradient-to-br from-green-400 to-green-600' : node.isLocked ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:shadow-blue-500/50'}
                `}>
                  <span className="-rotate-45 text-lg sm:text-3xl drop-shadow-md filter text-white">
                     {node.isCompleted ? '✓' : node.isLocked ? '🔒' : node.type === 'QUIZ' ? '🔑' : '📍'}
                  </span>
                  {!node.isLocked && <div className="absolute inset-0 bg-white/30 -skew-x-12 -translate-x-full group-hover/pin:animate-shine"></div>}
                </div>

                {/* Tooltip */}
                <div className={`
                  absolute px-4 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl 
                  text-xs sm:text-sm font-bold text-gray-800 whitespace-nowrap opacity-0 
                  group-hover/pin:opacity-100 transition-all duration-300 z-30 flex flex-col items-center 
                  after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent pointer-events-none
                  ${isBottom 
                    ? 'bottom-[calc(100%+16px)] translate-y-2 group-hover/pin:translate-y-0 after:-bottom-3 after:border-t-white/95 after:border-b-transparent' 
                    : 'top-[calc(100%+16px)] -translate-y-2 group-hover/pin:translate-y-0 after:-top-3 after:border-b-white/95 after:border-t-transparent'
                  }
                `}>
                  {node.title}
                  {node.isLocked && <span className="text-[9px] text-red-400 font-normal uppercase tracking-wider block text-center leading-none mt-0.5">LOCKED</span>}
                </div>
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-40 flex items-center gap-3 sm:gap-4 bg-white/95 backdrop-blur px-5 py-2.5 rounded-full shadow-xl animate-fade-in-up">
        <LegendItem color="bg-blue-600" label={t('open', language)} />
        <div className="w-px h-4 bg-gray-200"></div>
        <LegendItem color="bg-green-500" label={t('completed', language)} />
        <div className="w-px h-4 bg-gray-200"></div>
        <LegendItem color="bg-gray-400" label={t('locked', language)} />
      </div>

    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${color} shadow-sm ring-2 ring-gray-100`}></div>
    <span className="text-[10px] sm:text-xs font-bold text-gray-700 whitespace-nowrap">{label}</span>
  </div>
);

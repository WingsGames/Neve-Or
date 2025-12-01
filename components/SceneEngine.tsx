



import React, { useState, useEffect, useRef } from 'react';
import { GameNode, InteractionType, Language, SubScene } from '../types';
import { Button } from './ui/Button';
import { ChatBubble } from './ui/ChatBubble';
import { t } from '../utils/i18n';
import { playSfx } from '../services/audioService';

interface Props {
  node: GameNode;
  onComplete: () => void;
  onBack: () => void;
  language: Language;
}

type Phase = 'INTRO' | 'DIALOG' | 'INTERACTION' | 'DECISION';

// Simple Canvas Confetti Component
const ConfettiCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    for (let i = 0; i < 300; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        speedY: Math.random() * 3 + 3,
        speedX: Math.random() * 4 - 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[100]" />;
};


export const SceneEngine: React.FC<Props> = ({ node, onComplete, onBack, language }) => {
  const [phase, setPhase] = useState<Phase>('INTRO');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Interaction State
  const [interactionComplete, setInteractionComplete] = useState(false);
  const [interactionItems, setInteractionItems] = useState<any[]>([]);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [errorShake, setErrorShake] = useState(false);
  
  // City Hall Sub-Locations State
  const [visitedSubScenes, setVisitedSubScenes] = useState<Set<string>>(new Set());
  const [activeSubScene, setActiveSubScene] = useState<SubScene | null>(null);
  
  // Code Cracker State
  const [codeStep, setCodeStep] = useState(0);
  const [collectedCode, setCollectedCode] = useState<number[]>([]);
  // Code Cracker Feedback state
  const [showCodeFeedback, setShowCodeFeedback] = useState(false);
  const [codeFeedbackText, setCodeFeedbackText] = useState('');
  const [pendingDigit, setPendingDigit] = useState<number | null>(null);

  useEffect(() => {
    setPhase('INTRO');
    setInteractionComplete(false);
    setCodeStep(0);
    setCollectedCode([]);
    setShakeId(null);
    setSelectedAnswerId(null);
    setVisitedSubScenes(new Set());
    setActiveSubScene(null);
    setSelectedOption(null);
    setFeedbackText('');
    setShowCodeFeedback(false);
    setCodeFeedbackText('');
    setPendingDigit(null);
    setErrorShake(false);
    
    if (node.data.interactionType !== InteractionType.NONE && node.data.interactionData?.items) {
      const items = node.data.interactionData.items.map((item: any) => ({
        ...item,
        popped: false,
        protected: false
      }));
      setInteractionItems(items);
    }
  }, [node]);

  const handleBalloonClick = (item: any) => {
    if (item.isCorrect) {
      playSfx('pop');
      setInteractionItems(prev => prev.map(i => i.id === item.id ? { ...i, popped: true } : i));
    } else {
      playSfx('error');
      setShakeId(item.id);
      setTimeout(() => setShakeId(null), 500);
    }
  };

  const handleShieldClick = (item: any) => {
    if (item.isDanger) {
      playSfx('success');
      setInteractionItems(prev => prev.map(i => i.id === item.id ? { ...i, protected: true } : i));
    } else {
      playSfx('error');
      setShakeId(item.id);
      setTimeout(() => setShakeId(null), 500);
    }
  };

  const handleMultipleChoice = (answer: any) => {
    setSelectedAnswerId(answer.id);
    if (answer.correct) {
      playSfx('success');
      setTimeout(() => setInteractionComplete(true), 800);
    } else {
      playSfx('error');
      setShakeId(answer.id);
      setTimeout(() => {
        setShakeId(null);
        setSelectedAnswerId(null);
      }, 800);
    }
  };

  useEffect(() => {
    if (phase === 'INTERACTION') {
       let isDone = false;
       if (node.data.interactionType === InteractionType.BALLOONS) {
         const remainingViolations = interactionItems.filter(i => i.isCorrect && !i.popped);
         isDone = remainingViolations.length === 0;
       } else if (node.data.interactionType === InteractionType.DRAG_SHIELD) {
         const remainingDangers = interactionItems.filter(i => i.isDanger && !i.protected);
         isDone = remainingDangers.length === 0;
       }
       if (isDone && interactionItems.length > 0) {
         playSfx('success');
         setTimeout(() => setInteractionComplete(true), 1000);
       }
    }
  }, [interactionItems, phase, node.data.interactionType]);

  const handleCodeAnswerSelection = (value: number, explanation: string) => {
    if (value === 0) {
      // Wrong answer
      playSfx('error');
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 800);
      return;
    }
    
    // Correct answer
    playSfx('success');
    setCodeFeedbackText(explanation);
    setPendingDigit(value);
    setShowCodeFeedback(true);
  };

  const confirmCodeDigit = () => {
    playSfx('click');
    if (pendingDigit !== null) {
      const newCode = [...collectedCode, pendingDigit];
      setCollectedCode(newCode);
      
      if (codeStep < 3) {
        setCodeStep(prev => prev + 1);
      } else {
        // All digits collected (and confirmed correct)
        // Hardcoded check for the correct logic based on prompts: 3242
        const finalCodeString = newCode.join('');
        if (finalCodeString === '3242') {
          playSfx('victory'); 
          setTimeout(() => setInteractionComplete(true), 500);
        } else {
          // Should not happen with new logic, but safe fallback
          setCollectedCode([]);
          setCodeStep(0);
        }
      }
      
      setShowCodeFeedback(false);
      setPendingDigit(null);
    }
  };

  // Helper to render the Digital Content (Post/Article)
  const renderDigitalContent = (compact = false) => {
    const { data } = node;
    if (!data.digitalContent) return null;

    const badgeLabel = data.digitalContent.type === 'POST' ? t('socialMedia', language) : t('newsAlert', language);
    const isRTL = language === 'he' || language === 'ar';
    const badgePositionClass = isRTL ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl';

    return (
      <div className={`bg-white rounded-2xl shadow-xl relative overflow-hidden ${compact ? 'p-3' : 'p-5'}`}>
        <div className={`absolute top-0 ${badgePositionClass} bg-yellow-400 text-blue-900 text-[10px] sm:text-xs font-black px-4 py-1.5 shadow-sm z-10 uppercase tracking-wide font-sans`}>
          {badgeLabel}
        </div>
        <div className="flex items-center gap-3 mb-3 mt-2">
          <div className={`rounded-full flex items-center justify-center font-bold text-slate-500 bg-slate-100 font-sans shadow-inner ${compact ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-lg'}`}>
            {data.digitalContent.author?.[0] || '📢'}
          </div>
          <div>
              <p className="font-bold text-slate-800 text-sm font-sans">{data.digitalContent.author || data.digitalContent.title}</p>
          </div>
        </div>
        
        <div className={`text-slate-900 font-sans font-medium leading-relaxed ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} px-1`}>
            "{data.digitalContent.content}"
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const { data } = node;

    switch (phase) {
      case 'INTRO':
        return (
          <div className="h-full w-full flex flex-col justify-center items-center py-2 sm:py-4">
            {/* Mission Card UI - Polished */}
            <div 
              className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl w-[95%] max-w-md mx-auto flex flex-col max-h-[85vh] opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
            >
              {/* Header - Enforced font-sans for consistency, cleaner look */}
              <div className="px-5 py-4 sm:px-6 flex justify-between items-center gap-2 flex-shrink-0 font-sans z-10">
                <h2 className="text-xl sm:text-2xl font-black truncate font-sans tracking-tight text-blue-900 drop-shadow-sm">{node.title}</h2>
                <div className="text-[10px] sm:text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0 font-bold shadow-sm">
                  {t('mission', language)}
                </div>
              </div>
              
              {/* Body */}
              <div className="px-5 sm:px-6 pb-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                 <p className="text-sm sm:text-lg leading-relaxed text-gray-700 font-medium mb-4">{data.description}</p>
                 
                 {data.digitalContent && (
                   <div className="mt-4 mb-2">
                     {renderDigitalContent(false)}
                   </div>
                 )}
              </div>
              
              {/* Footer */}
              <div className="p-5 sm:p-6 flex justify-center flex-shrink-0">
                <Button fullWidth onClick={() => setPhase(data.dialog.length > 0 ? 'DIALOG' : (data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION'))} className="py-3 sm:py-4 text-base sm:text-lg font-black shadow-lg shadow-blue-200 rounded-2xl transform transition hover:scale-[1.02]">
                  {t('next', language)}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'DIALOG':
        return (
          <div className="flex flex-col h-full justify-end pb-8 relative">
            {data.digitalContent && (
              <div className="absolute top-14 right-4 max-w-xs animate-fade-in z-20 hidden lg:block">
                 <div className="bg-white/80 backdrop-blur p-2 rounded-2xl shadow-lg">
                    {renderDigitalContent(true)}
                 </div>
              </div>
            )}

            <div className="flex flex-col min-h-0 justify-end w-full max-w-3xl mx-auto z-10">
              <div className="flex-shrink-1 overflow-y-auto mb-2 p-2 mask-image-linear-gradient max-h-[60vh] sm:max-h-[50vh]">
                {data.dialog.map((msg) => (
                  <ChatBubble 
                    key={msg.id} 
                    message={msg} 
                    avatarUrl={data.characterImages?.[msg.speaker]}
                  />
                ))}
              </div>
              <div className="flex justify-center flex-shrink-0">
                <Button onClick={() => setPhase(data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION')} className="py-3 px-12 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold border-4 border-white/20">
                  {data.interactionType !== InteractionType.NONE ? t('challenge', language) : t('next', language)}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'INTERACTION':
        // CITY HALL SUB LOCATIONS
        if (data.interactionType === InteractionType.CITY_HALL_SUB_LOCATIONS && data.subScenes) {
          if (activeSubScene) {
            return (
              <div className="absolute inset-0 z-50 flex flex-col animate-fade-in">
                 {activeSubScene.backgroundImage && (
                    <img 
                      src={activeSubScene.backgroundImage} 
                      className="absolute inset-0 w-full h-full object-cover z-0 scale-100"
                      alt=""
                    />
                 )}
                 <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

                 {/* Header - Font fixed */}
                 <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg animate-slide-up">
                    <span className="text-xl filter drop-shadow-md">{activeSubScene.icon}</span>
                    <h3 className="text-sm font-bold text-white drop-shadow-md font-sans">{activeSubScene.title}</h3>
                 </div>

                 <button 
                   onClick={() => setActiveSubScene(null)} 
                   className="absolute top-4 left-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur text-white w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-lg border border-white/20"
                 >
                   ✕
                 </button>
                     
                 <div className="relative z-10 mt-auto flex flex-col p-4 w-full max-w-2xl mx-auto mb-16">
                     <div className="overflow-y-auto max-h-[50vh] p-2 scrollbar-hide flex flex-col justify-end">
                        {activeSubScene.dialog.map((msg) => (
                          <ChatBubble key={msg.id} message={msg} />
                        ))}
                     </div>
                 </div>
                 
                 <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                    <Button onClick={() => {
                       playSfx('click');
                       setVisitedSubScenes(prev => new Set(prev).add(activeSubScene.id));
                       setActiveSubScene(null);
                     }} className="py-3 px-10 rounded-full text-base font-bold shadow-2xl shadow-blue-900/50 bg-blue-600 hover:bg-blue-500 text-white border-2 border-white/20">
                       {t('finishedListening', language)}
                     </Button>
                 </div>
              </div>
            );
          }

          const canProceed = visitedSubScenes.size >= 3; 
          
          return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in max-w-4xl mx-auto w-full relative z-10">
               <h3 className="text-base sm:text-xl font-black text-white mb-6 text-center drop-shadow-lg font-sans bg-black/40 px-6 py-2 rounded-2xl backdrop-blur-sm">
                 {t('chooseLocation', language)}
               </h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl overflow-y-auto max-h-[60vh] p-2">
                 {data.subScenes.map(scene => {
                   const isVisited = visitedSubScenes.has(scene.id);
                   return (
                     <button
                       key={scene.id}
                       onClick={() => {
                         playSfx('click');
                         setActiveSubScene(scene);
                       }}
                       className={`relative overflow-hidden p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 shadow-lg group text-right min-h-[80px]
                         ${isVisited ? 'bg-black/60 backdrop-blur-sm' : 'bg-white/95 hover:scale-105 hover:shadow-2xl'}
                       `}
                     >
                       {scene.backgroundImage && (
                          <div className="absolute inset-0 opacity-40 z-0">
                             <img src={scene.backgroundImage} className="w-full h-full object-cover" alt="" />
                          </div>
                       )}
                       <div className="relative z-10 text-3xl group-hover:scale-110 transition-transform filter drop-shadow-sm">{scene.icon}</div>
                       <div className="relative z-10 flex-1">
                         <div className={`font-black text-base ${isVisited ? 'text-white' : 'text-gray-900'}`}>{scene.title}</div>
                         <div className={`text-xs font-bold mt-1 ${isVisited ? 'text-green-300' : 'text-blue-600'}`}>
                           {isVisited ? t('visited', language) : t('clickToListen', language)}
                         </div>
                       </div>
                     </button>
                   );
                 })}
               </div>

               <div className="mt-6 sm:mt-10 w-full flex justify-center">
                 <Button 
                   onClick={() => setPhase('DECISION')} 
                   disabled={!canProceed}
                   className={`py-3 px-10 rounded-full text-base font-bold shadow-xl transition-all ${canProceed ? 'animate-bounce bg-blue-600 hover:bg-blue-500 ring-4 ring-blue-500/30' : 'bg-gray-500/50 cursor-not-allowed text-gray-300'}`}
                 >
                   {canProceed ? t('proceedToDecision', language) : `${t('visitMore', language)} ${3 - visitedSubScenes.size} ${t('locations', language)}`}
                 </Button>
               </div>
            </div>
          );
        }

        // MULTIPLE CHOICE - COMPACT & POLISHED
        if (data.interactionType === InteractionType.MULTIPLE_CHOICE && data.interactionData?.question) {
           return (
             <div className="h-full w-full flex flex-col overflow-hidden animate-fade-in relative">
                {/* 1. Header (Shrink 0) */}
                <div className="flex-shrink-0 mb-4 z-10">
                   <div className="bg-white/95 backdrop-blur-xl text-blue-900 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-center p-5 text-center">
                      <h3 className="text-sm sm:text-base font-black relative z-10 leading-tight font-sans tracking-tight">{data.interactionData.question}</h3>
                   </div>
                </div>

                {/* 2. CONTENT (Flex 1) */}
                <div className="flex-1 min-h-0 flex flex-col relative w-full">
                  {!interactionComplete ? (
                     <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-1 pb-4">
                        {data.interactionData.answers.map((ans: any) => {
                          const isSelected = selectedAnswerId === ans.id;
                          const isError = isSelected && !ans.correct && shakeId === ans.id;
                          return (
                            <button
                              key={ans.id}
                              onClick={() => handleMultipleChoice(ans)}
                              className={`
                                p-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 flex justify-between items-center text-start shadow-sm shrink-0 min-h-[60px]
                                ${isSelected && ans.correct 
                                   ? 'bg-green-500 text-white shadow-green-200 shadow-lg scale-[1.02]' 
                                   : isError 
                                     ? 'bg-red-500 text-white animate-shake shadow-red-200' 
                                     : 'bg-white hover:bg-blue-50 text-gray-700 hover:shadow-lg hover:scale-[1.01]'
                                }
                              `}
                            >
                              <span className="flex-1 leading-snug">{ans.text}</span>
                              <span className="text-xl flex-shrink-0 ml-3">
                                {isSelected && ans.correct && '✓'}
                                {isError && '✕'}
                              </span>
                            </button>
                          );
                        })}
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-2 overflow-y-auto">
                        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl text-center w-full max-w-sm flex flex-col items-center flex-shrink-0">
                           <div className="text-5xl mb-3 animate-bounce">✅</div>
                           <h3 className="text-2xl font-black text-blue-900 mb-1">{t('correct', language)}</h3>
                           <p className="text-gray-500 font-bold mb-6 text-sm">{t('correctAnswer', language)}</p>
                           <Button fullWidth className="py-3 text-base shadow-xl bg-blue-600 text-white mt-auto flex-shrink-0 rounded-2xl" onClick={() => setPhase('DECISION')}>{t('next', language)}</Button>
                        </div>
                     </div>
                  )}
                </div>
             </div>
           );
        }

        // BALLOONS
        if (data.interactionType === InteractionType.BALLOONS) {
          const colors = [
             { bg: 'radial-gradient(circle at 30% 30%, #ef4444, #991b1b)', shadow: 'shadow-red-900/40' },
             { bg: 'radial-gradient(circle at 30% 30%, #eab308, #854d0e)', shadow: 'shadow-yellow-900/40' },
             { bg: 'radial-gradient(circle at 30% 30%, #3b82f6, #1e3a8a)', shadow: 'shadow-blue-900/40' },
             { bg: 'radial-gradient(circle at 30% 30%, #8b5cf6, #5b21b6)', shadow: 'shadow-purple-900/40' },
          ];

          return (
            <div className="h-full flex flex-col relative overflow-hidden animate-fade-in w-full max-w-4xl mx-auto rounded-[2.5rem] shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              {/* 1. Header (Shrink 0) */}
              {!interactionComplete && (
                  <div className="text-center z-10 pt-4 px-2 flex-shrink-0">
                    <div className="inline-block bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg">
                      <h3 className="font-black text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-sans tracking-wide">
                        {t('balloonsInst', language)}
                      </h3>
                    </div>
                  </div>
              )}

              {/* 2. Content (Flex 1) */}
              <div className="flex-1 relative z-10 overflow-hidden min-h-0 w-full flex flex-col">
                {!interactionComplete ? (
                    <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-1 sm:gap-4 h-full w-full px-2 pb-4 pt-10">
                      {interactionItems.map((item, index) => {
                        const theme = colors[index % colors.length];
                        const isPopped = item.popped;
                        const isShaking = shakeId === item.id;
                        const floatDuration = 4 + (index * 0.7); 
                        const floatDelay = index * 1.2;
                        const staggerClass = index % 2 === 0 ? '-translate-y-2 sm:-translate-y-6' : 'translate-y-2 sm:translate-y-6';

                        return (
                          <div 
                            key={item.id}
                            className={`relative flex flex-col items-center justify-center transition-all duration-300 ${isPopped ? 'balloon-burst' : 'balloon-float'} ${isShaking ? 'animate-shake' : ''} ${staggerClass}`}
                            style={{ animationDuration: isPopped ? '0.3s' : `${floatDuration}s`, animationDelay: isPopped ? '0s' : `-${floatDelay}s` }}
                          >
                            <button
                              onClick={() => handleBalloonClick(item)}
                              disabled={isPopped}
                              className={`balloon-shape w-20 h-24 sm:w-28 sm:h-32 flex items-center justify-center p-1 text-center cursor-pointer group border-none outline-none ring-0 ${theme.shadow}`}
                              style={{ background: theme.bg }}
                            >
                              <p className="relative z-10 font-bold text-white text-[9px] sm:text-xs leading-tight drop-shadow-md select-none group-hover:scale-105 transition-transform line-clamp-4 px-2">
                                {item.text}
                              </p>
                            </button>
                            <div className="w-[1px] bg-white/60 origin-top animate-[stringWave_3s_ease-in-out_infinite]" style={{ height: '40px', animationDelay: `-${floatDelay}s` }}></div>
                          </div>
                        );
                      })}
                    </div>
                ) : (
                  <div className="h-full flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl text-center max-w-xs w-full">
                      <div className="text-6xl mb-4 animate-bounce">✨</div>
                      <h3 className="text-2xl font-black text-blue-900 mb-6">{t('correct', language)}</h3>
                      <Button className="px-8 py-3 w-full shadow-lg text-base rounded-2xl" onClick={() => setPhase('DECISION')}>{t('next', language)}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // DRAG SHIELD
        if (data.interactionType === InteractionType.DRAG_SHIELD) {
           return (
             <div className="h-full w-full flex flex-col overflow-hidden animate-fade-in relative">
                {/* 1. Header Area (Shrink 0) */}
                <div className="flex-shrink-0 text-center mb-4 z-10 pt-2 px-2">
                   <div className="bg-white/95 backdrop-blur-xl text-blue-900 rounded-full shadow-lg inline-flex items-center px-8 py-3 relative overflow-hidden max-w-full">
                       <h3 className="text-sm sm:text-base font-black flex items-center gap-2 relative z-10 whitespace-nowrap font-sans">
                          <span className="text-xl">🛡️</span> 
                          {t('shieldInst', language)}
                       </h3>
                   </div>
                </div>

                {/* 2. Content Grid (Flex 1) */}
                <div className="flex-1 overflow-y-auto min-h-0 relative z-10 custom-scrollbar px-1 pb-2">
                   <div className="grid grid-cols-2 gap-4">
                      {interactionItems.map((item) => {
                        const isShaking = shakeId === item.id;
                        const isProtected = item.protected;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleShieldClick(item)}
                            disabled={isProtected}
                            className={`
                               relative group p-4 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 min-h-[120px]
                               shadow-md backdrop-blur-sm shrink-0
                               ${isProtected ? 'bg-blue-50/90 shadow-blue-100 cursor-default scale-95' : isShaking ? 'bg-red-50 animate-shake' : 'bg-white/95 hover:-translate-y-1 hover:shadow-xl'}
                            `}
                          >
                            <div className="text-3xl sm:text-5xl filter drop-shadow-sm transition-transform group-hover:scale-110">
                                {item.text.includes('טלפון') ? '📱' : item.text.includes('שוטר') ? '👮' : item.text.includes('אלימות') ? '👊' : '🚶'}
                            </div>
                            <p className={`text-xs sm:text-sm font-bold leading-tight ${isProtected ? 'text-blue-800' : 'text-gray-700'}`}>{item.text}</p>
                            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isProtected ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                               <div className="bg-white/90 rounded-full p-4 shadow-xl backdrop-blur-sm"><div className="text-4xl drop-shadow-lg animate-bounce">🛡️</div></div>
                            </div>
                          </button>
                        );
                      })}
                   </div>
                </div>

                {/* 3. Footer Button (Shrink 0) */}
                <div className="flex-shrink-0 p-4 pb-6 flex justify-center z-20">
                  {interactionComplete && (
                    <Button 
                       fullWidth 
                       onClick={() => setPhase('DECISION')} 
                       className="animate-slide-up max-w-sm py-3 text-base font-bold shadow-xl shadow-green-900/30 bg-green-600 hover:bg-green-700 rounded-full"
                    >
                      {t('next', language)}
                    </Button>
                  )}
                </div>
             </div>
           );
        }

        // CODE CRACKER
        if (data.interactionType === InteractionType.CODE_CRACKER && data.interactionData?.questions) {
          const questions = data.interactionData.questions;
          const currentQ = questions[codeStep];
          
          if (interactionComplete) {
             return (
               <div className="relative h-full w-full">
                  {/* CONFETTI LAYER for Finale */}
                  <ConfettiCanvas />
                  
                  <div className="text-center animate-fade-in bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] shadow-2xl h-full flex flex-col items-center overflow-y-auto relative z-10">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-5xl shadow-inner mb-4 flex-shrink-0">🔓</div>
                    
                    <h2 className="text-3xl font-black text-blue-900 mb-2 font-sans tracking-tight">{node.data.moreInfoTitle || t('codeCracked', language)}</h2>
                    
                    {/* The Code Display */}
                    <div className="flex justify-center gap-4 mb-8 mt-4">
                      {collectedCode.map((digit, idx) => (
                        <div key={idx} className="w-14 h-20 bg-slate-900 text-green-400 flex items-center justify-center text-5xl font-mono rounded-2xl shadow-2xl animate-bounce" style={{ animationDelay: `${idx * 100}ms` }}>{digit}</div>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar w-full mb-6 bg-blue-50/50 p-6 rounded-3xl text-right rtl:text-right ltr:text-left">
                        <p className="text-base font-medium text-gray-800 leading-relaxed whitespace-pre-line">
                          {node.data.moreInfoContent}
                        </p>
                    </div>

                    <Button fullWidth onClick={onComplete} className="flex-shrink-0 py-4 text-lg shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black rounded-2xl transform transition hover:scale-105">{t('finishGame', language)}</Button>
                  </div>
               </div>
             );
          }
          return (
            <div className={`h-full w-full flex flex-col overflow-hidden animate-fade-in relative ${errorShake ? 'animate-shake' : ''}`}>
              {/* Error Overlay */}
              {errorShake && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-500/20 backdrop-blur-sm animate-pulse rounded-2xl pointer-events-none">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-xl transform rotate-3">
                       {t('tryAgain', language)} ⛔
                    </div>
                 </div>
              )}

              {/* Success/Feedback Overlay */}
              {showCodeFeedback && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm flex flex-col rounded-[2rem] p-8 shadow-2xl animate-slide-up">
                       <h3 className="text-xl font-black text-green-600 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 font-sans">
                         <span>✅</span> {t('correct', language)}
                       </h3>
                       <div className="overflow-y-auto flex-1 mb-6 custom-scrollbar">
                          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-line font-medium">
                            {codeFeedbackText}
                          </p>
                       </div>
                       <Button fullWidth onClick={confirmCodeDigit} className="py-3 text-base bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg rounded-2xl">
                          {t('next', language)}
                       </Button>
                    </div>
                 </div>
              )}

              {/* 1. Terminal - Fixed */}
              <div className="bg-slate-800 text-green-400 p-4 rounded-3xl font-mono text-center shadow-lg transform rotate-1 flex-shrink-0 mb-4 mx-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-sans font-bold">{t('codeLabel', language)}</p>
                <div className="text-3xl tracking-[0.6em] flex justify-center h-10 items-center text-shadow-glow">
                   {collectedCode.map(c => c).join('')}
                   {[...Array(4 - collectedCode.length)].map((_, i) => <span key={i} className="animate-pulse opacity-50">_</span>)}
                </div>
              </div>
              
              {/* 2. Header - Fixed */}
              <div className="bg-white/95 backdrop-blur-xl text-blue-900 rounded-3xl shadow-xl relative overflow-hidden flex-shrink-0 flex flex-col justify-center p-5 mb-4 text-center mx-1">
                <div className="absolute top-2 right-4 text-blue-300 text-[10px] uppercase font-bold tracking-wider font-sans">{t('question', language)} {codeStep + 1} / {questions.length}</div>
                <h3 className="text-sm sm:text-base font-bold relative z-10 leading-snug font-sans tracking-wide pt-2">{currentQ.question}</h3>
              </div>

              {/* 3. Grid - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 pb-2 px-1">
                <div className="flex flex-col gap-3">
                  {currentQ.options.map((opt: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => handleCodeAnswerSelection(opt.value, currentQ.explanation)}
                      className="py-4 px-5 bg-white shadow-sm rounded-2xl hover:bg-blue-600 hover:text-white hover:shadow-xl transition-all font-bold text-sm sm:text-base active:scale-95 text-blue-900 flex items-center gap-4 text-start min-h-[70px] group"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-black group-hover:bg-white group-hover:text-blue-600 font-sans transition-colors">{idx + 1}</span>
                      <span className="flex-1 font-sans">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        return (
           <div className="flex items-center justify-center h-full">
             <Button onClick={() => setPhase('DECISION')}>{t('next', language)}</Button>
           </div>
        );

      case 'DECISION':
        const selectedOptData = data.options.find(o => o.id === selectedOption);

        return (
          <div className="h-full w-full flex flex-col overflow-hidden animate-fade-in relative">
             {/* 1. Header - Fixed (Shrink 0) */}
             <div className={`bg-white/95 backdrop-blur-xl text-blue-900 rounded-[2rem] shadow-xl relative overflow-hidden transition-all duration-500 flex-shrink-0 flex flex-col justify-center text-center font-sans
                ${selectedOption ? 'p-3 mb-3' : 'p-6 mb-6'}
             `}>
                {!selectedOption && <h2 className="text-2xl font-black mb-2 relative z-10 drop-shadow-sm">⁉️</h2>}
                <p className={`relative z-10 leading-snug font-bold font-sans ${selectedOption ? 'text-xs sm:text-sm line-clamp-1' : 'text-sm sm:text-lg'}`}>
                   {data.decisionQuestion}
                </p>
             </div>

             {/* 2. Content Area (Flex 1, Scrollable) */}
             <div className="flex-1 min-h-0 flex flex-col relative w-full">
               {!selectedOption ? (
                  // OPTIONS LIST - Compacted for mobile
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-1 pb-2">
                    {data.options.map(opt => (
                       <button
                         key={opt.id}
                         disabled={!!selectedOption}
                         className={`
                           p-4 text-start rounded-2xl transition-all shadow-sm font-bold text-gray-700 text-sm sm:text-base relative overflow-hidden flex-shrink-0 bg-white hover:bg-blue-50 hover:shadow-lg min-h-[70px] flex items-center group
                         `}
                         onClick={() => {
                           playSfx('click');
                           setSelectedOption(opt.id);
                           setFeedbackText(opt.feedback);
                         }}
                       >
                         <div className="flex items-center gap-4 w-full">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-200 group-hover:bg-blue-500 transition-colors"></span>
                            <span className="relative z-10 flex-1 leading-snug font-sans">{opt.text}</span>
                         </div>
                       </button>
                    ))}
                  </div>
               ) : (
                  // FEEDBACK CARD (Swapped in)
                  <div className="flex-1 flex flex-col animate-slide-up overflow-hidden pb-1 min-h-0">
                     <div className="bg-blue-50 border-r-4 border-blue-500 p-3 rounded-l-2xl mb-3 flex-shrink-0 shadow-sm mx-1">
                         <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block font-sans mb-1">{t('yourChoice', language)}</span>
                         <p className="text-blue-900 font-bold text-sm leading-tight line-clamp-1 font-sans">{selectedOptData?.text}</p>
                     </div>

                     <div className="flex-1 bg-white shadow-2xl rounded-[2rem] p-6 flex flex-col items-center text-center relative overflow-hidden min-h-0">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner flex-shrink-0">💡</div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar w-full mb-4 min-h-0">
                           <p className="text-sm sm:text-base text-gray-800 font-medium leading-relaxed px-2">
                               {feedbackText}
                           </p>
                        </div>
                        
                        <div className="w-full flex flex-col gap-3 mt-auto flex-shrink-0">
                           <Button variant="outline" className="w-full py-3 text-sm text-blue-700 hover:bg-blue-50 font-bold border-0 bg-blue-50/50" onClick={() => { playSfx('pop'); setShowMoreInfo(true); }}>
                             ℹ️ {t('moreInfo', language)}
                           </Button>
                           <Button className="w-full py-3.5 text-sm shadow-xl bg-blue-600 text-white rounded-2xl font-black" onClick={onComplete}>
                             {node.type === 'QUIZ' ? t('finishGame', language) : t('finishLevel', language)}
                           </Button>
                        </div>
                     </div>
                  </div>
               )}
             </div>

             {/* More Info Modal - IMPROVED SIZE AND READABILITY */}
             {showMoreInfo && (
               <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                 <div className="bg-white w-[95%] sm:w-[90%] max-w-2xl max-h-[85vh] flex flex-col rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative">
                   <button 
                     onClick={() => { playSfx('click'); setShowMoreInfo(false); }}
                     className="absolute top-5 left-5 w-10 h-10 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-xl z-10 transition-colors"
                   >✕</button>
                   
                   <h3 className="text-2xl sm:text-3xl font-black text-blue-900 mb-6 border-b pb-4 pl-4 font-sans leading-tight text-right">{data.moreInfoTitle}</h3>
                   
                   <div className="overflow-y-auto flex-1 mb-6 pl-2 custom-scrollbar">
                      <p className="text-gray-900 text-lg sm:text-xl leading-relaxed whitespace-pre-line font-medium font-sans text-right">
                        {data.moreInfoContent}
                      </p>
                   </div>
                   
                   <Button fullWidth onClick={() => { playSfx('click'); setShowMoreInfo(false); }} className="py-4 text-lg font-black shadow-xl rounded-2xl">{t('understood', language)}</Button>
                 </div>
               </div>
             )}
          </div>
        );
    }
  };

  const isIntro = phase === 'INTRO';

  return (
    <div className="absolute inset-0 h-[100dvh] bg-slate-900 flex flex-col font-sans relative overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
       {/* Background Image Layer */}
       {node.data.backgroundImage && (
         <div className={`absolute inset-0 z-0 animate-fade-in transition-all duration-1000 ${activeSubScene ? 'filter blur-[0px] scale-100' : ''}`}>
            <img 
              src={node.data.backgroundImage} 
              className={`w-full h-full object-cover transition-all duration-1000 ${
                isIntro ? 'opacity-100 blur-sm scale-105' : 'opacity-100 blur-0'
              }`} 
              alt=""
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            {/* Overlay Gradient */}
            <div className={`absolute inset-0 transition-all duration-1000 ${
              isIntro ? 'bg-black/40' : 'bg-black/20'
            }`}></div>
         </div>
       )}

       {/* Top Navigation Bar - Minimal */}
       <div className="p-3 sm:p-5 flex justify-between items-center sticky top-0 z-20 transition-all duration-500 flex-shrink-0 h-16" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
         <Button 
            variant="outline" 
            className={`py-2 px-5 text-xs rounded-full backdrop-blur-md transition-colors font-bold shadow-lg bg-white/10 border-0 text-white hover:bg-white/20`} 
            onClick={onBack}
         >
            {t('backToMap', language)}
         </Button>
         {!isIntro && <span className="font-bold text-white text-xs drop-shadow-md bg-black/40 px-4 py-1.5 rounded-full truncate max-w-[200px] font-sans backdrop-blur-md">{node.title}</span>}
       </div>

       {/* Main Content Area */}
       <main className="flex-1 p-3 sm:p-5 max-w-5xl mx-auto w-full relative z-10 flex flex-col justify-center min-h-0 pb-6 overflow-hidden">
         {renderContent()}
       </main>
    </div>
  );
};
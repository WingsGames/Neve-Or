
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

type Phase = 'INTRO' | 'DIALOG' | 'INTERACTION' | 'DECISION' | 'DECISION_PHASE_2';
type TransitionDirection = 'forward' | 'back';

export const SceneEngine: React.FC<Props> = ({ node, onComplete, onBack, language }) => {
  const [phase, setPhase] = useState<Phase>('INTRO');
  const [transitionDir, setTransitionDir] = useState<TransitionDirection>('forward');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showDigitalContentModal, setShowDigitalContentModal] = useState(false); // New state for modal
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const [interactionComplete, setInteractionComplete] = useState(false);
  const [interactionItems, setInteractionItems] = useState<any[]>([]);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [errorShake, setErrorShake] = useState(false);
  
  const [visitedSubScenes, setVisitedSubScenes] = useState<Set<string>>(new Set());
  const [activeSubScene, setActiveSubScene] = useState<SubScene | null>(null);
  
  const [codeStep, setCodeStep] = useState(0);
  const [collectedCode, setCollectedCode] = useState<number[]>([]);
  const [showCodeFeedback, setShowCodeFeedback] = useState(false);
  const [codeFeedbackText, setCodeFeedbackText] = useState('');
  const [pendingDigit, setPendingDigit] = useState<number | null>(null);

  // New state for the 4-second delay on Intro
  const [showIntroCard, setShowIntroCard] = useState(false);

  useEffect(() => {
    setPhase('INTRO');
    setTransitionDir('forward');
    setShowIntroCard(false); // Reset intro card visibility
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
    setShowDigitalContentModal(false);
    
    if (node.data.interactionType !== InteractionType.NONE && node.data.interactionData?.items) {
      const items = node.data.interactionData.items.map((item: any) => ({
        ...item,
        popped: false,
        protected: false
      }));
      setInteractionItems(items);
    }
  }, [node]);

  // Audio & Animation effect when Phase changes
  useEffect(() => {
     if (phase !== 'INTRO') {
        playSfx('transition');
     }
  }, [phase]);

  // Sound effects for modals
  useEffect(() => {
    if (showMoreInfo || showDigitalContentModal) {
      playSfx('modal_open');
    }
  }, [showMoreInfo, showDigitalContentModal]);

  // Timer logic for Intro Phase
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (phase === 'INTRO') {
      setShowIntroCard(false);
      // Wait 4 seconds before showing card
      timer = setTimeout(() => {
        setShowIntroCard(true);
        playSfx('bubble');
      }, 4000);
    } else {
      // If we move past INTRO, ensure card is visible immediately if accessed later
      setShowIntroCard(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase]);

  const changePhase = (newPhase: Phase, dir: TransitionDirection = 'forward') => {
    setTransitionDir(dir);
    setPhase(newPhase);
  };

  // Allow clicking background to skip delay
  const handleBackgroundClick = () => {
    if (phase === 'INTRO' && !showIntroCard) {
      setShowIntroCard(true);
      playSfx('bubble');
    }
  };

  const handleBalloonClick = (item: any) => {
    // Logic: Pop only items that ARE a violation (isCorrect=true in this context means "Correct target to pop")
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
      playSfx('snap'); // Nice mechanical snap sound for protecting
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
      setTimeout(() => { setShakeId(null); setSelectedAnswerId(null); }, 800);
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
       if (isDone && interactionItems.length > 0 && !interactionComplete) {
         playSfx('success');
         setTimeout(() => setInteractionComplete(true), 1000);
       }
    }
  }, [interactionItems, phase, node.data.interactionType, interactionComplete]);

  const handleCodeAnswerSelection = (value: number, explanation: string) => {
    if (value === 0) {
      playSfx('error');
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 800);
      return;
    }
    playSfx('snap');
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
        setShowCodeFeedback(false);
      } else {
        const finalCodeString = newCode.join('');
        // Simple check (in a real app this would be dynamic)
        if (finalCodeString === '3242') {
          playSfx('victory'); 
          setTimeout(() => setInteractionComplete(true), 500);
        } else {
          setCollectedCode([]);
          setCodeStep(0);
          setShowCodeFeedback(false);
          alert(t('tryAgain', language));
        }
      }
      setPendingDigit(null);
    }
  };

  const renderDigitalContent = (compact = false) => {
    const { data } = node;
    if (!data.digitalContent) return null;
    const badgeLabel = data.digitalContent.type === 'POST' ? t('socialMedia', language) : t('newsAlert', language);
    const isRTL = language === 'he' || language === 'ar';
    const badgePositionClass = isRTL ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl';

    return (
      <div className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-xl relative overflow-hidden w-full animate-pop-in ${compact ? 'p-2' : 'p-3 sm:p-5'}`}>
        <div className={`absolute top-0 ${badgePositionClass} bg-yellow-400 text-blue-900 text-[9px] sm:text-xs font-black px-3 py-1 shadow-sm z-10 uppercase tracking-wide`}>
          {badgeLabel}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 mt-1">
          <div className={`rounded-full flex items-center justify-center font-bold text-slate-500 bg-slate-100 shadow-inner ${compact ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-base'}`}>
            {data.digitalContent.author?.[0] || '📢'}
          </div>
          <div><p className="font-bold text-slate-800 text-xs sm:text-sm">{data.digitalContent.author || data.digitalContent.title}</p></div>
        </div>
        <div className={`text-slate-900 font-medium leading-tight sm:leading-relaxed ${compact ? 'text-xs' : 'text-xs sm:text-sm'} px-1`}>
            "{data.digitalContent.content}"
        </div>
        {data.digitalContent.likes && (
             <div className="mt-2 flex justify-end">
                <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm border border-blue-100">
                   <span>👍</span>
                   <span>{data.digitalContent.likes}</span>
                   <span>{t('likes', language)}</span>
                </div>
             </div>
        )}
      </div>
    );
  };

  const handleDecisionComplete = () => {
    if (phase === 'DECISION' && node.data.secondaryDecisionQuestion) {
      changePhase('DECISION_PHASE_2', 'forward');
      setSelectedOption(null);
      setFeedbackText('');
      setShowMoreInfo(false);
    } else {
      playSfx('unlock');
      onComplete();
    }
  };

  // Logic to go back one step in the flow
  const handleStepBack = () => {
    playSfx('click');
    
    // 1. If in a sub-scene popup, just close it
    if (activeSubScene) {
        setActiveSubScene(null);
        return;
    }

    // 2. Main Phase Navigation Reverse Logic
    if (phase === 'DECISION_PHASE_2') {
        changePhase('DECISION', 'back');
        setSelectedOption(null);
    } else if (phase === 'DECISION') {
        if (node.data.interactionType !== InteractionType.NONE) {
            changePhase('INTERACTION', 'back');
        } else if (node.data.dialog.length > 0) {
            changePhase('DIALOG', 'back');
        } else {
            changePhase('INTRO', 'back');
            setShowIntroCard(true); 
        }
    } else if (phase === 'INTERACTION') {
        if (node.data.dialog.length > 0) {
            changePhase('DIALOG', 'back');
        } else {
            changePhase('INTRO', 'back');
            setShowIntroCard(true);
        }
    } else if (phase === 'DIALOG') {
        changePhase('INTRO', 'back');
        setShowIntroCard(true);
    }
  };

  // Check if we should skip the decision phase (if it's just a "Continue" button)
  const isTrivialDecision = node.data.options.length === 1;
  const trivialOption = isTrivialDecision ? node.data.options[0] : null;

  // Determine animation class based on direction
  const animClass = transitionDir === 'back' ? 'animate-slide-in-left' : 'animate-slide-in-right';

  // --- RENDER CONTENT ---
  const renderContent = () => {
    const { data } = node;

    switch (phase) {
      case 'INTRO':
        // Only render the card if the timer is done (or user skipped)
        if (!showIntroCard) {
            return (
                <div className="h-full w-full flex items-center justify-center pointer-events-none animate-fade-in">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full shadow-2xl animate-spin border border-white/20">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
            );
        }

        const introAnim = transitionDir === 'back' ? 'animate-slide-in-left' : 'animate-zoom-in';

        return (
          <div className="flex flex-col h-full w-full justify-center items-center p-2">
            {/* Compact Fit */}
            <div className={`bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-full overflow-hidden ${introAnim} border border-white/40`}>
              <div className="px-4 py-2 flex justify-between items-center gap-2 flex-shrink-0 bg-white/50 border-b border-gray-100/50">
                <h2 className="text-sm sm:text-lg font-black truncate text-blue-900">{node.title}</h2>
                <div className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">
                  {t('mission', language)}
                </div>
              </div>
              
              <div className="px-4 py-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                 <p className="text-xs sm:text-sm leading-relaxed text-gray-800 font-bold mb-3 whitespace-pre-line">{data.description}</p>
                 {data.digitalContent && <div className="mb-2">{renderDigitalContent(false)}</div>}
              </div>
              
              <div className="p-3 flex justify-center flex-shrink-0 bg-white/50 border-t border-gray-100/50">
                <Button fullWidth onClick={() => changePhase(data.dialog.length > 0 ? 'DIALOG' : (data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION'))} className="py-2 text-sm font-black shadow-lg rounded-xl">
                  {t('next', language)}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'DIALOG':
        return (
          <div className={`flex flex-col h-full w-full max-w-4xl mx-auto relative overflow-hidden ${animClass}`}>
            {/* Message Area - Takes remaining space, scrolls internally */}
            <div className="flex-1 overflow-y-auto min-h-0 p-1 mask-image-linear-gradient custom-scrollbar pb-2">
              {data.dialog.map((msg) => (
                <ChatBubble key={msg.id} message={msg} avatarUrl={data.characterImages?.[msg.speaker]} />
              ))}
            </div>
            {/* Footer with Button - Always visible at bottom of flex container */}
            <div className="flex justify-center flex-shrink-0 py-2 z-30 mt-auto">
              <Button onClick={() => changePhase(data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION')} className="py-1.5 px-6 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold border-2 border-white/20 backdrop-blur-sm">
                {data.interactionType !== InteractionType.NONE ? t('challenge', language) : t('next', language)}
              </Button>
            </div>
          </div>
        );

      case 'INTERACTION':
        // 1. SUB LOCATIONS (CITY HALL)
        if (data.interactionType === InteractionType.CITY_HALL_SUB_LOCATIONS && data.subScenes) {
          if (activeSubScene) {
            return (
              <div className="absolute inset-0 z-50 flex flex-col animate-zoom-in bg-slate-900/50 backdrop-blur-sm">
                 {/* Full bright background for sub-scene */}
                 {activeSubScene.backgroundImage && (
                    <img src={activeSubScene.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
                 )}
                 <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 shadow-lg">
                    <span className="text-lg">{activeSubScene.icon}</span>
                    <h3 className="text-xs font-bold text-blue-900">{activeSubScene.title}</h3>
                 </div>
                 <button onClick={() => setActiveSubScene(null)} className="absolute top-2 left-2 z-20 bg-black/30 text-white hover:bg-black/50 w-8 h-8 rounded-full flex items-center justify-center font-bold border border-white/30 backdrop-blur-md">✕</button>
                 
                 <div className="relative z-10 flex flex-col p-3 w-full max-w-4xl mx-auto h-full justify-end">
                     <div className="overflow-y-auto flex-1 min-h-0 p-1 flex flex-col justify-end mask-image-linear-gradient custom-scrollbar">
                        {activeSubScene.dialog.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
                     </div>
                     <div className="flex justify-center mt-2 flex-shrink-0 pt-2 pb-4">
                        <Button onClick={() => { playSfx('click'); setVisitedSubScenes(prev => new Set(prev).add(activeSubScene.id)); setActiveSubScene(null); }} className="py-2 px-8 rounded-full text-sm font-bold shadow-xl bg-blue-600 text-white border-2 border-white/20">
                           {t('finishedListening', language)}
                         </Button>
                     </div>
                 </div>
              </div>
            );
          }

          const canProceed = visitedSubScenes.size >= 3; 
          return (
            <div className={`h-full flex flex-col items-center max-w-5xl mx-auto w-full relative z-10 ${animClass}`}>
               <div className="flex-shrink-0 mb-2">
                 <h3 className="text-sm font-black text-white text-center drop-shadow-lg bg-black/40 px-4 py-1.5 rounded-xl backdrop-blur-md border border-white/10 w-fit mx-auto">
                   {t('chooseLocation', language)}
                 </h3>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full overflow-y-auto flex-1 min-h-0 custom-scrollbar p-2 items-center content-center">
                 {data.subScenes.map(scene => {
                   const isVisited = visitedSubScenes.has(scene.id);
                   return (
                     <button key={scene.id} onClick={() => { playSfx('modal_open'); setActiveSubScene(scene); }}
                       className={`
                         relative overflow-hidden rounded-2xl transition-all shadow-lg group border-2 flex flex-col
                         aspect-[3/4] hover:scale-105 active:scale-95 mx-auto w-full max-w-[180px]
                         ${isVisited ? 'border-green-400 ring-2 ring-green-200' : 'border-white/50 hover:border-white'}
                       `}
                     >
                        <div className="h-2/3 w-full relative overflow-hidden bg-slate-800 flex-shrink-0">
                           {scene.backgroundImage ? (
                             <img src={scene.backgroundImage} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isVisited ? 'grayscale-[50%]' : ''}`} alt="" />
                           ) : (
                             <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                           )}
                           <div className="absolute top-2 right-2 text-3xl drop-shadow-md">{scene.icon}</div>
                           
                           {isVisited && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                 <div className="bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white">✓</div>
                              </div>
                           )}
                        </div>

                        <div className={`h-1/3 w-full flex flex-col items-center justify-center p-2 text-center transition-colors flex-grow ${isVisited ? 'bg-slate-100' : 'bg-white/95 backdrop-blur-md'}`}>
                           <span className="font-black text-xs sm:text-sm text-blue-900 leading-tight mb-1">{scene.title}</span>
                           <span className={`text-[10px] font-bold uppercase tracking-wider ${isVisited ? 'text-green-600' : 'text-blue-500'}`}>
                             {isVisited ? t('visited', language) : t('clickToListen', language)}
                           </span>
                        </div>
                     </button>
                   );
                 })}
               </div>

               <div className="mt-2 w-full flex justify-center flex-shrink-0 pb-4">
                 <Button onClick={() => changePhase('DECISION')} disabled={!canProceed} className={`py-1.5 px-6 rounded-full text-xs font-bold shadow-lg border border-white/20 backdrop-blur-sm ${canProceed ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-500/50 cursor-not-allowed'}`}>
                   {canProceed ? t('proceedToDecision', language) : `${t('visitMore', language)} ${3 - visitedSubScenes.size}`}
                 </Button>
               </div>
            </div>
          );
        }

        // 2. MULTIPLE CHOICE
        if (data.interactionType === InteractionType.MULTIPLE_CHOICE && data.interactionData?.question) {
           return (
             <div className={`h-full w-full flex flex-col items-center overflow-hidden relative ${animClass}`}>
                <div className="flex-shrink-0 mb-2 z-10 max-w-[98%] mt-2">
                   <div className="bg-white/85 backdrop-blur-xl text-blue-900 rounded-lg shadow-lg p-2 text-center border border-white/40 w-fit mx-auto">
                      <h3 className="text-xs sm:text-sm font-black relative z-10 leading-tight">{data.interactionData.question}</h3>
                   </div>
                </div>
                
                <div className="flex-1 min-h-0 w-full max-w-2xl flex flex-col items-center relative overflow-hidden">
                  {!interactionComplete ? (
                     <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-2 w-full">
                        {data.interactionData.answers.map((ans: any) => {
                          const isSelected = selectedAnswerId === ans.id;
                          const isError = isSelected && !ans.correct && shakeId === ans.id;
                          return (
                            <button key={ans.id} onClick={() => handleMultipleChoice(ans)}
                              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex justify-between items-center text-start shadow-sm shrink-0 min-h-[44px] leading-tight backdrop-blur-sm w-full
                                ${isSelected && ans.correct ? 'bg-green-500 text-white' : isError ? 'bg-red-500 text-white animate-shake' : 'bg-white/90 text-gray-800 hover:bg-white hover:scale-[1.01]'}
                              `}
                            >
                              <span className="flex-1">{ans.text}</span>
                              <span className="text-base flex-shrink-0 ml-2">{isSelected && ans.correct && '✓'}{isError && '✕'}</span>
                            </button>
                          );
                        })}
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center animate-pop-in p-2">
                        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl text-center w-fit max-w-xs border border-white/50">
                           <div className="text-3xl mb-1 animate-bounce">✅</div>
                           <h3 className="text-sm font-black text-blue-900 mb-2">{t('correct', language)}</h3>
                           <Button fullWidth className="py-2 text-xs shadow-xl bg-blue-600 text-white rounded-xl" onClick={() => changePhase('DECISION')}>{t('next', language)}</Button>
                        </div>
                     </div>
                  )}
                </div>
             </div>
           );
        }

        // 3. SHIELD (Node 2)
        if (data.interactionType === InteractionType.DRAG_SHIELD) {
            return (
                <div className="h-full w-full flex flex-col items-center relative animate-zoom-in">
                    <div className="flex-shrink-0 mb-2 mt-2">
                        {!interactionComplete && <h3 className="text-center bg-black/40 text-white backdrop-blur-md rounded-full py-1 px-4 self-center text-xs font-bold border border-white/10 w-fit">{t('shieldInst', language)}</h3>}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 overflow-y-auto min-h-0 p-2 w-full max-w-4xl items-center content-center">
                        {interactionItems.map((item) => (
                            <button 
                                key={item.id} 
                                onClick={() => handleShieldClick(item)}
                                disabled={item.protected}
                                className={`relative rounded-xl flex flex-col items-center text-center shadow-lg transition-all w-full overflow-hidden group max-w-[180px] mx-auto h-full max-h-[160px]
                                    ${item.protected ? 'bg-green-100/90 border-2 border-green-500' : shakeId === item.id ? 'bg-red-50/90 border-2 border-red-300 animate-shake' : 'bg-white/95 backdrop-blur-sm hover:scale-[1.02]'}
                                `}
                            >
                                <div className="w-full flex-1 bg-white relative p-1 min-h-[60px]">
                                    {item.image ? (
                                        <img src={item.image} className="w-full h-full object-contain" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                                    )}
                                    {item.protected && <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 z-20"><span className="text-3xl animate-bounce">🛡️</span></div>}
                                </div>

                                <div className="p-1.5 w-full flex-shrink-0 flex items-center justify-center min-h-[30px] bg-slate-50 border-t border-slate-100">
                                     <span className="text-[10px] font-bold text-gray-900 leading-tight">{item.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    {interactionComplete && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-20 animate-pop-in">
                            <div className="bg-white/95 p-3 rounded-2xl text-center shadow-2xl w-fit max-w-xs border border-white/50">
                                <div className="text-3xl mb-1">🛡️</div>
                                <h3 className="font-black text-blue-900 text-sm mb-2">{t('correct', language)}</h3>
                                {isTrivialDecision && trivialOption ? (
                                    <div className="bg-blue-50 p-2 rounded-lg mb-2 text-xs text-gray-800 text-right leading-normal border border-blue-100">
                                        {trivialOption.feedback}
                                    </div>
                                ) : null}
                                <Button fullWidth onClick={() => isTrivialDecision ? onComplete() : changePhase('DECISION')} className="shadow-lg py-1.5 text-xs">
                                    {isTrivialDecision ? t('finishLevel', language) : t('next', language)}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // 4. BALLOONS (Node 4)
        if (data.interactionType === InteractionType.BALLOONS) {
            return (
                <div className="h-full w-full flex flex-col relative overflow-hidden rounded-xl animate-zoom-in">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-300 via-blue-200 to-white opacity-60 -z-10"></div>
                    
                    <div className="flex-shrink-0 mt-2 mb-2 text-center">
                        {!interactionComplete && <h3 className="inline-block bg-black/40 text-white backdrop-blur-md rounded-full py-1 px-4 text-xs font-bold z-10 shadow-md border border-white/10">{t('balloonsInst', language)}</h3>}
                    </div>
                    
                    <div className="flex-1 relative w-full h-full min-h-0">
                        {interactionItems.map((item, index) => {
                             if (item.popped) return null;
                             const leftPos = (index * 22) + 5; 
                             const topPos = 10 + (index % 2) * 15; 
                             const delay = index * 0.5;
                             return (
                                 <button
                                    key={item.id}
                                    onClick={() => handleBalloonClick(item)}
                                    className={`absolute w-24 h-28 sm:w-32 sm:h-36 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-transform active:scale-95 balloon-float
                                        ${shakeId === item.id ? 'animate-shake' : ''}
                                    `}
                                    style={{ 
                                        left: `${leftPos}%`, 
                                        top: `${topPos}%`,
                                        animationDelay: `${delay}s`
                                    }}
                                 >
                                     <div className={`absolute inset-0 balloon-shape ${index % 2 === 0 ? 'bg-red-500' : index % 3 === 0 ? 'bg-blue-500' : 'bg-yellow-400'} overflow-hidden`}>
                                     </div>
                                     <span className="relative z-10 text-[10px] sm:text-xs font-bold text-white leading-tight drop-shadow-md px-1 bg-black/20 rounded backdrop-blur-[1px]">{item.text}</span>
                                     <div className="absolute top-full left-1/2 w-[1px] h-12 bg-white/50 origin-top animate-[stringWave_3s_ease-in-out_infinite]"></div>
                                 </button>
                             );
                        })}
                    </div>
                    {interactionComplete && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-20 animate-pop-in">
                            <div className="bg-white/95 p-3 rounded-2xl text-center shadow-2xl w-fit max-w-xs border border-white/50">
                                <div className="text-3xl mb-1">🎈</div>
                                <h3 className="font-black text-blue-900 text-sm mb-2">{t('correct', language)}</h3>
                                {isTrivialDecision && trivialOption ? (
                                    <div className="bg-blue-50 p-2 rounded-lg mb-2 text-xs text-gray-800 text-right leading-normal border border-blue-100">
                                        {trivialOption.feedback}
                                    </div>
                                ) : null}
                                <Button fullWidth onClick={() => isTrivialDecision ? onComplete() : changePhase('DECISION')} className="shadow-lg py-1.5 text-xs">
                                    {isTrivialDecision ? t('finishLevel', language) : t('next', language)}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // 5. CODE CRACKER (Node 8)
        if (data.interactionType === InteractionType.CODE_CRACKER) {
            const currentQ = data.interactionData?.questions?.[codeStep];
            
            if (interactionComplete) {
                return (
                    <div className="h-full w-full flex flex-col items-center justify-center relative animate-zoom-in overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(40)].map((_, i) => (
                                <div key={i} className="absolute animate-confetti" style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `-10%`,
                                    backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)],
                                    width: '10px',
                                    height: '10px',
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}></div>
                            ))}
                        </div>

                        <div className="bg-white/95 p-4 rounded-2xl shadow-2xl text-center backdrop-blur-xl border border-white/50 w-fit max-w-2xl flex flex-col items-center z-10 max-h-full my-auto">
                             <div className="text-4xl mb-2 animate-bounce">🏆</div>
                             <h2 className="text-xl font-black text-blue-900 mb-2">{t('codeCracked', language)}</h2>
                             <div className="bg-green-100 text-green-800 font-mono text-2xl px-4 py-1 rounded-lg mb-4 tracking-[0.5em] border border-green-200 shadow-inner">3242</div>
                             
                             <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 mb-4 px-2 w-full">
                                <p className="text-xs sm:text-sm leading-relaxed text-gray-800 font-medium whitespace-pre-wrap text-center">
                                    {data.moreInfoContent}
                                </p>
                             </div>

                             <Button onClick={onComplete} fullWidth className="mt-auto shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-xl animate-pulse flex-shrink-0">
                                {t('finishGame', language)}
                             </Button>
                        </div>
                    </div>
                );
            }

            return (
                <div className={`h-full w-full flex flex-col relative ${animClass} items-center`}>
                    <div className="w-fit flex justify-between items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md mb-2 mt-2 border border-white/10 shrink-0">
                        <span className="text-white font-mono font-bold text-sm">{t('codeLabel', language)}:</span>
                        <div className="flex gap-1.5">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-6 h-8 sm:w-8 sm:h-10 bg-slate-800 rounded flex items-center justify-center text-white font-mono text-lg border-2 ${i < collectedCode.length ? 'border-green-400 text-green-400' : 'border-slate-600'}`}>
                                    {i < collectedCode.length ? collectedCode[i] : '*'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {currentQ && (
                        <div className="flex-1 w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl flex flex-col overflow-hidden relative border border-white/40 mb-4 mx-4 min-h-0">
                             <div className="bg-blue-600 px-2 py-1 text-white text-center font-bold text-xs shrink-0">{t('question', language)} {codeStep + 1} / 4</div>
                             
                             <div className="p-2 sm:p-3 text-center border-b bg-white/50 shrink-0">
                                 <h3 className="font-bold text-blue-900 text-sm sm:text-base leading-tight">{currentQ.question}</h3>
                             </div>
                             
                             {showCodeFeedback ? (
                                 <div className="flex-1 flex flex-col animate-fade-in overflow-hidden relative min-h-0">
                                     <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col items-center justify-center text-center custom-scrollbar">
                                         <div className="text-2xl mb-1 flex-shrink-0">💡</div>
                                         <p className="text-xs sm:text-sm font-bold mb-2 leading-relaxed text-gray-800">{codeFeedbackText}</p>
                                         <div className="text-3xl font-mono font-black text-blue-600 tracking-widest bg-blue-50 px-4 py-1 rounded-lg border border-blue-200 flex-shrink-0">
                                             {pendingDigit}
                                         </div>
                                     </div>
                                     <div className="p-2 border-t bg-gray-50 flex-shrink-0 z-10 w-full">
                                         <Button onClick={confirmCodeDigit} fullWidth className="animate-bounce shadow-xl py-2 text-sm">{t('next', language)}</Button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 overflow-y-auto custom-scrollbar content-center">
                                     {currentQ.options.map((opt: any, idx: number) => (
                                         <button 
                                            key={idx}
                                            onClick={() => handleCodeAnswerSelection(opt.value, currentQ.explanation)}
                                            className={`p-2 sm:p-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all border-2 border-transparent flex items-center justify-center text-center h-full min-h-[44px]
                                                ${errorShake ? 'animate-shake bg-red-100' : 'bg-slate-50 hover:bg-blue-50 hover:border-blue-200'}
                                            `}
                                         >
                                             {opt.text}
                                         </button>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            );
        }
        
        // Fallback
        return <div className="flex items-center justify-center h-full"><Button onClick={() => changePhase('DECISION')}>{t('next', language)}</Button></div>;

      case 'DECISION':
      case 'DECISION_PHASE_2':
        const isPhase2 = phase === 'DECISION_PHASE_2';
        const questionText = isPhase2 ? data.secondaryDecisionQuestion : data.decisionQuestion;
        const optionsList = isPhase2 ? data.secondaryOptions : data.options;
        const moreInfoTitle = isPhase2 ? data.secondaryMoreInfoTitle : data.moreInfoTitle;
        const moreInfoContent = isPhase2 ? data.secondaryMoreInfoContent : data.moreInfoContent;
        const selectedOptData = optionsList?.find(o => o.id === selectedOption);

        return (
          <div className={`h-full w-full flex flex-col items-center overflow-hidden ${animClass} relative justify-center max-w-4xl mx-auto`}>
             
             {!selectedOption && (
                 <div className={`bg-white/85 backdrop-blur-xl text-blue-900 rounded-lg shadow-lg relative overflow-hidden transition-all flex-shrink-0 flex flex-col justify-center text-center border border-white/40 w-fit max-w-[95%] mx-auto p-2 mb-2 mt-2`}>
                    <p className={`relative z-10 leading-tight font-bold text-xs sm:text-base line-clamp-3`}>{questionText}</p>
                 </div>
             )}

             <div className="flex-1 min-h-0 flex flex-col items-center relative w-full overflow-hidden justify-center">
               {!selectedOption ? (
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-1 pb-2 w-full max-w-lg justify-center">
                    {optionsList?.map(opt => (
                       <button key={opt.id} disabled={!!selectedOption}
                         className="py-2 px-4 text-start rounded-xl transition-all shadow-md font-bold text-gray-800 text-sm bg-white/90 hover:bg-blue-50 hover:scale-[1.01] min-h-[44px] flex items-center group flex-shrink-0 leading-tight backdrop-blur-sm w-full border border-white/20"
                         onClick={() => { playSfx('click'); setSelectedOption(opt.id); setFeedbackText(opt.feedback); }}
                       >
                         <div className="flex items-center gap-3 w-full">
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-500"></span>
                            <span className="relative z-10 flex-1 py-1">{opt.text}</span>
                         </div>
                       </button>
                    ))}
                  </div>
               ) : (
                  <div className="flex flex-col animate-pop-in overflow-hidden w-full max-w-md mx-auto p-2 h-full justify-center">
                     <div className="bg-blue-50/90 border-r-4 border-blue-500 p-3 rounded-lg mb-2 flex-shrink-0 shadow-sm backdrop-blur-sm w-full">
                         <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">{t('yourChoice', language)}</span>
                         <p className="text-blue-900 font-bold text-sm leading-tight">{selectedOptData?.text}</p>
                     </div>
                     
                     <div className="bg-white/90 shadow-xl rounded-xl flex flex-col items-center text-center relative overflow-hidden border border-white/50 backdrop-blur-xl w-full flex-1 min-h-0">
                        <div className="p-4 flex flex-col items-center overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-lg mb-2 shadow-inner flex-shrink-0">💡</div>
                            <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed px-1 whitespace-pre-wrap">{feedbackText}</p>
                        </div>
                        
                        <div className="w-full flex flex-col gap-2 p-3 bg-slate-50/80 border-t border-gray-100 flex-shrink-0 z-10">
                           <Button variant="outline" className="w-full py-1.5 text-xs text-blue-700 font-bold border-0 bg-blue-50/50" onClick={() => { playSfx('modal_open'); setShowMoreInfo(true); }}>ℹ️ {t('moreInfo', language)}</Button>
                           <Button className="w-full py-2 text-sm shadow-lg bg-blue-600 text-white rounded-lg font-black" onClick={handleDecisionComplete}>
                             {isPhase2 || !data.secondaryDecisionQuestion ? (node.type === 'QUIZ' ? t('finishGame', language) : t('finishLevel', language)) : t('next', language)}
                           </Button>
                        </div>
                     </div>
                  </div>
               )}
             </div>

             {/* Modal for Decision Info */}
             {showMoreInfo && (
               <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                 <div className="bg-white/95 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl p-5 shadow-2xl relative border border-white/50 animate-zoom-in">
                   <button onClick={() => { playSfx('modal_open'); setShowMoreInfo(false); }} className="absolute top-3 left-3 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-sm z-10 hover:bg-gray-200 transition-colors">✕</button>
                   <h3 className="text-lg font-black text-blue-900 mb-2 border-b pb-3 pl-8 leading-tight text-right">{moreInfoTitle}</h3>
                   <div className="overflow-y-auto flex-1 mb-4 pl-1 custom-scrollbar">
                      <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-line font-medium text-right">{moreInfoContent}</p>
                   </div>
                   <Button fullWidth onClick={() => { playSfx('modal_open'); setShowMoreInfo(false); }} className="py-2.5 text-sm font-black shadow-lg rounded-xl flex-shrink-0">{t('understood', language)}</Button>
                 </div>
               </div>
             )}
          </div>
        );
    }
  };

  const isIntro = phase === 'INTRO';
  const bgBlurClass = isIntro && !showIntroCard ? 'blur-0' : (isIntro ? 'blur-sm' : 'blur-0');
  const bgOpacityClass = isIntro && !showIntroCard ? 'bg-transparent' : (isIntro ? 'bg-black/30' : 'bg-black/10');

  return (
    <div className="h-full w-full flex flex-col font-sans relative overflow-hidden bg-slate-900" onClick={handleBackgroundClick}>
       {node.data.backgroundImage && (
         <div className={`absolute inset-0 z-0 animate-fade-in transition-all duration-1000 ${activeSubScene ? 'filter blur-[0px] scale-100' : ''}`}>
            <img 
              src={node.data.backgroundImage} 
              className={`w-full h-full object-cover transition-all duration-1000 ${isIntro ? 'opacity-100 scale-105' : 'opacity-100'} ${bgBlurClass}`} 
              alt=""
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            <div className={`absolute inset-0 transition-all duration-1000 ${bgOpacityClass}`}></div>
         </div>
       )}

       {/* Top Bar - Ultra Compact */}
       <div className={`p-2 flex justify-between items-center z-20 transition-all flex-shrink-0 h-12 bg-transparent pointer-events-none ${isIntro && !showIntroCard ? 'opacity-0' : 'opacity-100'}`}>
         <div className="flex gap-2 pointer-events-auto">
             <Button variant="outline" className={`py-1 px-3 text-xs rounded-full backdrop-blur-md font-bold shadow-lg bg-white/20 border-0 text-white hover:bg-white/30`} onClick={onBack}>
                {t('backToMap', language)}
             </Button>
             
             {!isIntro && (
                <Button 
                    variant="outline" 
                    className="py-1 px-3 text-xs rounded-full backdrop-blur-md font-bold shadow-lg bg-white/20 border-0 text-white hover:bg-white/30 flex items-center gap-1"
                    onClick={handleStepBack}
                >
                    ⬅️ {t('stepBack', language)}
                </Button>
             )}

             {node.data.digitalContent && !isIntro && (
                <Button 
                    variant="secondary" 
                    className="py-1 px-3 text-xs rounded-full shadow-lg bg-yellow-400 text-blue-900 font-bold animate-pulse"
                    onClick={() => setShowDigitalContentModal(true)}
                >
                    📄 {t('moreInfo', language)}
                </Button>
             )}
         </div>
         {!isIntro && <span className="font-bold text-white text-xs drop-shadow-md bg-black/40 px-3 py-1 rounded-full truncate max-w-[150px] backdrop-blur-md pointer-events-auto border border-white/20">{node.title}</span>}
       </div>

       {/* Main Container */}
       <main className="flex-1 px-2 sm:px-4 pb-2 w-full relative z-10 flex flex-col min-h-0 overflow-hidden pointer-events-none justify-center">
         <div className="pointer-events-auto w-full h-full flex flex-col max-w-6xl mx-auto">
            {renderContent()}
         </div>
       </main>

       {/* Digital Content Modal */}
       {showDigitalContentModal && node.data.digitalContent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDigitalContentModal(false)}>
                <div className="w-full max-w-md animate-zoom-in" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                        <button 
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-800 rounded-full flex items-center justify-center font-bold shadow-lg border border-gray-200 z-50 hover:bg-gray-100"
                            onClick={() => setShowDigitalContentModal(false)}
                        >
                            ✕
                        </button>
                        {renderDigitalContent(false)}
                    </div>
                </div>
            </div>
       )}
    </div>
  );
};

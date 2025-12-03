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

export const SceneEngine: React.FC<Props> = ({ node, onComplete, onBack, language }) => {
  const [phase, setPhase] = useState<Phase>('INTRO');
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

  // Timer logic for Intro Phase
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (phase === 'INTRO') {
      setShowIntroCard(false);
      // Wait 4 seconds before showing card
      timer = setTimeout(() => {
        setShowIntroCard(true);
      }, 4000);
    } else {
      // If we move past INTRO, ensure card is visible immediately if accessed later
      setShowIntroCard(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase]);

  // Allow clicking background to skip delay
  const handleBackgroundClick = () => {
    if (phase === 'INTRO' && !showIntroCard) {
      setShowIntroCard(true);
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
      <div className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-xl relative overflow-hidden w-full ${compact ? 'p-2' : 'p-4 sm:p-5'}`}>
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
      setPhase('DECISION_PHASE_2');
      setSelectedOption(null);
      setFeedbackText('');
      setShowMoreInfo(false);
    } else {
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
        setPhase('DECISION');
        setSelectedOption(null);
    } else if (phase === 'DECISION') {
        if (node.data.interactionType !== InteractionType.NONE) {
            setPhase('INTERACTION');
        } else if (node.data.dialog.length > 0) {
            setPhase('DIALOG');
        } else {
            setPhase('INTRO');
            setShowIntroCard(true); 
        }
    } else if (phase === 'INTERACTION') {
        if (node.data.dialog.length > 0) {
            setPhase('DIALOG');
        } else {
            setPhase('INTRO');
            setShowIntroCard(true);
        }
    } else if (phase === 'DIALOG') {
        setPhase('INTRO');
        setShowIntroCard(true);
    }
  };

  // Check if we should skip the decision phase (if it's just a "Continue" button)
  const isTrivialDecision = node.data.options.length === 1;
  const trivialOption = isTrivialDecision ? node.data.options[0] : null;

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

        return (
          <div className="flex flex-col h-full w-full justify-center items-center">
            {/* Compact Fit */}
            <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl w-fit max-w-lg flex flex-col max-h-full overflow-hidden animate-fade-in-up border border-white/40">
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
                <Button fullWidth onClick={() => setPhase(data.dialog.length > 0 ? 'DIALOG' : (data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION'))} className="py-2 text-sm font-black shadow-lg rounded-xl">
                  {t('next', language)}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'DIALOG':
        return (
          <div className="flex flex-col h-full w-full max-w-3xl mx-auto relative overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0 p-1 mask-image-linear-gradient custom-scrollbar">
              {data.dialog.map((msg) => (
                <ChatBubble key={msg.id} message={msg} avatarUrl={data.characterImages?.[msg.speaker]} />
              ))}
            </div>
            <div className="flex justify-center flex-shrink-0 pt-1 sticky bottom-0 z-30">
              <Button onClick={() => setPhase(data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION')} className="py-1.5 px-6 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold border-2 border-white/20 backdrop-blur-sm">
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
              <div className="absolute inset-0 z-50 flex flex-col animate-fade-in bg-slate-900/50 backdrop-blur-sm">
                 {/* Full bright background for sub-scene */}
                 {activeSubScene.backgroundImage && (
                    <img src={activeSubScene.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
                 )}
                 <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 shadow-lg">
                    <span className="text-lg">{activeSubScene.icon}</span>
                    <h3 className="text-xs font-bold text-blue-900">{activeSubScene.title}</h3>
                 </div>
                 <button onClick={() => setActiveSubScene(null)} className="absolute top-2 left-2 z-20 bg-black/30 text-white hover:bg-black/50 w-8 h-8 rounded-full flex items-center justify-center font-bold border border-white/30 backdrop-blur-md">✕</button>
                 
                 <div className="relative z-10 flex flex-col p-3 w-full max-w-2xl mx-auto h-full justify-end pb-12">
                     <div className="overflow-y-auto max-h-[65vh] p-1 flex flex-col justify-end">
                        {activeSubScene.dialog.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
                     </div>
                     <div className="flex justify-center mt-2 flex-shrink-0">
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
            <div className="h-full flex flex-col items-center justify-center animate-fade-in max-w-4xl mx-auto w-full relative z-10">
               <h3 className="text-sm font-black text-white mb-2 text-center drop-shadow-lg bg-black/40 px-4 py-1.5 rounded-xl backdrop-blur-md flex-shrink-0 border border-white/10 w-fit">
                 {t('chooseLocation', language)}
               </h3>
               {/* Shrink grid to content (w-fit) */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-fit max-w-full overflow-y-auto flex-1 min-h-0 custom-scrollbar p-1">
                 {data.subScenes.map(scene => {
                   const isVisited = visitedSubScenes.has(scene.id);
                   return (
                     <button key={scene.id} onClick={() => { playSfx('click'); setActiveSubScene(scene); }}
                       className={`relative overflow-hidden p-2 rounded-xl transition-all flex items-center gap-3 shadow-md group text-right min-h-[50px] border border-white/30 ${isVisited ? 'bg-black/50 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm hover:bg-white/90'}`}
                     >
                       {scene.backgroundImage && <div className="absolute inset-0 opacity-40 z-0"><img src={scene.backgroundImage} className="w-full h-full object-cover" alt="" /></div>}
                       <div className="relative z-10 text-xl drop-shadow-sm">{scene.icon}</div>
                       <div className="relative z-10 flex-1">
                         <div className={`font-black text-xs sm:text-sm ${isVisited ? 'text-white' : 'text-gray-900'}`}>{scene.title}</div>
                         <div className={`text-[10px] font-bold ${isVisited ? 'text-green-300' : 'text-blue-600'}`}>{isVisited ? t('visited', language) : t('clickToListen', language)}</div>
                       </div>
                     </button>
                   );
                 })}
               </div>
               <div className="mt-2 w-full flex justify-center flex-shrink-0">
                 <Button onClick={() => setPhase('DECISION')} disabled={!canProceed} className={`py-1.5 px-6 rounded-full text-xs font-bold shadow-lg border border-white/20 backdrop-blur-sm ${canProceed ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-500/50 cursor-not-allowed'}`}>
                   {canProceed ? t('proceedToDecision', language) : `${t('visitMore', language)} ${3 - visitedSubScenes.size}`}
                 </Button>
               </div>
            </div>
          );
        }

        // 2. MULTIPLE CHOICE
        if (data.interactionType === InteractionType.MULTIPLE_CHOICE && data.interactionData?.question) {
           return (
             <div className="h-full w-full flex flex-col items-center overflow-hidden animate-fade-in relative">
                <div className="flex-shrink-0 mb-1 z-10 max-w-[98%]">
                   {/* w-fit for question */}
                   <div className="bg-white/85 backdrop-blur-xl text-blue-900 rounded-lg shadow-lg p-3 text-center border border-white/40 w-fit mx-auto">
                      <h3 className="text-xs sm:text-sm font-black relative z-10 leading-tight">{data.interactionData.question}</h3>
                   </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col items-center relative w-full overflow-hidden">
                  {!interactionComplete ? (
                     // w-fit for list
                     <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-0.5 w-fit max-w-full">
                        {data.interactionData.answers.map((ans: any) => {
                          const isSelected = selectedAnswerId === ans.id;
                          const isError = isSelected && !ans.correct && shakeId === ans.id;
                          return (
                            <button key={ans.id} onClick={() => handleMultipleChoice(ans)}
                              className={`py-1.5 px-4 rounded-lg font-bold text-[10px] sm:text-sm transition-all flex justify-between items-center text-start shadow-sm shrink-0 min-h-[30px] leading-tight backdrop-blur-sm w-full
                                ${isSelected && ans.correct ? 'bg-green-500 text-white' : isError ? 'bg-red-500 text-white animate-shake' : 'bg-white/90 text-gray-800 hover:bg-white'}
                              `}
                            >
                              <span className="flex-1">{ans.text}</span>
                              <span className="text-base flex-shrink-0 ml-2">{isSelected && ans.correct && '✓'}{isError && '✕'}</span>
                            </button>
                          );
                        })}
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-2">
                        {/* Compact success card */}
                        <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl text-center w-fit max-w-xs border border-white/50">
                           <div className="text-3xl mb-1 animate-bounce">✅</div>
                           <h3 className="text-sm font-black text-blue-900 mb-2">{t('correct', language)}</h3>
                           <Button fullWidth className="py-1.5 text-xs shadow-xl bg-blue-600 text-white rounded-xl" onClick={() => setPhase('DECISION')}>{t('next', language)}</Button>
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
                <div className="h-full w-full flex flex-col items-center relative animate-fade-in">
                    {!interactionComplete && <h3 className="text-center bg-black/40 text-white backdrop-blur-md rounded-full py-1 px-4 self-center mb-2 text-xs font-bold border border-white/10 w-fit">{t('shieldInst', language)}</h3>}
                    
                    {/* Grid updated to much smaller container (max-w-xl) and smaller grid items */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 overflow-y-auto min-h-0 p-1 w-full max-w-xl items-center content-center">
                        {interactionItems.map((item) => (
                            <button 
                                key={item.id} 
                                onClick={() => handleShieldClick(item)}
                                disabled={item.protected}
                                className={`relative rounded-xl flex flex-col items-center text-center shadow-lg transition-all w-full overflow-hidden group max-w-[150px] mx-auto
                                    ${item.protected ? 'bg-green-100/90 border-2 border-green-500' : shakeId === item.id ? 'bg-red-50/90 border-2 border-red-300 animate-shake' : 'bg-white/95 backdrop-blur-sm hover:scale-[1.02]'}
                                `}
                            >
                                {/* Image on TOP - changed to object-contain and reduced height to prevent crop */}
                                <div className="w-full h-20 bg-white relative p-1">
                                    {item.image ? (
                                        <img src={item.image} className="w-full h-full object-contain" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                                    )}
                                    {item.protected && <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 z-20"><span className="text-3xl animate-bounce">🛡️</span></div>}
                                </div>

                                {/* Text Below */}
                                <div className="p-1.5 w-full flex-1 flex items-center justify-center min-h-[36px] bg-slate-50 border-t border-slate-100">
                                     <span className="text-[10px] font-bold text-gray-900 leading-tight">{item.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    {interactionComplete && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-20 animate-fade-in">
                            {/* Compact card */}
                            <div className="bg-white/95 p-3 rounded-2xl text-center shadow-2xl w-fit max-w-xs border border-white/50">
                                <div className="text-3xl mb-1">🛡️</div>
                                <h3 className="font-black text-blue-900 text-sm mb-2">{t('correct', language)}</h3>
                                {isTrivialDecision && trivialOption ? (
                                    <div className="bg-blue-50 p-2 rounded-lg mb-2 text-xs text-gray-800 text-right leading-normal border border-blue-100">
                                        {trivialOption.feedback}
                                    </div>
                                ) : null}
                                <Button fullWidth onClick={() => isTrivialDecision ? onComplete() : setPhase('DECISION')} className="shadow-lg py-1.5 text-xs">
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
                <div className="h-full w-full flex flex-col relative overflow-hidden rounded-xl">
                    {/* Fallback Sky Gradient if no image is present */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-300 via-blue-200 to-white opacity-60 -z-10"></div>
                    
                    {!interactionComplete && <h3 className="text-center bg-black/40 text-white backdrop-blur-md rounded-full py-1 px-4 self-center mb-2 text-xs font-bold z-10 shadow-md border border-white/10 w-fit">{t('balloonsInst', language)}</h3>}
                    <div className="flex-1 relative w-full h-full">
                        {interactionItems.map((item, index) => {
                             if (item.popped) return null;
                             // Stagger positioning
                             const leftPos = (index * 22) + 5; 
                             // Add vertical stagger to avoid overlapping
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
                                        {/* Image support: Removed mix-blend-multiply to fix visibility issues on dark/white images */}
                                        {item.image && <img src={item.image} className="w-full h-full object-cover relative z-0" alt="" />}
                                     </div>
                                     <span className="relative z-10 text-[10px] sm:text-xs font-bold text-white leading-tight drop-shadow-md px-1 bg-black/20 rounded backdrop-blur-[1px]">{item.text}</span>
                                     <div className="absolute top-full left-1/2 w-[1px] h-12 bg-white/50 origin-top animate-[stringWave_3s_ease-in-out_infinite]"></div>
                                 </button>
                             );
                        })}
                    </div>
                    {interactionComplete && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-20 animate-fade-in">
                            {/* Compact card */}
                            <div className="bg-white/95 p-3 rounded-2xl text-center shadow-2xl w-fit max-w-xs border border-white/50">
                                <div className="text-3xl mb-1">🎈</div>
                                <h3 className="font-black text-blue-900 text-sm mb-2">{t('correct', language)}</h3>
                                {isTrivialDecision && trivialOption ? (
                                    <div className="bg-blue-50 p-2 rounded-lg mb-2 text-xs text-gray-800 text-right leading-normal border border-blue-100">
                                        {trivialOption.feedback}
                                    </div>
                                ) : null}
                                <Button fullWidth onClick={() => isTrivialDecision ? onComplete() : setPhase('DECISION')} className="shadow-lg py-1.5 text-xs">
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
            
            // Success Screen (Code Cracked)
            if (interactionComplete) {
                return (
                    <div className="h-full w-full flex flex-col items-center justify-center relative animate-fade-in overflow-hidden">
                        {/* Confetti Effect */}
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

                        <div className="bg-white/95 p-4 rounded-2xl shadow-2xl text-center backdrop-blur-xl border border-white/50 w-fit max-w-2xl flex flex-col items-center z-10 max-h-full">
                             <div className="text-4xl mb-2 animate-bounce">🏆</div>
                             <h2 className="text-xl font-black text-blue-900 mb-2">{t('codeCracked', language)}</h2>
                             <div className="bg-green-100 text-green-800 font-mono text-2xl px-4 py-1 rounded-lg mb-4 tracking-[0.5em] border border-green-200 shadow-inner">3242</div>
                             
                             {/* The Content Text - Prevent Scroll if possible */}
                             <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 mb-4 px-2 w-full">
                                <p className="text-xs sm:text-sm leading-relaxed text-gray-800 font-medium whitespace-pre-wrap text-center">
                                    {data.moreInfoContent}
                                </p>
                             </div>

                             <Button onClick={onComplete} fullWidth className="mt-auto shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-xl animate-pulse">
                                {t('finishGame', language)}
                             </Button>
                        </div>
                    </div>
                );
            }

            // Question Screen
            return (
                <div className="h-full w-full flex flex-col relative animate-fade-in items-center">
                    {/* Header - Compact */}
                    <div className="w-fit flex justify-between items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md mb-2 border border-white/10 shrink-0">
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
                        <div className="flex-1 w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl flex flex-col overflow-hidden relative border border-white/40 mb-1">
                             <div className="bg-blue-600 px-2 py-1 text-white text-center font-bold text-xs shrink-0">{t('question', language)} {codeStep + 1} / 4</div>
                             
                             {/* Question Title */}
                             <div className="p-2 sm:p-3 text-center border-b bg-white/50 shrink-0">
                                 <h3 className="font-bold text-blue-900 text-sm sm:text-base leading-tight">{currentQ.question}</h3>
                             </div>
                             
                             {showCodeFeedback ? (
                                 <div className="flex-1 flex flex-col animate-fade-in overflow-hidden relative">
                                     {/* Feedback Content */}
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
                                            className={`p-2 sm:p-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all border-2 border-transparent flex items-center justify-center text-center h-full min-h-[50px]
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
        return <div className="flex items-center justify-center h-full"><Button onClick={() => setPhase('DECISION')}>{t('next', language)}</Button></div>;

      case 'DECISION':
      case 'DECISION_PHASE_2':
        const isPhase2 = phase === 'DECISION_PHASE_2';
        const questionText = isPhase2 ? data.secondaryDecisionQuestion : data.decisionQuestion;
        const optionsList = isPhase2 ? data.secondaryOptions : data.options;
        const moreInfoTitle = isPhase2 ? data.secondaryMoreInfoTitle : data.moreInfoTitle;
        const moreInfoContent = isPhase2 ? data.secondaryMoreInfoContent : data.moreInfoContent;
        const selectedOptData = optionsList?.find(o => o.id === selectedOption);

        return (
          <div className="h-full w-full flex flex-col items-center overflow-hidden animate-fade-in relative justify-center">
             
             {/* Hide Question Title if answered */}
             {!selectedOption && (
                 <div className={`bg-white/85 backdrop-blur-xl text-blue-900 rounded-lg shadow-lg relative overflow-hidden transition-all flex-shrink-0 flex flex-col justify-center text-center border border-white/40 w-fit max-w-[95%] mx-auto p-3 mb-1`}>
                    <p className={`relative z-10 leading-tight font-bold text-xs sm:text-base line-clamp-3`}>{questionText}</p>
                 </div>
             )}

             <div className="flex-1 min-h-0 flex flex-col items-center relative w-full overflow-hidden justify-center">
               {!selectedOption ? (
                  // w-fit for options list
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-0.5 pb-1 w-fit max-w-full justify-center">
                    {optionsList?.map(opt => (
                       <button key={opt.id} disabled={!!selectedOption}
                         className="py-1.5 px-3 text-start rounded-lg transition-all shadow-sm font-bold text-gray-800 text-[10px] sm:text-sm bg-white/85 hover:bg-blue-50/90 hover:shadow-md min-h-[30px] flex items-center group flex-shrink-0 leading-3 sm:leading-tight mb-0.5 backdrop-blur-sm w-full"
                         onClick={() => { playSfx('click'); setSelectedOption(opt.id); setFeedbackText(opt.feedback); }}
                       >
                         <div className="flex items-center gap-2 w-full">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500"></span>
                            <span className="relative z-10 flex-1 py-1">{opt.text}</span>
                         </div>
                       </button>
                    ))}
                  </div>
               ) : (
                  // COMPACT Result View - Center Screen
                  <div className="flex flex-col animate-slide-up overflow-hidden w-fit max-w-sm mx-auto">
                     {/* Your Choice - Compact */}
                     <div className="bg-blue-50/90 border-r-4 border-blue-500 p-2 rounded-lg mb-1 flex-shrink-0 shadow-sm backdrop-blur-sm w-full">
                         <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">{t('yourChoice', language)}</span>
                         <p className="text-blue-900 font-bold text-xs leading-tight">{selectedOptData?.text}</p>
                     </div>
                     
                     {/* Result Card - Compact, wrapping enabled */}
                     <div className="bg-white/90 shadow-xl rounded-xl flex flex-col items-center text-center relative overflow-hidden border border-white/50 backdrop-blur-xl w-full">
                        <div className="p-3 flex flex-col items-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs sm:text-sm mb-1 shadow-inner flex-shrink-0">💡</div>
                            <p className="text-[11px] sm:text-sm text-gray-800 font-medium leading-normal px-1 whitespace-pre-wrap">{feedbackText}</p>
                        </div>
                        
                        <div className="w-full flex flex-col gap-1 p-2 bg-slate-50/80 border-t border-gray-100 flex-shrink-0 z-10">
                           <Button variant="outline" className="w-full py-1 text-[10px] text-blue-700 font-bold border-0 bg-blue-50/50 h-7" onClick={() => { playSfx('pop'); setShowMoreInfo(true); }}>ℹ️ {t('moreInfo', language)}</Button>
                           <Button className="w-full py-1.5 text-xs shadow-lg bg-blue-600 text-white rounded-lg font-black h-8" onClick={handleDecisionComplete}>
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
                 <div className="bg-white/95 w-fit max-w-lg max-h-[80vh] flex flex-col rounded-2xl p-4 sm:p-6 shadow-2xl relative border border-white/50">
                   <button onClick={() => { playSfx('click'); setShowMoreInfo(false); }} className="absolute top-3 left-3 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-bold text-sm z-10">✕</button>
                   <h3 className="text-base sm:text-lg font-black text-blue-900 mb-2 border-b pb-2 pl-4 leading-tight text-right">{moreInfoTitle}</h3>
                   <div className="overflow-y-auto flex-1 mb-2 pl-1 custom-scrollbar">
                      <p className="text-gray-900 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium text-right">{moreInfoContent}</p>
                   </div>
                   <Button fullWidth onClick={() => { playSfx('click'); setShowMoreInfo(false); }} className="py-2 text-sm font-black shadow-lg rounded-xl">{t('understood', language)}</Button>
                 </div>
               </div>
             )}
          </div>
        );
    }
  };

  const isIntro = phase === 'INTRO';
  // Use showIntroCard to decide if we blur or not. 
  // If it's intro AND we are waiting (showIntroCard false), keep it clear (blur-0). 
  // Once card shows (showIntroCard true), blur it.
  const bgBlurClass = isIntro && !showIntroCard ? 'blur-0' : (isIntro ? 'blur-sm' : 'blur-0');
  const bgOpacityClass = isIntro && !showIntroCard ? 'bg-transparent' : (isIntro ? 'bg-black/30' : 'bg-black/10');

  return (
    <div className="absolute inset-0 h-[100dvh] bg-slate-900 flex flex-col font-sans relative overflow-hidden" onClick={handleBackgroundClick}>
       {node.data.backgroundImage && (
         <div className={`absolute inset-0 z-0 animate-fade-in transition-all duration-1000 ${activeSubScene ? 'filter blur-[0px] scale-100' : ''}`}>
            <img 
              src={node.data.backgroundImage} 
              className={`w-full h-full object-cover transition-all duration-1000 ${isIntro ? 'opacity-100 scale-105' : 'opacity-100'} ${bgBlurClass}`} 
              alt=""
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            {/* Reduced Overlay Opacity to show more background */}
            <div className={`absolute inset-0 transition-all duration-1000 ${bgOpacityClass}`}></div>
         </div>
       )}

       {/* Top Bar - Ultra Compact */}
       <div className={`p-1 sm:p-2 flex justify-between items-center sticky top-0 z-20 transition-all flex-shrink-0 h-8 sm:h-12 bg-transparent pointer-events-none ${isIntro && !showIntroCard ? 'opacity-0' : 'opacity-100'}`}>
         <div className="flex gap-2 pointer-events-auto">
             <Button variant="outline" className={`py-0.5 px-2 sm:py-1.5 sm:px-4 text-[9px] sm:text-xs rounded-full backdrop-blur-md font-bold shadow-lg bg-white/20 border-0 text-white hover:bg-white/30`} onClick={onBack}>
                {t('backToMap', language)}
             </Button>
             
             {/* Step Back Button */}
             {!isIntro && (
                <Button 
                    variant="outline" 
                    className="py-0.5 px-2 sm:py-1.5 sm:px-3 text-[9px] sm:text-xs rounded-full backdrop-blur-md font-bold shadow-lg bg-white/20 border-0 text-white hover:bg-white/30 flex items-center gap-1"
                    onClick={handleStepBack}
                >
                    ⬅️ {t('stepBack', language)}
                </Button>
             )}

             {/* Digital Content Toggle - Shows only if content exists and not in INTRO */}
             {node.data.digitalContent && !isIntro && (
                <Button 
                    variant="secondary" 
                    className="py-0.5 px-2 sm:py-1.5 sm:px-3 text-[9px] sm:text-xs rounded-full shadow-lg bg-yellow-400 text-blue-900 font-bold animate-pulse"
                    onClick={() => setShowDigitalContentModal(true)}
                >
                    📄 {t('moreInfo', language)}
                </Button>
             )}
         </div>
         {!isIntro && <span className="font-bold text-white text-[9px] sm:text-xs drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full truncate max-w-[120px] backdrop-blur-md pointer-events-auto border border-white/20">{node.title}</span>}
       </div>

       {/* Main Container */}
       <main className="flex-1 p-1 sm:p-4 max-w-4xl mx-auto w-full relative z-10 flex flex-col min-h-0 overflow-hidden justify-start pointer-events-none">
         {/* Re-enable pointer events for the actual content card */}
         <div className="pointer-events-auto w-full h-full flex flex-col">
            {renderContent()}
         </div>
       </main>

       {/* Digital Content Modal (Clean, separate from chat) */}
       {showDigitalContentModal && node.data.digitalContent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDigitalContentModal(false)}>
                <div className="w-fit max-w-md" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                        <button 
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-800 rounded-full flex items-center justify-center font-bold shadow-lg border border-gray-200 z-50"
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
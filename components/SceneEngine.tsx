
import React, { useState, useEffect } from 'react';
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
          playSfx('success');
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
    // RTL Layout Fix: Position badge on LEFT for Hebrew/Arabic to avoid overlapping start of text
    const isRTL = language === 'he' || language === 'ar';
    const badgePositionClass = isRTL ? 'left-0 rounded-br-lg' : 'right-0 rounded-bl-lg';

    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-xl shadow-inner relative overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
        <div className={`absolute top-0 ${badgePositionClass} bg-yellow-400 text-blue-900 text-[10px] sm:text-xs font-black px-3 py-1 shadow-sm z-10 uppercase tracking-wide`}>
          {badgeLabel}
        </div>
        <div className="flex items-center gap-2 mb-2 mt-2">
          <div className={`rounded-full flex items-center justify-center font-bold text-slate-500 bg-slate-200 border border-slate-300 ${compact ? 'w-6 h-6 text-xs' : 'w-10 h-10 text-lg'}`}>
            {data.digitalContent.author?.[0] || '📢'}
          </div>
          <div>
              <p className="font-bold text-slate-800 text-sm">{data.digitalContent.author || data.digitalContent.title}</p>
          </div>
        </div>
        
        {/* IMPROVED TYPOGRAPHY: Adjusted sizes to prevent overflow */}
        <div className={`text-slate-900 font-sans font-medium leading-relaxed ${compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-base'} px-1`}>
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
            {/* Mission Card UI - Responsive Fixed Layout */}
            <div 
              className="bg-white/95 backdrop-blur-md border border-gray-200 p-0 rounded-xl sm:rounded-2xl shadow-2xl w-[95%] max-w-md mx-auto flex flex-col max-h-[80dvh] opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
            >
              {/* Header - Fixed */}
              <div className="bg-blue-600 px-3 py-2 sm:px-4 sm:py-3 text-white flex justify-between items-center gap-2 flex-shrink-0 rounded-t-xl sm:rounded-t-2xl">
                <h2 className="text-sm sm:text-base font-black truncate">{node.title}</h2>
                <div className="text-[10px] bg-blue-800 px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                  {t('mission', language)}
                </div>
              </div>
              
              {/* Body - Scrollable */}
              <div className="p-3 sm:p-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                 <p className="text-xs sm:text-base leading-relaxed text-gray-800 font-medium mb-3 sm:mb-4">{data.description}</p>
                 
                 {data.digitalContent && (
                   <div className="mt-2">
                     {renderDigitalContent(false)}
                   </div>
                 )}
              </div>
              
              {/* Footer - Fixed */}
              <div className="bg-gray-50 p-2 sm:p-3 border-t border-gray-100 flex justify-center flex-shrink-0 rounded-b-xl sm:rounded-b-2xl">
                <Button fullWidth onClick={() => setPhase(data.dialog.length > 0 ? 'DIALOG' : (data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION'))} className="py-2 sm:py-2.5 text-sm font-bold shadow-md max-w-[160px]">
                  {t('next', language)}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'DIALOG':
        return (
          <div className="flex flex-col h-full justify-end pb-8 relative">
            {/* 
              Overlap Fix: Changed hidden md:block -> hidden lg:block
              This hides the floating content on landscape phones/tablets to prevent overlap.
            */}
            {data.digitalContent && (
              <div className="absolute top-14 right-4 max-w-xs animate-fade-in z-20 hidden lg:block">
                 <div className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-white/50">
                    {renderDigitalContent(true)}
                 </div>
              </div>
            )}

            <div className="flex flex-col min-h-0 justify-end w-full max-w-3xl mx-auto z-10">
              {/* Chat Container */}
              <div className="flex-shrink-1 overflow-y-auto mb-2 p-2 mask-image-linear-gradient max-h-[60dvh] sm:max-h-[50dvh]">
                {data.dialog.map((msg) => (
                  <ChatBubble 
                    key={msg.id} 
                    message={msg} 
                    avatarUrl={data.characterImages?.[msg.speaker]}
                  />
                ))}
              </div>
              <div className="flex justify-center flex-shrink-0">
                <Button onClick={() => setPhase(data.interactionType !== InteractionType.NONE ? 'INTERACTION' : 'DECISION')} className="py-2 px-8 rounded-full shadow-lg bg-blue-600/90 hover:bg-blue-600 backdrop-blur-sm">
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
                 {/* Specific Background Image for Sub-Scene */}
                 {activeSubScene.backgroundImage && (
                    <img 
                      src={activeSubScene.backgroundImage} 
                      className="absolute inset-0 w-full h-full object-cover z-0 scale-100"
                      alt=""
                    />
                 )}
                 {/* Stronger overlay for better text readability */}
                 <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

                 {/* Minimal Floating Header */}
                 <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg animate-slide-up">
                    <span className="text-xl filter drop-shadow-md">{activeSubScene.icon}</span>
                    <h3 className="text-sm font-bold text-white drop-shadow-md">{activeSubScene.title}</h3>
                 </div>

                 {/* Close Button - More Visible */}
                 <button 
                   onClick={() => setActiveSubScene(null)} 
                   className="absolute top-4 left-4 z-20 bg-red-600 hover:bg-red-700 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all border-2 border-white/50 shadow-lg"
                 >
                   ✕
                 </button>
                     
                 {/* Dialog Area */}
                 <div className="relative z-10 mt-auto flex flex-col p-4 w-full max-w-2xl mx-auto mb-16">
                     <div className="overflow-y-auto max-h-[50dvh] p-2 scrollbar-hide flex flex-col justify-end">
                        {activeSubScene.dialog.map((msg) => (
                          <ChatBubble key={msg.id} message={msg} />
                        ))}
                     </div>
                 </div>
                 
                 {/* Floating Action Button */}
                 <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                    <Button onClick={() => {
                       playSfx('click');
                       setVisitedSubScenes(prev => new Set(prev).add(activeSubScene.id));
                       setActiveSubScene(null);
                     }} className="py-2 px-8 rounded-full text-sm font-bold shadow-2xl shadow-blue-900/50 bg-blue-600 hover:bg-blue-500 text-white border border-white/20">
                       {t('finishedListening', language)}
                     </Button>
                 </div>
              </div>
            );
          }

          const canProceed = visitedSubScenes.size >= 3; 
          
          return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in max-w-4xl mx-auto w-full relative z-10">
               <h3 className="text-sm sm:text-lg font-bold text-white mb-4 text-center drop-shadow-lg bg-black/60 px-6 py-2 rounded-full backdrop-blur-md border border-white/20">
                 {t('chooseLocation', language)}
               </h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl overflow-y-auto max-h-[60dvh] p-2">
                 {data.subScenes.map(scene => {
                   const isVisited = visitedSubScenes.has(scene.id);
                   return (
                     <button
                       key={scene.id}
                       onClick={() => {
                         playSfx('click');
                         setActiveSubScene(scene);
                       }}
                       className={`relative overflow-hidden p-3 rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg group text-right min-h-[60px]
                         ${isVisited ? 'bg-black/70 border border-green-400/50 backdrop-blur-sm' : 'bg-white/90 border-2 border-white hover:scale-105'}
                       `}
                     >
                       {scene.backgroundImage && (
                          <div className="absolute inset-0 opacity-40 z-0">
                             <img src={scene.backgroundImage} className="w-full h-full object-cover" alt="" />
                          </div>
                       )}
                       <div className="relative z-10 text-2xl group-hover:scale-110 transition-transform filter drop-shadow-sm">{scene.icon}</div>
                       <div className="relative z-10 flex-1">
                         <div className={`font-bold text-sm ${isVisited ? 'text-white' : 'text-gray-900'}`}>{scene.title}</div>
                         <div className={`text-[10px] font-bold ${isVisited ? 'text-green-300' : 'text-blue-600'}`}>
                           {isVisited ? t('visited', language) : t('clickToListen', language)}
                         </div>
                       </div>
                     </button>
                   );
                 })}
               </div>

               <div className="mt-4 sm:mt-8 w-full flex justify-center">
                 <Button 
                   onClick={() => setPhase('DECISION')} 
                   disabled={!canProceed}
                   className={`py-2 px-8 rounded-full text-sm font-bold shadow-xl transition-all border border-white/20 ${canProceed ? 'animate-bounce bg-blue-600 hover:bg-blue-500' : 'bg-gray-500/50 cursor-not-allowed text-gray-300'}`}
                 >
                   {canProceed ? t('proceedToDecision', language) : `${t('visitMore', language)} ${3 - visitedSubScenes.size} ${t('locations', language)}`}
                 </Button>
               </div>
            </div>
          );
        }

        // MULTIPLE CHOICE - STRICT FLEXBOX SANDWICH
        if (data.interactionType === InteractionType.MULTIPLE_CHOICE && data.interactionData?.question) {
           return (
             <div className="h-full w-full flex flex-col overflow-hidden animate-fade-in relative">
                {/* 1. HEADER (Shrink 0) */}
                <div className="flex-shrink-0 mb-1 z-10">
                   <div className="bg-indigo-900 text-white rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-center p-2 text-center">
                      <h3 className="text-xs sm:text-sm font-black relative z-10 drop-shadow-md leading-tight">{data.interactionData.question}</h3>
                   </div>
                </div>

                {/* 2. CONTENT (Flex 1) */}
                <div className="flex-1 min-h-0 flex flex-col relative w-full">
                  {!interactionComplete ? (
                     <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 p-1 pb-2">
                        {data.interactionData.answers.map((ans: any) => {
                          const isSelected = selectedAnswerId === ans.id;
                          const isError = isSelected && !ans.correct && shakeId === ans.id;
                          return (
                            <button
                              key={ans.id}
                              onClick={() => handleMultipleChoice(ans)}
                              className={`
                                p-2 rounded-xl border font-bold text-xs sm:text-sm transition-all duration-200 flex justify-between items-center text-start shadow-sm shrink-0 min-h-[40px]
                                ${isSelected && ans.correct 
                                   ? 'bg-green-500 border-green-600 text-white' 
                                   : isError 
                                     ? 'bg-red-500 border-red-600 text-white animate-shake' 
                                     : 'bg-white/95 border-gray-100 hover:border-blue-300 hover:bg-blue-50 text-gray-800'
                                }
                              `}
                            >
                              <span className="flex-1 leading-tight">{ans.text}</span>
                              <span className="text-base flex-shrink-0 ml-2">
                                {isSelected && ans.correct && '✓'}
                                {isError && '✕'}
                              </span>
                            </button>
                          );
                        })}
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-1 overflow-y-auto">
                        <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl text-center w-full max-w-xs border-4 border-green-100 flex flex-col items-center flex-shrink-0">
                           <div className="text-3xl mb-1 animate-bounce">✅</div>
                           <h3 className="text-lg font-black text-blue-900 mb-0.5">{t('correct', language)}</h3>
                           <p className="text-gray-500 font-bold mb-3 text-xs">{t('correctAnswer', language)}</p>
                           <Button fullWidth className="py-2 text-sm shadow-lg bg-blue-600 text-white mt-auto flex-shrink-0" onClick={() => setPhase('DECISION')}>{t('next', language)}</Button>
                        </div>
                     </div>
                  )}
                </div>
             </div>
           );
        }

        // BALLOONS - STRICT FLEXBOX SANDWICH (HORIZONTAL ROW)
        if (data.interactionType === InteractionType.BALLOONS) {
          const colors = [
             { bg: 'radial-gradient(circle at 30% 30%, #ef4444, #991b1b)', shadow: 'shadow-red-900/40' },
             { bg: 'radial-gradient(circle at 30% 30%, #eab308, #854d0e)', shadow: 'shadow-yellow-900/40' },
             { bg: 'radial-gradient(circle at 30% 30%, #3b82f6, #1e3a8a)', shadow: 'shadow-blue-900/40' },
             { bg: 'radial-gradient(circle at 30% 30%, #8b5cf6, #5b21b6)', shadow: 'shadow-purple-900/40' },
          ];

          return (
            <div className="h-full flex flex-col relative overflow-hidden animate-fade-in w-full max-w-4xl mx-auto rounded-2xl border-4 border-white/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-white z-0"></div>
              
              {/* 1. Header (Shrink 0) */}
              {!interactionComplete && (
                  <div className="text-center z-10 pt-2 px-2 flex-shrink-0">
                    <div className="inline-block bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-xl border-2 border-blue-100">
                      <h3 className="font-black text-[10px] sm:text-xs text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        {t('balloonsInst', language)}
                      </h3>
                    </div>
                  </div>
              )}

              {/* 2. Content (Flex 1) - Horizontal Row */}
              <div className="flex-1 relative z-10 overflow-hidden min-h-0 w-full flex flex-col">
                {!interactionComplete ? (
                    <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-1 sm:gap-4 h-full w-full px-2 pb-4 pt-10">
                      {interactionItems.map((item, index) => {
                        const theme = colors[index % colors.length];
                        const isPopped = item.popped;
                        const isShaking = shakeId === item.id;
                        const floatDuration = 4 + (index * 0.7); 
                        const floatDelay = index * 1.2;
                        // Stagger effect: alternate offset for natural look in a single row
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
                              className={`balloon-shape w-16 h-20 sm:w-24 sm:h-28 flex items-center justify-center p-1 text-center cursor-pointer group border-none outline-none ring-0 ${theme.shadow}`}
                              style={{ background: theme.bg }}
                            >
                              <p className="relative z-10 font-bold text-white text-[8px] sm:text-xs leading-tight drop-shadow-md select-none group-hover:scale-105 transition-transform line-clamp-4 px-1">
                                {item.text}
                              </p>
                            </button>
                            <div className="w-[1px] bg-white/60 origin-top animate-[stringWave_3s_ease-in-out_infinite]" style={{ height: '30px', animationDelay: `-${floatDelay}s` }}></div>
                          </div>
                        );
                      })}
                    </div>
                ) : (
                  // Success State
                  <div className="h-full flex items-center justify-center animate-fade-in bg-black/10 backdrop-blur-sm p-4">
                    <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl text-center border-4 border-white max-w-xs w-full">
                      <div className="text-4xl mb-2 animate-bounce">✨</div>
                      <h3 className="text-xl font-black text-blue-900 mb-2">{t('correct', language)}</h3>
                      <Button className="px-6 py-2 w-full shadow-lg text-sm" onClick={() => setPhase('DECISION')}>{t('next', language)}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // DRAG SHIELD - STRICT FLEXBOX SANDWICH
        if (data.interactionType === InteractionType.DRAG_SHIELD) {
           return (
             <div className="h-full w-full flex flex-col overflow-hidden animate-fade-in relative">
                {/* 1. Header Area (Shrink 0) */}
                <div className="flex-shrink-0 text-center mb-2 z-10 pt-1 px-2">
                   <div className="bg-indigo-900 text-white rounded-2xl shadow-xl inline-flex flex-col items-center px-4 py-2 relative overflow-hidden max-w-full">
                       <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 relative z-10 whitespace-nowrap">
                          <span className="text-base">🛡️</span> 
                          {t('shieldInst', language)}
                       </h3>
                   </div>
                </div>

                {/* 2. Content Grid (Flex 1) */}
                <div className="flex-1 overflow-y-auto min-h-0 relative z-10 custom-scrollbar px-1 pb-2">
                   <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {interactionItems.map((item) => {
                        const isShaking = shakeId === item.id;
                        const isProtected = item.protected;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleShieldClick(item)}
                            disabled={isProtected}
                            className={`
                               relative group p-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-center text-center gap-1.5 min-h-[90px]
                               shadow-lg border backdrop-blur-sm shrink-0
                               ${isProtected ? 'bg-blue-50/90 border-blue-400 shadow-blue-200 cursor-default scale-95' : isShaking ? 'bg-red-50 border-red-400 animate-shake' : 'bg-white/95 border-white hover:-translate-y-1 hover:shadow-xl hover:border-blue-200'}
                            `}
                          >
                            <div className="text-xl sm:text-3xl filter drop-shadow-sm transition-transform group-hover:scale-110">
                                {item.text.includes('טלפון') ? '📱' : item.text.includes('שוטר') ? '👮' : item.text.includes('אלימות') ? '👊' : '🚶'}
                            </div>
                            <p className={`text-[9px] sm:text-xs font-bold leading-tight ${isProtected ? 'text-blue-800' : 'text-gray-700'}`}>{item.text}</p>
                            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isProtected ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                               <div className="bg-white/80 rounded-full p-2 shadow-xl backdrop-blur-sm"><div className="text-2xl drop-shadow-lg animate-bounce">🛡️</div></div>
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
                       className="animate-slide-up max-w-xs py-2 text-sm font-bold shadow-xl shadow-green-900/30 bg-green-600 hover:bg-green-700 border-2 border-green-400"
                    >
                      {t('next', language)}
                    </Button>
                  )}
                </div>
             </div>
           );
        }

        // CODE CRACKER - FIXED LAYOUT
        if (data.interactionType === InteractionType.CODE_CRACKER && data.interactionData?.questions) {
          const questions = data.interactionData.questions;
          const currentQ = questions[codeStep];
          
          if (interactionComplete) {
             return (
               <div className="text-center animate-fade-in bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl h-full flex flex-col items-center overflow-y-auto border border-white/40">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-4xl shadow-inner mb-3 flex-shrink-0 border-4 border-white">🔓</div>
                 
                 <h2 className="text-2xl font-black text-blue-900 mb-2">{node.data.moreInfoTitle || t('codeCracked', language)}</h2>
                 
                 {/* The Code Display */}
                 <div className="flex justify-center gap-3 mb-4">
                   {collectedCode.map((digit, idx) => (
                     <div key={idx} className="w-12 h-16 bg-gray-900 text-green-400 flex items-center justify-center text-3xl font-mono rounded-lg border-b-4 border-green-600 shadow-xl">{digit}</div>
                   ))}
                 </div>

                 {/* The Narrative Text (Finale) */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar w-full mb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-right rtl:text-right ltr:text-left">
                    <p className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-line">
                      {node.data.moreInfoContent}
                    </p>
                 </div>

                 <Button fullWidth onClick={onComplete} className="flex-shrink-0 py-3 text-base shadow-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl transform transition hover:scale-105">{t('finishGame', language)}</Button>
               </div>
             );
          }
          return (
            <div className={`h-full w-full flex flex-col overflow-hidden animate-fade-in relative ${errorShake ? 'animate-shake' : ''}`}>
              {/* Error Overlay */}
              {errorShake && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-500/20 backdrop-blur-sm animate-pulse rounded-2xl pointer-events-none">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-xl border-4 border-white transform rotate-3">
                       {t('tryAgain', language)} ⛔
                    </div>
                 </div>
              )}

              {/* Success/Feedback Overlay */}
              {showCodeFeedback && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm flex flex-col rounded-2xl p-4 shadow-2xl border border-white/40 animate-slide-up">
                       <h3 className="text-lg font-black text-green-600 mb-2 border-b pb-2 flex items-center gap-2">
                         <span>✅</span> {t('correct', language)}
                       </h3>
                       <div className="overflow-y-auto flex-1 mb-4 custom-scrollbar">
                          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line font-medium">
                            {codeFeedbackText}
                          </p>
                       </div>
                       <Button fullWidth onClick={confirmCodeDigit} className="py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg">
                          {t('next', language)}
                       </Button>
                    </div>
                 </div>
              )}

              {/* 1. Terminal - Fixed */}
              <div className="bg-gray-800 text-green-400 p-2 rounded-xl font-mono text-center shadow-lg border-b-4 border-gray-900 transform rotate-1 flex-shrink-0 mb-2">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">{t('codeLabel', language)}</p>
                <div className="text-lg tracking-[0.5em] flex justify-center h-6 items-center">
                   {collectedCode.map(c => c).join('')}
                   {[...Array(4 - collectedCode.length)].map((_, i) => <span key={i} className="animate-pulse">_</span>)}
                </div>
              </div>
              
              {/* 2. Header - Fixed */}
              <div className="bg-indigo-900 text-white rounded-2xl shadow-xl relative overflow-hidden flex-shrink-0 flex flex-col justify-center p-2 mb-2 text-center">
                <div className="absolute top-1 right-2 opacity-50 text-[8px] uppercase font-bold tracking-wider">{t('question', language)} {codeStep + 1} / {questions.length}</div>
                <h3 className="text-xs sm:text-sm font-bold relative z-10 leading-snug">{currentQ.question}</h3>
              </div>

              {/* 3. Grid - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                <div className="flex flex-col gap-2">
                  {currentQ.options.map((opt: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => handleCodeAnswerSelection(opt.value, currentQ.explanation)}
                      className="py-3 px-4 bg-white/95 border-2 border-blue-50 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg transition-all font-bold text-xs sm:text-sm active:scale-95 text-blue-900 shadow-sm flex items-center gap-3 text-start min-h-[50px]"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shadow-inner border border-blue-200 group-hover:bg-white group-hover:text-blue-600">{idx + 1}</span>
                      <span className="flex-1">{opt.text}</span>
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
             <div className={`bg-indigo-900 text-white rounded-2xl shadow-xl relative overflow-hidden transition-all duration-500 flex-shrink-0 flex flex-col justify-center text-center
                ${selectedOption ? 'p-2 mb-1' : 'p-2 mb-2'}
             `}>
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                {!selectedOption && <h2 className="text-lg font-black mb-0.5 relative z-10 drop-shadow-md">⁉️</h2>}
                <p className={`relative z-10 leading-snug font-medium text-blue-50 ${selectedOption ? 'text-[10px] sm:text-xs line-clamp-1' : 'text-xs sm:text-sm'}`}>
                   {data.decisionQuestion}
                </p>
             </div>

             {/* 2. Content Area (Flex 1, Scrollable) */}
             <div className="flex-1 min-h-0 flex flex-col relative w-full">
               {!selectedOption ? (
                  // OPTIONS LIST
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 p-1 pb-2">
                    {data.options.map(opt => (
                       <button
                         key={opt.id}
                         disabled={!!selectedOption}
                         className={`
                           p-2 text-start rounded-xl border transition-all shadow-md font-bold text-gray-700 text-xs relative overflow-hidden flex-shrink-0 bg-white/95 border-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg min-h-[40px]
                         `}
                         onClick={() => {
                           playSfx('click');
                           setSelectedOption(opt.id);
                           setFeedbackText(opt.feedback);
                         }}
                       >
                         <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-3 h-3 rounded-full border-2 border-gray-300 flex items-center justify-center"></span>
                            <span className="relative z-10 flex-1 leading-tight">{opt.text}</span>
                         </div>
                       </button>
                    ))}
                  </div>
               ) : (
                  // FEEDBACK CARD (Swapped in)
                  <div className="flex-1 flex flex-col animate-slide-up overflow-hidden pb-1 min-h-0">
                     <div className="bg-blue-50 border-l-4 border-blue-500 p-1.5 rounded-r-xl mb-1 flex-shrink-0 shadow-sm">
                         <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">{t('yourChoice', language)}</span>
                         <p className="text-blue-900 font-bold text-xs leading-tight line-clamp-1">{selectedOptData?.text}</p>
                     </div>

                     <div className="flex-1 bg-white border border-gray-100 shadow-xl rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden min-h-0">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-sm mb-1 shadow-inner flex-shrink-0">💡</div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar w-full mb-2 min-h-0">
                           <p className="text-xs text-gray-800 font-medium leading-relaxed px-1">
                               {feedbackText}
                           </p>
                        </div>
                        
                        <div className="w-full flex flex-col gap-1.5 mt-auto flex-shrink-0">
                           <Button variant="outline" className="w-full py-1.5 text-[10px] border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => { playSfx('pop'); setShowMoreInfo(true); }}>
                             ℹ️ {t('moreInfo', language)}
                           </Button>
                           <Button className="w-full py-2 text-xs shadow-lg bg-blue-600 text-white" onClick={onComplete}>
                             {node.type === 'QUIZ' ? t('finishGame', language) : t('finishLevel', language)}
                           </Button>
                        </div>
                     </div>
                  </div>
               )}
             </div>

             {/* More Info Modal */}
             {showMoreInfo && (
               <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                 <div className="bg-white w-full max-w-sm max-h-[85dvh] flex flex-col rounded-2xl p-4 shadow-2xl relative">
                   <button 
                     onClick={() => { playSfx('click'); setShowMoreInfo(false); }}
                     className="absolute top-2 left-2 w-6 h-6 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-xs"
                   >✕</button>
                   <h3 className="text-sm font-black text-blue-900 mb-2 border-b pb-1 pr-6">{data.moreInfoTitle}</h3>
                   <div className="overflow-y-auto flex-1 mb-3 pr-2 custom-scrollbar">
                      <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-line">{data.moreInfoContent}</p>
                   </div>
                   <Button fullWidth onClick={() => { playSfx('click'); setShowMoreInfo(false); }} className="py-2 text-xs">{t('understood', language)}</Button>
                 </div>
               </div>
             )}
          </div>
        );
    }
  };

  const isIntro = phase === 'INTRO';

  return (
    <div className="absolute inset-0 h-[100dvh] bg-slate-900 flex flex-col font-sans relative overflow-hidden">
       {/* Background Image Layer */}
       {node.data.backgroundImage && (
         <div className={`absolute inset-0 z-0 animate-fade-in transition-all duration-1000 ${activeSubScene ? 'filter blur-[0px] scale-100' : ''}`}>
            <img 
              src={node.data.backgroundImage} 
              className={`w-full h-full object-cover transition-all duration-1000 ${
                isIntro ? 'opacity-100 blur-0' : 'opacity-100 blur-0'
              }`} 
              alt=""
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            {/* Overlay Gradient - Minimalistic */}
            <div className={`absolute inset-0 transition-all duration-1000 ${
              isIntro ? 'bg-gradient-to-t from-black/80 via-transparent to-black/30' : 'bg-black/10'
            }`}></div>
         </div>
       )}

       {/* Top Navigation Bar - Minimal */}
       <div className={`p-2 sm:p-4 flex justify-between items-center sticky top-0 z-20 transition-all duration-500 flex-shrink-0 h-14 ${activeSubScene ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
         <Button 
            variant="outline" 
            className={`py-1 px-3 text-xs rounded-full backdrop-blur-md transition-colors font-bold shadow-sm bg-white/20 border-white/40 text-white hover:bg-white/40`} 
            onClick={onBack}
         >
            {t('backToMap', language)}
         </Button>
         {!isIntro && <span className="font-bold text-white text-xs drop-shadow-md bg-black/30 px-2 py-0.5 rounded-full truncate max-w-[200px]">{node.title}</span>}
       </div>

       {/* Main Content Area */}
       <main className="flex-1 p-2 sm:p-4 max-w-5xl mx-auto w-full relative z-10 flex flex-col justify-center min-h-0 pb-4 overflow-hidden">
         {renderContent()}
       </main>
    </div>
  );
};

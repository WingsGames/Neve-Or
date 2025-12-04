
import React, { useState, useEffect } from 'react';
import { getInitialNodes, STORAGE_KEY } from './constants';
import { GameState, NodeType, Language } from './types';
import { Hub } from './components/Hub';
import { SceneEngine } from './components/SceneEngine';
import { DevMode } from './components/DevMode';
import { Button } from './components/ui/Button';
import { LanguageSwitcher } from './components/ui/LanguageSwitcher';
import { t, getDir } from './utils/i18n';
import { auth } from './services/firebase';
import { signInAnonymously } from 'firebase/auth';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('he');
  const [isStorageFull, setIsStorageFull] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [ignorePortrait, setIgnorePortrait] = useState(false);
  
  const [state, setState] = useState<GameState>({
    currentNodeId: null,
    nodes: getInitialNodes('he'),
    score: 0,
    devMode: false
  });

  // 1. Firebase Auth (Anonymous)
  useEffect(() => {
    const signIn = async () => {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously to Firebase");
      } catch (error) {
        console.error("Error signing in anonymously:", error);
      }
    };
    signIn();
  }, []);

  // 2. Reset on Start (Per user request: always start fresh)
  useEffect(() => {
    try {
      // Instead of loading, we explicitly clear the storage to ensure a fresh start
      localStorage.removeItem(STORAGE_KEY);
      console.log("Game state reset on startup.");
    } catch (e) {
      console.warn("Failed to clear local storage", e);
    }
  }, []);

  // 3. Save to LocalStorage (Still save during the session so reload works if needed, 
  // but next proper 'start' will wipe it due to the logic above if the effect runs on mount)
  // Actually, if we want it to reset on *every* open (refresh), the above effect handles it.
  useEffect(() => {
     try {
       const stateToSave = {
         nodes: state.nodes.map(n => ({
           id: n.id,
           isLocked: n.isLocked,
           isCompleted: n.isCompleted,
           data: {
             backgroundImage: n.data.backgroundImage,
             characterImages: n.data.characterImages,
             subScenes: n.data.subScenes?.map(s => ({
                 id: s.id,
                 backgroundImage: s.backgroundImage
             }))
           }
         })),
         score: state.score
       };
       
       const serialized = JSON.stringify(stateToSave);
       localStorage.setItem(STORAGE_KEY, serialized);
       
       if (isStorageFull) setIsStorageFull(false);
     } catch (e: any) {
       if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.message?.includes('exceeded')) {
         console.error("LocalStorage Full!", e);
         setIsStorageFull(true);
       }
     }
  }, [state]);

  // 4. Dev Mode Shortcut
  useEffect(() => {
    if ((import.meta as any).env?.DEV) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && (event.key === 'D' || event.key === 'd' || event.key === 'ג')) {
          event.preventDefault();
          setState(prev => ({ ...prev, devMode: !prev.devMode }));
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // 5. Orientation Logic
  useEffect(() => {
    const checkOrientation = () => {
      const isNarrow = window.innerWidth < 1024;
      const isTall = window.innerHeight > window.innerWidth;
      setIsPortrait(isNarrow && isTall);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const dir = getDir(language);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const newContentNodes = getInitialNodes(newLang);
    const mergedNodes = newContentNodes.map(newNode => {
      const oldNode = state.nodes.find(n => n.id === newNode.id);
      if (oldNode) {
        return {
          ...newNode,
          isLocked: oldNode.isLocked,
          isCompleted: oldNode.isCompleted,
          data: {
            ...newNode.data,
            backgroundImage: oldNode.data.backgroundImage || newNode.data.backgroundImage,
            characterImages: oldNode.data.characterImages || newNode.data.characterImages,
            subScenes: (oldNode.data?.subScenes && newNode.data.subScenes) 
              ? newNode.data.subScenes.map((freshSub: any) => {
                  const savedSub = oldNode.data.subScenes!.find((s: any) => s.id === freshSub.id);
                  return savedSub ? { ...freshSub, backgroundImage: savedSub.backgroundImage || freshSub.backgroundImage } : freshSub;
              })
              : newNode.data.subScenes,
          }
        };
      }
      return newNode;
    });
    setState(prev => ({ ...prev, nodes: mergedNodes }));
  };

  const handleNodeSelect = (nodeId: string) => {
    setState(prev => ({ ...prev, currentNodeId: nodeId }));
  };

  const handleSceneComplete = () => {
    setState(prev => {
      const currentIndex = prev.nodes.findIndex(n => n.id === prev.currentNodeId);
      const newNodes = [...prev.nodes];
      
      if (currentIndex !== -1) {
        newNodes[currentIndex].isCompleted = true;
        if (currentIndex + 1 < newNodes.length) {
          newNodes[currentIndex + 1].isLocked = false;
        }
      }

      let nextNodeId: string | null = 'HUB';
      if (prev.currentNodeId === 'city_hall') nextNodeId = 'intro_freedom_speech';
      else if (prev.currentNodeId === 'newspaper_office') nextNodeId = 'supreme_court';

      return {
        ...prev,
        nodes: newNodes,
        currentNodeId: nextNodeId
      };
    });
  };

  const activeNode = state.nodes.find(n => n.id === state.currentNodeId);

  if (state.devMode) {
    return (
      <DevMode 
        gameState={state} 
        onUpdateGameState={setState} 
        onClose={() => setState(s => ({...s, devMode: false}))}
        isStorageFull={isStorageFull}
      />
    );
  }

  // --- ORIENTATION GUARD ---
  if (isPortrait && !ignorePortrait) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-8 text-center" dir={dir}>
         <div className="text-6xl mb-6 animate-rotate-phone">📱</div>
         <h2 className="text-2xl font-bold text-white mb-4">{t('rotateDevice', language)}</h2>
         <p className="text-gray-400 text-sm mb-8">This game is designed for landscape mode.</p>
         <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
              onClick={() => setIgnorePortrait(true)} 
              className="text-white/60 text-xs hover:text-white underline mt-6 transition-colors"
            >
              המשך בכל זאת
            </button>
         </div>
      </div>
    );
  }

  // --- INTRO SCREEN LOGIC ---
  if (state.currentNodeId === null || (activeNode && activeNode.type === NodeType.INTRO)) {
     const introNode = state.nodes.find(n => n.id === 'intro') || state.nodes.find(n => n.type === NodeType.INTRO);
     if (!introNode) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Error: Intro content not found</div>;

     return (
       <div className="fixed inset-0 w-full h-full bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden" dir={dir}>
         {/* Background Layer */}
         {introNode.data.backgroundImage && (
           <div className="absolute inset-0 z-0 animate-fade-in">
              <img 
                src={introNode.data.backgroundImage} 
                className="w-full h-full object-cover transition-transform duration-[30s] hover:scale-105" 
                alt="Intro Background"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
           </div>
         )}
         
         <div className="absolute top-4 left-4 z-20 flex gap-2">
            <LanguageSwitcher currentLang={language} onLanguageChange={handleLanguageChange} className="!bg-black/30 border border-white/20" />
         </div>

         {/* Content Card */}
         <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 text-center border border-white/20 animate-fade-in-up flex flex-col max-h-[90vh]">
           <div className="mb-4 flex-shrink-0">
             <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-blue-900 drop-shadow-sm mb-2">
               {t('gameTitle', language)}
             </h1>
             <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full"></div>
           </div>
           
           <div className="mb-6 text-gray-600 text-sm sm:text-base leading-relaxed font-medium overflow-y-auto min-h-0 flex-1 custom-scrollbar px-2">
             {introNode.data.description}
           </div>
           
           <div className="flex flex-col items-center gap-3 flex-shrink-0">
             <Button 
               onClick={() => handleSceneComplete()} 
               className="text-lg py-3 px-10 rounded-xl shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transform transition-all hover:scale-105"
             >
               {t('start', language)}
             </Button>
           </div>
         </div>
         
         <div className="absolute bottom-4 text-white/40 text-xs font-mono z-10">
           Neve Or Human Rights Simulator © 2025
         </div>

         <div className="absolute bottom-4 left-4 text-gray-400 text-[10px] font-sans font-bold z-20 opacity-60">
           v2.2
         </div>
       </div>
     );
  }

  // --- GENERAL APP LAYOUT ---
  return (
    // SAFE CONTAINER STRATEGY:
    // 1. Outer div is the black "letterbox" area (fixed inset-0).
    // 2. Inner "Game Container" centers itself and constrains aspect ratio.
    // 3. This prevents the app from becoming too "Short and Wide" which cuts off buttons.
    <div className="fixed inset-0 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden" dir={dir}>
      <div 
        id="game-container"
        className="relative w-full h-full mx-auto shadow-2xl bg-slate-900 flex flex-col overflow-hidden transition-all duration-300"
        style={{
            // Constrain aspect ratio to keep UI sane.
            // If the screen is super wide (like 25:9), we restrict width to match a cinematic 21:9 ratio.
            // If the screen is standard 16:9 or 4:3, it fills normally.
            maxWidth: '177.78vh', // Approx 16:9 ratio based on height
            width: '100%',
            height: '100%'
        }}
      >
        {state.currentNodeId === 'HUB' ? (
            <Hub 
            nodes={state.nodes} 
            onNodeSelect={handleNodeSelect} 
            language={language} 
            onLanguageChange={handleLanguageChange} 
            onOpenDevMode={() => setState(s => ({...s, devMode: true}))}
            onBackToIntro={() => setState(s => ({...s, currentNodeId: null}))}
            />
        ) : activeNode ? (
            <SceneEngine 
            node={activeNode} 
            onComplete={handleSceneComplete}
            onBack={() => setState(s => ({...s, currentNodeId: 'HUB'}))}
            language={language}
            />
        ) : (
            <div className="flex items-center justify-center h-full bg-slate-900 text-white">{t('loading', language)}</div>
        )}
      </div>
    </div>
  );
};

export default App;

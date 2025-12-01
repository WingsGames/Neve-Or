
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  
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

  // 2. Load from LocalStorage on Mount
  useEffect(() => {
    try {
      // Check if running in an iframe
      setIsIframe(window.self !== window.top);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed || !Array.isArray(parsed.nodes)) throw new Error("Invalid save");

        const freshNodes = getInitialNodes('he'); 
        const mergedNodes = freshNodes.map(freshNode => {
             const savedNode = parsed.nodes.find((n: any) => n.id === freshNode.id);
             if (savedNode) {
                 return {
                     ...freshNode,
                     isLocked: savedNode.isLocked,
                     isCompleted: savedNode.isCompleted,
                     data: {
                         ...freshNode.data,
                         backgroundImage: (typeof savedNode.data?.backgroundImage === 'string') ? savedNode.data.backgroundImage : freshNode.data.backgroundImage,
                         characterImages: (savedNode.data?.characterImages) ? savedNode.data.characterImages : freshNode.data.characterImages,
                         subScenes: (savedNode.data?.subScenes && Array.isArray(savedNode.data.subScenes) && freshNode.data.subScenes) 
                            ? freshNode.data.subScenes.map((freshSub: any) => {
                                const savedSub = savedNode.data.subScenes.find((s: any) => s.id === freshSub.id);
                                return savedSub ? { ...freshSub, backgroundImage: savedSub.backgroundImage || freshSub.backgroundImage } : freshSub;
                            })
                            : freshNode.data.subScenes,
                     }
                 };
             }
             return freshNode;
        });

        setState(prev => ({
            ...prev,
            nodes: mergedNodes,
            score: typeof parsed.score === 'number' ? parsed.score : 0
        }));
      }
    } catch (e) {
      console.warn("Save data issue:", e);
    }
  }, []);

  // 3. Save to LocalStorage
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
       localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
       if (isStorageFull) setIsStorageFull(false);
     } catch (e: any) {
       if (e.name === 'QuotaExceededError' || e.message?.includes('exceeded')) {
         setIsStorageFull(true);
       }
     }
  }, [state]);

  // 4. Keyboard Shortcut for Dev Mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && (event.key === 'D' || event.key === 'd' || event.key === 'ג')) {
        event.preventDefault();
        setState(prev => ({ ...prev, devMode: !prev.devMode }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };
  
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
        if (currentIndex + 1 < newNodes.length) newNodes[currentIndex + 1].isLocked = false;
      }
      let nextNodeId: string | null = 'HUB';
      if (prev.currentNodeId === 'city_hall') nextNodeId = 'intro_freedom_speech';
      else if (prev.currentNodeId === 'newspaper_office') nextNodeId = 'supreme_court';

      return { ...prev, nodes: newNodes, currentNodeId: nextNodeId };
    });
  };

  const activeNode = state.nodes.find(n => n.id === state.currentNodeId);

  if (state.devMode) {
    return <DevMode gameState={state} onUpdateGameState={setState} onClose={() => setState(s => ({...s, devMode: false}))} isStorageFull={isStorageFull} />;
  }

  // --- ORIENTATION GUARD (With Iframe Bypass) ---
  if (isPortrait && !ignorePortrait) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-8 text-center" dir={dir}>
         <div className="text-6xl mb-6 animate-rotate-phone">📱</div>
         <h2 className="text-2xl font-bold text-white mb-4">{t('rotateDevice', language)}</h2>
         <p className="text-gray-400 text-sm mb-8">Please rotate to landscape mode.</p>
         
         <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={toggleFullscreen} variant="secondary" className="text-sm">
              {isFullscreen ? t('exitFullScreen', language) : t('fullScreen', language)}
            </Button>
            
            <button 
              onClick={() => setIgnorePortrait(true)} 
              className={`text-white/80 text-xs hover:text-white underline mt-6 transition-colors ${isIframe ? 'font-bold text-yellow-400' : ''}`}
            >
              {isIframe ? "Embedded Mode: Continue Anyway ⚠️" : "Force Continue (Desktop/Debug)"}
            </button>
         </div>
      </div>
    );
  }

  // --- INTRO SCREEN ---
  if (state.currentNodeId === null || (activeNode && activeNode.type === NodeType.INTRO)) {
     const introNode = state.nodes.find(n => n.id === 'intro') || state.nodes.find(n => n.type === NodeType.INTRO);
     if (!introNode) return <div>Error</div>;

     return (
       <div className="h-[100dvh] bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden" dir={dir}>
         {introNode.data.backgroundImage && (
           <div className="absolute inset-0 z-0 animate-fade-in">
              <img src={introNode.data.backgroundImage} className="w-full h-full object-cover transition-transform duration-[30s] hover:scale-105" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
           </div>
         )}
         
         <div className="absolute top-4 left-4 z-20 flex gap-2">
            <LanguageSwitcher currentLang={language} onLanguageChange={handleLanguageChange} className="!bg-black/30 border border-white/20" />
            <button onClick={toggleFullscreen} className="px-3 py-1 rounded-full text-xs font-bold bg-black/30 border border-white/20 text-white hover:bg-white/20">
              {isFullscreen ? '↙️' : '↗️'}
            </button>
         </div>

         <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 text-center border border-white/20 animate-fade-in-up">
           <div className="mb-4">
             <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-blue-900 drop-shadow-sm mb-2">{t('gameTitle', language)}</h1>
             <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full"></div>
           </div>
           <div className="mb-6 text-gray-600 text-sm sm:text-base leading-relaxed font-medium">{introNode.data.description}</div>
           <div className="flex flex-col items-center gap-3">
             <Button onClick={() => handleSceneComplete()} className="text-lg py-3 px-10 rounded-xl shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transform transition-all hover:scale-105">
               {t('start', language)}
             </Button>
           </div>
         </div>
       </div>
     );
  }

  // --- GAMEPLAY ---
  return (
    <div className="w-full h-[100dvh] overflow-hidden" dir={dir}>
       {!state.currentNodeId && (
         <div className="fixed top-4 right-4 z-[60] opacity-50 hover:opacity-100 transition-opacity">
            <button onClick={toggleFullscreen} className="bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center border border-white/20">
               {isFullscreen ? '↙️' : '↗️'}
            </button>
         </div>
       )}

       {state.currentNodeId === 'HUB' ? (
         <Hub nodes={state.nodes} onNodeSelect={handleNodeSelect} language={language} onLanguageChange={handleLanguageChange} onOpenDevMode={() => setState(s => ({...s, devMode: true}))} />
       ) : activeNode ? (
         <SceneEngine node={activeNode} onComplete={handleSceneComplete} onBack={() => setState(s => ({...s, currentNodeId: 'HUB'}))} language={language} />
       ) : (
         <div className="flex items-center justify-center h-screen bg-slate-900 text-white">{t('loading', language)}</div>
       )}
    </div>
  );
};

export default App;

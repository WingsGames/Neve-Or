
import React, { useState, useEffect } from 'react';
import { GameNode, GameState } from '../types';
import { STORAGE_KEY } from '../constants';
import { Button } from './ui/Button';
import { generateSceneImage, generateCharacterImage } from '../services/geminiService';
import { uploadImageToFirebase } from '../services/storageService';

interface Props {
  gameState: GameState;
  onUpdateGameState: (newState: GameState) => void;
  onClose: () => void;
  isStorageFull?: boolean;
}

type Tab = 'CONTENT' | 'ASSETS';

export const DevMode: React.FC<Props> = ({ gameState, onUpdateGameState, onClose, isStorageFull }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(gameState.nodes.length > 0 ? gameState.nodes[0].id : '');
  const [activeTab, setActiveTab] = useState<Tab>('ASSETS');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<number>(0);
  
  // New: Select a sub-scene to edit (null = edit the main node)
  const [selectedSubSceneId, setSelectedSubSceneId] = useState<string | null>(null);

  const activeNode = gameState.nodes.find(n => n.id === selectedNodeId);

  // Helper to determine what we are currently editing
  const isEditingSubScene = selectedSubSceneId !== null;
  const activeSubScene = isEditingSubScene ? activeNode?.data.subScenes?.find(s => s.id === selectedSubSceneId) : null;
  
  // Data accessors depending on context (Main node vs Sub Scene)
  const targetImage = isEditingSubScene 
      ? activeSubScene?.backgroundImage 
      : activeNode?.data.backgroundImage;

  // Ensure uniqueSpeakers is always an array, safely accessing data
  const uniqueSpeakers: string[] = (activeNode && activeNode.data && activeNode.data.dialog) 
    ? Array.from(new Set(activeNode.data.dialog.map(m => m.speaker))) 
    : [];

  // Calculate generic storage usage estimation
  useEffect(() => {
    const json = JSON.stringify(gameState);
    const bytes = new Blob([json]).size;
    const mb = bytes / (1024 * 1024);
    setStorageUsage(mb);
  }, [gameState]);

  // Helper: Check if a node has any Base64 (heavy) images
  const hasBase64 = (node: GameNode) => {
    if (node.data.backgroundImage?.startsWith('data:')) return true;
    if (Object.values(node.data.characterImages || {}).some(v => v.startsWith('data:'))) return true;
    if (node.data.subScenes?.some(s => s.backgroundImage?.startsWith('data:'))) return true;
    return false;
  };

  const isSubSceneHeavy = (node: GameNode, subId: string) => {
      const sub = node.data.subScenes?.find(s => s.id === subId);
      return sub?.backgroundImage?.startsWith('data:');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeNode) return;
    if (isEditingSubScene) {
        // Sub-scene descriptions are not usually editable in this simple UI, but we could add it.
        // For now, we only edit the main node description as the 'context' for generation.
        updateNodeData(activeNode.id, { description: e.target.value });
    } else {
        updateNodeData(activeNode.id, { description: e.target.value });
    }
  };

  const handleGenerateBG = async () => {
    if (!activeNode) return;
    setIsProcessing('gen_bg');
    
    let prompt = activeNode.data.description;

    // Special visual overrides
    if (activeNode.id === 'town_square' && !isEditingSubScene) {
       prompt = "A beautiful wide city square in a modern digital city. Sunny day. People walking peacefully, open paved space, a few trees, benches, city skyline in background. Wide angle view, single unified composition, vector art style. No split screen.";
    }

    if (activeNode.id === 'newspaper_office' && !isEditingSubScene) {
       prompt = "A close-up view of a modern journalist's desk. Aesthetic and clean office interior. Includes a computer screen (blank), a coffee cup, notebooks, and pens. Soft lighting. Digital city vector art style. STRICTLY NO TEXT, NO HEADLINES, NO LETTERS anywhere.";
    }

    if (isEditingSubScene && activeSubScene) {
      let visualDescriptors = "";
      const subId = activeSubScene.id.toLowerCase();
      const subTitle = activeSubScene.title;

      if (subId.includes('school') || subTitle.includes('בית ספר')) {
         visualDescriptors = "Interior of a modern high school classroom. Rows of student desks, a large whiteboard or blackboard, educational posters on walls, school hallway, lockers. Bright educational setting.";
      } else if (subId.includes('cafe') || subTitle.includes('קפה')) {
         visualDescriptors = "Interior of a cozy urban coffee shop. Espresso machine, small round tables, customers sitting with laptops, warm lighting, coffee cups.";
      } else if (subId.includes('square') || subTitle.includes('כיכר')) {
         visualDescriptors = "A public city square outdoors. Wide open paved space, a central fountain or statue, benches, city skyline in background, people walking.";
      } else if (subId.includes('neighborhood') || subTitle.includes('מגורים')) {
         visualDescriptors = "A quiet residential street view. Apartment building facades, sidewalk, street lamps, some greenery, parked cars.";
      }

      prompt = `Specific location scene: ${activeSubScene.title}. ${visualDescriptors} (Context from story: ${activeNode.data.description})`;
    }

    const imageUrl = await generateSceneImage(prompt);
    setIsProcessing(null);
    
    if (imageUrl) {
      if (isEditingSubScene && activeSubScene) {
          updateSubSceneData(activeNode.id, activeSubScene.id, { backgroundImage: imageUrl });
      } else {
          updateNodeData(activeNode.id, { backgroundImage: imageUrl });
      }
    } else {
      alert('שגיאה ביצירת תמונה. וודא שיש API KEY.');
    }
  };

  const handleGenerateCharacter = async (speaker: string) => {
    if (!activeNode) return;
    setIsProcessing(`gen_char_${speaker}`);
    const mood = activeNode.data.dialog.find(d => d.speaker === speaker)?.mood || 'neutral';
    const imageUrl = await generateCharacterImage(speaker, mood);
    setIsProcessing(null);

    if (imageUrl) {
      const currentImages = activeNode.data.characterImages || {};
      updateNodeData(activeNode.id, { 
        characterImages: { ...currentImages, [speaker]: imageUrl } 
      });
    }
  };

  const handleUploadBG = async () => {
    if (!activeNode) return;
    const base64 = targetImage;
    if (!base64 || !base64.startsWith('data:')) {
      alert('התמונה כבר שמורה בענן (או שאינה קיימת).');
      return;
    }

    setIsProcessing('up_bg');
    // Unique filename based on context
    const suffix = isEditingSubScene ? `_sub_${activeSubScene?.id}` : '';
    const filename = `backgrounds/${activeNode.id}${suffix}_${Date.now()}.jpg`;
    
    const url = await uploadImageToFirebase(base64, filename);
    setIsProcessing(null);

    if (url) {
      if (isEditingSubScene && activeSubScene) {
          updateSubSceneData(activeNode.id, activeSubScene.id, { backgroundImage: url });
      } else {
          updateNodeData(activeNode.id, { backgroundImage: url });
      }
      alert('הרקע נשמר בענן בהצלחה!');
    } else {
      alert('שגיאה בהעלאת התמונה לענן.');
    }
  };

  const handleUploadCharacter = async (speaker: string) => {
    if (!activeNode || !activeNode.data.characterImages?.[speaker]) return;
    const base64 = activeNode.data.characterImages[speaker];
    if (!base64.startsWith('data:')) return;

    setIsProcessing(`up_char_${speaker}`);
    const safeName = speaker.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `characters/${activeNode.id}_${safeName}_${Date.now()}.jpg`;
    const url = await uploadImageToFirebase(base64, filename);
    setIsProcessing(null);

    if (url) {
      const currentImages = activeNode.data.characterImages || {};
      updateNodeData(activeNode.id, { 
        characterImages: { ...currentImages, [speaker]: url } 
      });
      alert(`הדמות ${speaker} נשמרה בענן!`);
    }
  };

  const updateNodeData = (nodeId: string, partialData: any) => {
    const updatedNodes = gameState.nodes.map(n => 
      n.id === nodeId 
        ? { ...n, data: { ...n.data, ...partialData } }
        : n
    );
    onUpdateGameState({ ...gameState, nodes: updatedNodes });
  };

  const updateSubSceneData = (nodeId: string, subSceneId: string, partialData: any) => {
      const updatedNodes = gameState.nodes.map(n => {
          if (n.id === nodeId && n.data.subScenes) {
              const newSubScenes = n.data.subScenes.map(sub => 
                  sub.id === subSceneId ? { ...sub, ...partialData } : sub
              );
              return { ...n, data: { ...n.data, subScenes: newSubScenes } };
          }
          return n;
      });
      onUpdateGameState({ ...gameState, nodes: updatedNodes });
  };

  const handleResetData = () => {
    if (confirm('האם אתה בטוח? זה ימחק את כל התמונות והטקסטים ששינית ויחזיר את המשחק למצב ההתחלתי.')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const storagePercentage = Math.min((storageUsage / 4.8) * 100, 100);
  const storageColor = storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col" dir="rtl">
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">🛠️ Dev Panel</h2>
          <div className="flex bg-gray-800 rounded-lg p-1">
             <button onClick={() => setActiveTab('ASSETS')} className={`px-4 py-1 rounded-md text-sm font-bold transition ${activeTab === 'ASSETS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>נכסים (AI & Cloud)</button>
             <button onClick={() => setActiveTab('CONTENT')} className={`px-4 py-1 rounded-md text-sm font-bold transition ${activeTab === 'CONTENT' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>עריכת תוכן</button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex flex-col items-end mr-4">
             <div className="text-[10px] text-gray-400">שימוש בזיכרון: {storageUsage.toFixed(2)}MB / 5.00MB</div>
             <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${storageColor} transition-all duration-500`} style={{ width: `${storagePercentage}%` }}></div>
             </div>
          </div>
          <Button variant="secondary" onClick={handleResetData} className="py-1 px-3 text-sm bg-red-100 text-red-600 hover:bg-red-200 border-none shadow-none">איפוס</Button>
          <Button variant="danger" onClick={onClose} className="py-1 px-3 text-sm">סגור</Button>
        </div>
      </header>

      {(isStorageFull || storagePercentage > 95) && (
        <div className="bg-red-600 text-white p-2 text-center text-sm font-bold animate-pulse shadow-lg shrink-0">
          ⚠️ זיכרון הדפדפן מלא! השינויים לא נשמרים. עליך למצוא שלבים המסומנים ב-🟠 ולהעלות אותם לענן כדי לפנות מקום.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-gray-100 border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">בחר שלב לעריכה:</div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {gameState.nodes.map(node => {
              const isHeavy = hasBase64(node);
              return (
                <div 
                  key={node.id} 
                  onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedSubSceneId(null); 
                  }} 
                  className={`p-3 rounded-lg cursor-pointer text-sm font-medium transition-colors flex justify-between items-center ${selectedNodeId === node.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-200 text-gray-700'}`}
                >
                  <span className="truncate flex-1">{node.title}</span>
                  {isHeavy && <span title="תמונות כבדות שלא נשמרו בענן" className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm animate-pulse ml-2 font-bold">כבדים ⚠</span>}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {activeNode ? (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              
              {/* SUB-SCENE SELECTOR */}
              {activeNode.data.subScenes && activeNode.data.subScenes.length > 0 && (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-200 flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1 justify-between">
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-900">📍 בחר מיקום ספציפי:</span>
                            <span className="text-xs text-gray-500">(לכל מיקום יש תמונה משלו)</span>
                         </div>
                         <div className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">חפש נקודות כתומות 🟠</div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                          <button 
                            onClick={() => setSelectedSubSceneId(null)}
                            className={`px-3 py-2 rounded-lg text-sm transition-all border flex items-center gap-2 ${selectedSubSceneId === null ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                              <span>השלב הראשי</span>
                              {activeNode.data.backgroundImage?.startsWith('data:') && <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse border border-white"></span>}
                          </button>
                          {activeNode.data.subScenes.map(sub => {
                              const isSubHeavy = isSubSceneHeavy(activeNode, sub.id);
                              return (
                                <button 
                                  key={sub.id}
                                  onClick={() => setSelectedSubSceneId(sub.id)}
                                  className={`px-3 py-2 rounded-lg text-sm transition-all border relative flex items-center gap-2 ${selectedSubSceneId === sub.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span>{sub.icon} {sub.title}</span>
                                    {isSubHeavy && <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse border border-white" title="לא נשמר בענן"></span>}
                                </button>
                              );
                          })}
                      </div>
                  </div>
              )}

              {activeTab === 'ASSETS' && (
                <>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 justify-between">
                        <span>🖼️ תמונת רקע {isEditingSubScene ? `(עבור ${activeSubScene?.title})` : '(ראשי)'}</span>
                        {targetImage?.startsWith('data:') && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">לא מגובה בענן ⚠</span>}
                    </h3>
                    <div className="flex gap-6 items-start">
                       <div className="flex-1 space-y-4">
                         <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800">
                           <strong>תהליך עבודה נכון:</strong><br/>
                           1. לחץ <b>"צור חדש"</b> כדי לקבל רעיון מתמונת ה-AI.<br/>
                           2. <span className="text-red-600 font-black">חובה!</span> לחץ <b>"שמור בענן"</b> מיד אחר כך.<br/>
                           רק כך המשחק ישמור את התמונה החדשה לאורך זמן.
                         </div>
                         <p className="text-xs text-gray-500">
                             {isEditingSubScene ? `תיאור עבור AI: "Scene in ${activeSubScene?.title}..."` : `תיאור עבור AI: "${activeNode.data.description.substring(0, 50)}..."`}
                         </p>
                         <div className="flex gap-2">
                            <Button onClick={handleGenerateBG} disabled={!!isProcessing} className="flex-1">
                              {isProcessing === 'gen_bg' ? '✨ יוצר...' : '✨ צור חדש'}
                            </Button>
                            {targetImage && targetImage.startsWith('data:') && (
                              <Button onClick={handleUploadBG} variant="secondary" disabled={!!isProcessing} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 animate-pulse font-black">
                                {isProcessing === 'up_bg' ? '☁️ מעלה...' : '☁️ שמור בענן (חובה!)'}
                              </Button>
                            )}
                         </div>
                       </div>
                       <div className="w-1/2 aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center relative group">
                          {targetImage ? (
                            <>
                              <img src={targetImage} alt="BG" className="w-full h-full object-cover" />
                              {targetImage.startsWith('data:') && (
                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded shadow animate-pulse">קובץ כבד (זמני)</div>
                              )}
                            </>
                          ) : <span className="text-gray-400">אין תמונה</span>}
                       </div>
                    </div>
                  </div>

                  {!isEditingSubScene && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">👥 דמויות (גלובלי לשלב)</h3>
                        {uniqueSpeakers.length === 0 ? <p className="text-gray-500">אין דמויות בשלב זה.</p> : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {uniqueSpeakers.map(speaker => {
                                const hasImage = !!activeNode.data.characterImages?.[speaker];
                                const isCloud = hasImage && !activeNode.data.characterImages?.[speaker].startsWith('data:');
                                return (
                                  <div key={speaker} className="border rounded-xl p-4 flex flex-col items-center gap-3 bg-gray-50 relative">
                                    {hasImage && !isCloud && <div className="absolute top-2 right-2 text-orange-500 text-xs font-bold animate-pulse">⚠ שמור אותי</div>}
                                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shadow-inner border-2 border-white">
                                      {hasImage ? <img src={activeNode.data.characterImages?.[speaker]} alt={speaker} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                                    </div>
                                    <div className="font-bold text-gray-800">{speaker}</div>
                                    <div className="w-full flex flex-col gap-2">
                                        <Button variant="outline" className="text-xs py-1 px-3 w-full" onClick={() => handleGenerateCharacter(speaker)} disabled={!!isProcessing}>
                                          {isProcessing === `gen_char_${speaker}` ? '⏳' : '✨ צור'}
                                        </Button>
                                        {hasImage && !isCloud && (
                                          <Button variant="secondary" className="text-xs py-1 px-3 w-full bg-orange-500 text-white hover:bg-orange-600" onClick={() => handleUploadCharacter(speaker)} disabled={!!isProcessing}>
                                             {isProcessing === `up_char_${speaker}` ? '☁️...' : '☁️ שמור'}
                                          </Button>
                                        )}
                                    </div>
                                  </div>
                                );
                            })}
                          </div>
                        )}
                      </div>
                  )}
                </>
              )}
              {activeTab === 'CONTENT' && !isEditingSubScene && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <div>
                    <label className="block font-bold mb-2 text-gray-700">תיאור השלב (ראשי)</label>
                    <textarea className="w-full p-4 border border-gray-300 rounded-xl h-32 focus:ring-2 focus:ring-blue-500" value={activeNode.data.description} onChange={handleDescriptionChange} />
                  </div>
                </div>
              )}
            </div>
          ) : <div className="flex items-center justify-center h-full text-gray-400">בחר שלב מהתפריט מימין</div>}
        </main>
      </div>
    </div>
  );
};

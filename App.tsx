import React, { useState, useEffect, useCallback } from 'react';
import { AgentType, AppState, LogEntry, DirectorPlan } from './types';
import * as GeminiService from './services/gemini';
import { AgentCard } from './components/AgentCard';
import { Terminal } from './components/Terminal';
import { Tooltip } from './components/Tooltip';
import { Sparkles, Play, RotateCcw, Key, Video, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function App() {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [brief, setBrief] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [directorPlan, setDirectorPlan] = useState<DirectorPlan | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  // Initial Key Check
  useEffect(() => {
    GeminiService.checkApiKey().then(setApiKeyReady);
  }, []);

  const handleSelectKey = async () => {
    try {
      const success = await GeminiService.requestApiKey();
      setApiKeyReady(success);
    } catch (e) {
      console.error("Failed to select key", e);
    }
  };

  const handleResetKey = async () => {
    await GeminiService.clearApiKey();
    // Re-trigger selection
    handleSelectKey();
  };

  const addLog = (agent: AgentType, message: string, details?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      agent,
      message,
      details
    }]);
  };

  const runSimulation = useCallback(async () => {
    if (!brief.trim()) return;
    
    setAppState(AppState.PLANNING);
    setLogs([]); // Clear logs for new run
    setDirectorPlan(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setVideoUrl(null);
    setActiveTab('image');

    addLog(AgentType.USER, "New Brief Submitted", brief);

    try {
      // 1. Director
      addLog(AgentType.DIRECTOR, "Analyzing brief...", "Reasoning with Gemini 2.5 Flash");
      const plan = await GeminiService.directorAgent(brief);
      setDirectorPlan(plan);
      addLog(AgentType.DIRECTOR, "Production Plan Created", `Goal: ${plan.reasoning.substring(0, 50)}...`);
      
      // 2. Art Dept
      setAppState(AppState.GENERATING_IMAGE);
      addLog(AgentType.ART_DEPT, "Commissioning assets...", "Model: Imagen 4.0");
      addLog(AgentType.ART_DEPT, "Processing visual prompt", plan.visualPrompt.substring(0, 60) + "...");
      const imageBytes = await GeminiService.artDeptAgent(plan.visualPrompt);
      const base64Image = `data:image/jpeg;base64,${imageBytes}`;
      setGeneratedImage(base64Image);
      addLog(AgentType.ART_DEPT, "Asset Acquired", "4K Texture generated successfully");

      // 3. Motion Dept
      setAppState(AppState.GENERATING_VIDEO);
      setActiveTab('video'); // Switch tab automatically
      addLog(AgentType.MOTION_DEPT, "Initializing physics engine...", "Model: Veo 3.1 Fast Preview");
      addLog(AgentType.MOTION_DEPT, "Applying motion vectors", plan.motionPrompt);
      
      const videoUri = await GeminiService.motionDeptAgent(imageBytes, plan.motionPrompt);
      setGeneratedVideo(videoUri);
      
      addLog(AgentType.MOTION_DEPT, "Rendering Complete", "Final compositing finished");
      setAppState(AppState.COMPLETE);
      
      // Fetch video for playback
      try {
        const fetchUrl = `${videoUri}&key=${process.env.API_KEY}`;
        const res = await fetch(fetchUrl);
        const blob = await res.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } catch (err) {
        addLog(AgentType.MOTION_DEPT, "Error fetching video blob", String(err));
      }

    } catch (error: any) {
      setAppState(AppState.ERROR);
      addLog(AgentType.DIRECTOR, "CRITICAL FAILURE", error.message || "Unknown error");
    }
  }, [brief]);

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full space-y-8">
          <div className="w-20 h-20 bg-black rounded-2xl mx-auto flex items-center justify-center shadow-xl">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <div className="space-y-2">
             <h1 className="text-4xl font-bold text-black tracking-tight">Visionary Studio</h1>
             <p className="text-zinc-500 font-light text-lg">
               Enterprise Agentic Workflow
             </p>
          </div>
          
          <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-sm text-left space-y-4">
            <div className="flex items-start gap-3">
               <div className="p-2 bg-zinc-100 rounded-lg">
                  <Video className="w-5 h-5 text-zinc-600" />
               </div>
               <div>
                  <h3 className="font-semibold text-zinc-900">Veo Video Generation</h3>
                  <p className="text-sm text-zinc-500 mt-1">Requires a paid Google Cloud Project with the Vertex AI API enabled.</p>
               </div>
            </div>
          </div>

          <button
            onClick={handleSelectKey}
            className="w-full py-4 px-6 bg-black text-white font-medium rounded-xl hover:bg-zinc-800 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
          >
            <Key className="w-5 h-5" />
            Connect Google Cloud API Key
          </button>
          
          <p className="text-xs text-zinc-400">
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-zinc-600">
              Billing Information
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
               <h1 className="font-bold text-xl tracking-tight text-black">Visionary</h1>
               <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Enterprise Edition</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm bg-zinc-100/50 p-1.5 rounded-full border border-zinc-200/50">
               <Tooltip content="Step 1: Planning">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${appState === AppState.PLANNING ? 'bg-black text-white' : 'text-zinc-400'}`}>Director</span>
               </Tooltip>
               <span className="text-zinc-300">→</span>
               <Tooltip content="Step 2: Generation">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${appState === AppState.GENERATING_IMAGE ? 'bg-black text-white' : 'text-zinc-400'}`}>Art</span>
               </Tooltip>
               <span className="text-zinc-300">→</span>
               <Tooltip content="Step 3: Animation">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${appState === AppState.GENERATING_VIDEO ? 'bg-black text-white' : 'text-zinc-400'}`}>Motion</span>
               </Tooltip>
            </div>

            <Tooltip content="Change or reset your API Key">
               <button 
                  onClick={handleResetKey}
                  className="p-2 text-zinc-400 hover:text-black transition-colors rounded-lg hover:bg-zinc-100"
               >
                  <RotateCcw className="w-5 h-5" />
               </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Input & Logs */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="block text-sm font-semibold text-zinc-900">
               Creative Brief
               </label>
               <span className="text-xs text-zinc-400 uppercase tracking-wider">Input</span>
            </div>
            
            <div className="relative group">
               <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR}
                  placeholder="Describe a scene to simulate..."
                  className="w-full h-40 bg-white border border-zinc-200 rounded-xl p-5 text-sm text-zinc-900 focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none transition-all placeholder:text-zinc-400 shadow-sm group-hover:border-zinc-300"
               />
               <div className="absolute bottom-4 right-4 text-xs text-zinc-300 pointer-events-none">
                  AI-Powered
               </div>
            </div>
            
            <button
              onClick={runSimulation}
              disabled={!brief.trim() || (appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR)}
              className={`
                w-full py-4 px-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all shadow-lg
                ${appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none border border-zinc-200' 
                  : 'bg-black text-white hover:bg-zinc-800 hover:scale-[1.01]'}
              `}
            >
              {appState === AppState.IDLE || appState === AppState.COMPLETE || appState === AppState.ERROR ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Production</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Processing Workflow...</span>
                </>
              )}
            </button>
          </div>

          <Terminal logs={logs} />
        </div>

        {/* Right Column: Visualization */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Agents Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <AgentCard 
              type={AgentType.DIRECTOR}
              currentState={appState}
              label="Director"
              description="Orchestration & Planning"
            />
            <AgentCard 
              type={AgentType.ART_DEPT}
              currentState={appState}
              label="Art Dept"
              description="Imagen 4.0 Generation"
            />
            <AgentCard 
              type={AgentType.MOTION_DEPT}
              currentState={appState}
              label="Motion Dept"
              description="Veo 3.0 Simulation"
            />
          </div>

          {/* Media Stage */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-200/50 min-h-[500px] flex flex-col relative overflow-hidden">
            {/* Stage Toolbar */}
            <div className="flex border-b border-zinc-100 px-6 py-4 justify-between items-center bg-zinc-50/50">
               <div className="flex gap-2">
                  <button 
                     onClick={() => setActiveTab('image')}
                     className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'image' ? 'bg-white text-black shadow-sm ring-1 ring-zinc-200' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                     <ImageIcon className="w-3 h-3" />
                     Visual Asset
                  </button>
                  <button 
                     onClick={() => setActiveTab('video')}
                     className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'video' ? 'bg-white text-black shadow-sm ring-1 ring-zinc-200' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                     <Video className="w-3 h-3" />
                     Motion Asset
                  </button>
               </div>
               <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="h-2 w-2 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="h-2 w-2 rounded-full bg-green-500/20 border border-green-500/50"></div>
               </div>
            </div>

            {/* Display Area */}
            <div className="flex-1 bg-[#F5F5F7] flex items-center justify-center relative p-8">
              {appState === AppState.IDLE && !generatedImage && (
                <div className="text-center space-y-4 max-w-sm">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-zinc-200">
                     <Sparkles className="w-6 h-6 text-zinc-300" />
                  </div>
                  <div>
                     <h3 className="text-zinc-900 font-medium">Ready for Production</h3>
                     <p className="text-zinc-400 text-sm mt-1">Submit a brief to start the automated agency pipeline.</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {(appState === AppState.GENERATING_IMAGE || appState === AppState.GENERATING_VIDEO) && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 transition-all">
                    <Loader2 className="w-10 h-10 text-black animate-spin mb-4 opacity-20" />
                    <p className="text-zinc-500 font-medium text-sm animate-pulse">
                       {appState === AppState.GENERATING_IMAGE ? 'Rendering 4K Textures...' : 'Simulating Physics Engine...'}
                    </p>
                 </div>
              )}
               
              {/* Image View */}
              <div className={`transition-opacity duration-500 w-full h-full flex items-center justify-center ${activeTab === 'image' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                 {generatedImage ? (
                   <img 
                     src={generatedImage} 
                     alt="Generated Asset" 
                     className="max-h-[500px] w-auto rounded-lg shadow-2xl ring-1 ring-black/5"
                   />
                 ) : (
                    appState !== AppState.IDLE && activeTab === 'image' && <div className="text-zinc-300 text-sm">Waiting for Art Dept...</div>
                 )}
              </div>

              {/* Video View */}
              <div className={`transition-opacity duration-500 w-full h-full flex items-center justify-center ${activeTab === 'video' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                 {videoUrl ? (
                   <video 
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="max-h-[500px] w-auto rounded-lg shadow-2xl ring-1 ring-black/5 bg-black"
                   />
                 ) : (
                    appState !== AppState.IDLE && activeTab === 'video' && <div className="text-zinc-300 text-sm">Waiting for Motion Dept...</div>
                 )}
              </div>
            </div>
            
            {/* Metadata Footer */}
            {directorPlan && (
              <div className="p-5 bg-white border-t border-zinc-100 text-xs font-mono space-y-3">
                 <div className="flex gap-4 items-baseline border-b border-zinc-50 pb-3">
                    <span className="text-zinc-400 uppercase tracking-widest text-[10px] w-16 shrink-0">Strategy</span>
                    <span className="text-zinc-800 leading-relaxed">{directorPlan.reasoning}</span>
                 </div>
                 {generatedImage && (
                    <div className="flex gap-4 items-baseline border-b border-zinc-50 pb-3">
                       <span className="text-zinc-400 uppercase tracking-widest text-[10px] w-16 shrink-0">Visual</span>
                       <span className="text-zinc-600 truncate">{directorPlan.visualPrompt}</span>
                    </div>
                 )}
                 {videoUrl && (
                    <div className="flex gap-4 items-baseline">
                       <span className="text-zinc-400 uppercase tracking-widest text-[10px] w-16 shrink-0">Motion</span>
                       <span className="text-zinc-600 truncate">{directorPlan.motionPrompt}</span>
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
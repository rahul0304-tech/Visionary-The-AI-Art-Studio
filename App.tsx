import React, { useState, useEffect, useCallback } from 'react';
import { AgentType, AppState, LogEntry, DirectorPlan } from './types';
import * as GeminiService from './services/gemini';
import { AgentCard } from './components/AgentCard';
import { Terminal } from './components/Terminal';
import { Tooltip } from './components/Tooltip';
import { Sparkles, Play, RotateCcw, Lock, Video } from 'lucide-react';

export default function App() {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [brief, setBrief] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [directorPlan, setDirectorPlan] = useState<DirectorPlan | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

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
      addLog(AgentType.MOTION_DEPT, "Initializing physics engine...", "Model: Veo 3.1 Fast Preview");
      addLog(AgentType.MOTION_DEPT, "Applying motion vectors", plan.motionPrompt);
      
      const videoUri = await GeminiService.motionDeptAgent(imageBytes, plan.motionPrompt);
      // We need to fetch the actual video blob, appending the API key as per instructions for download links
      // However, check if the URI is a direct link or needs fetching. 
      // The instruction says: const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      // Since process.env.API_KEY is available.
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Visionary Studio</h1>
          <p className="text-zinc-400">
            Enterprise-grade generative media pipeline powered by Gemini, Imagen 4.0, and Veo.
            Please connect your Google Cloud project to begin.
          </p>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-sm text-zinc-400">
            <p className="mb-2">This app uses <strong>Veo</strong> for video generation.</p>
            <p>You must select a paid API key from a Google Cloud Project with billing enabled.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline mt-2 inline-block">
              Learn about billing
            </a>
          </div>
          <button
            onClick={handleSelectKey}
            className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Connect API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Visionary <span className="text-zinc-500 font-normal">| Agentic Creative Studio</span></h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
             <Tooltip content="Orchestrates the workflow">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full border ${appState === AppState.PLANNING ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-zinc-800 text-zinc-500'}`}>
                   Director
                </span>
             </Tooltip>
             <span className="text-zinc-700">→</span>
             <Tooltip content="Generates high-fidelity static assets">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full border ${appState === AppState.GENERATING_IMAGE ? 'border-pink-500 text-pink-400 bg-pink-500/10' : 'border-zinc-800 text-zinc-500'}`}>
                   Art Dept
                </span>
             </Tooltip>
             <span className="text-zinc-700">→</span>
             <Tooltip content="Animates static assets into video">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full border ${appState === AppState.GENERATING_VIDEO ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-zinc-800 text-zinc-500'}`}>
                   Motion Dept
                </span>
             </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Input & Logs */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Creative Brief
              </label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR}
                placeholder="Describe your vision (e.g., 'A cyberpunk city in the clouds with neon rain')..."
                className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-zinc-700"
              />
            </div>
            
            <button
              onClick={runSimulation}
              disabled={!brief.trim() || (appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR)}
              className={`
                w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                ${appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5'}
              `}
            >
              {appState === AppState.IDLE || appState === AppState.COMPLETE || appState === AppState.ERROR ? (
                <>
                  <Play className="w-4 h-4" />
                  Start Production
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>

          <Terminal logs={logs} />
        </div>

        {/* Right Column: Visualization */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Agents Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AgentCard 
              type={AgentType.DIRECTOR}
              currentState={appState}
              label="The Director"
              description="Analyzes intent & drafts production plan."
            />
            <AgentCard 
              type={AgentType.ART_DEPT}
              currentState={appState}
              label="Art Department"
              description="Engineers prompts & renders 4K assets."
            />
            <AgentCard 
              type={AgentType.MOTION_DEPT}
              currentState={appState}
              label="Motion Department"
              description="Simulates physics & renders video."
            />
          </div>

          {/* Media Stage */}
          <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-1 min-h-[400px] flex flex-col relative overflow-hidden">
            {/* Header / Tabs */}
            <div className="flex border-b border-zinc-800 px-4">
               <button className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${!generatedVideo ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}>
                  Visual Asset (Imagen)
               </button>
               <button className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${generatedVideo ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}>
                  Motion Asset (Veo)
               </button>
            </div>

            {/* Display Area */}
            <div className="flex-1 flex items-center justify-center bg-black/50 relative group">
              {appState === AppState.IDLE && !generatedImage && (
                <div className="text-center text-zinc-600 space-y-2">
                  <Sparkles className="w-12 h-12 mx-auto opacity-20" />
                  <p>Ready to create.</p>
                </div>
              )}

              {/* Loading State for Image */}
              {appState === AppState.GENERATING_IMAGE && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                    <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-pink-400 font-mono text-sm animate-pulse">Rendering textures...</p>
                 </div>
              )}
               
              {/* Display Image */}
              {generatedImage && !videoUrl && (
                <img 
                  src={generatedImage} 
                  alt="Generated Asset" 
                  className="max-h-[500px] w-auto rounded shadow-2xl transition-opacity duration-500"
                />
              )}

              {/* Loading State for Video */}
              {appState === AppState.GENERATING_VIDEO && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-cyan-400 font-mono text-sm animate-pulse">Simulating physics (Veo takes time)...</p>
                 </div>
              )}

              {/* Display Video */}
              {videoUrl && (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                   <video 
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="max-h-[500px] w-auto rounded shadow-2xl"
                   />
                </div>
              )}
            </div>
            
            {/* Metadata Footer */}
            {(directorPlan) && (
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-xs font-mono space-y-2">
                 <div className="flex gap-2">
                    <span className="text-zinc-500 uppercase">Strategy:</span>
                    <span className="text-zinc-300">{directorPlan.reasoning}</span>
                 </div>
                 {generatedImage && (
                    <div className="flex gap-2">
                       <span className="text-pink-500 uppercase">Prompt:</span>
                       <span className="text-zinc-400 truncate">{directorPlan.visualPrompt}</span>
                    </div>
                 )}
                 {videoUrl && (
                    <div className="flex gap-2">
                       <span className="text-cyan-500 uppercase">Motion:</span>
                       <span className="text-zinc-400 truncate">{directorPlan.motionPrompt}</span>
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
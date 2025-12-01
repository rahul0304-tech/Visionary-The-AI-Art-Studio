import React, { useState, useEffect, useCallback } from 'react';
import { AgentType, AppState, LogEntry, DirectorPlan } from './types';
import * as GeminiService from './services/gemini';
import { AgentCard } from './components/AgentCard';
import { Terminal } from './components/Terminal';
import { Tooltip } from './components/Tooltip';
import { Sparkles, RotateCcw, Key, Video, Image as ImageIcon, Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [manualKeyInput, setManualKeyInput] = useState('');
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

  const handleManualKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualKeyInput.trim()) {
      GeminiService.setApiKey(manualKeyInput.trim());
      setApiKeyReady(true);
    }
  };

  const handleResetKey = async () => {
    await GeminiService.clearApiKey();
    setApiKeyReady(false);
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
      
      // Fetch video
      try {
        const keyToUse = manualKeyInput || (typeof process !== 'undefined' && process.env ? process.env.API_KEY : '');
        const fetchUrl = `${videoUri}&key=${keyToUse}`;
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
  }, [brief, manualKeyInput]);

  if (!apiKeyReady) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
             <div className="logo-box" style={{ width: '4rem', height: '4rem' }}>
                <Sparkles className="w-8 h-8" />
             </div>
             <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Visionary Studio</h1>
             <p style={{ color: 'var(--text-secondary)' }}>Enterprise Agentic Workflow</p>
          </div>
          
          <div className="info-box">
             <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)' }}>
                <Video className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
             </div>
             <div>
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem' }}>Veo Video Generation</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Requires a paid Google Cloud Project with the Vertex AI API enabled.</p>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={handleSelectKey} className="btn btn-primary">
              <Key className="w-4 h-4" />
              Connect with AI Studio
            </button>
            
            <div className="divider">
              <span>Or enter manually</span>
            </div>

            <form onSubmit={handleManualKeySubmit} className="input-wrapper">
              <input 
                type="password" 
                placeholder="Paste API Key here..."
                value={manualKeyInput}
                onChange={(e) => setManualKeyInput(e.target.value)}
                className="input-field"
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="submit"
                disabled={!manualKeyInput}
                className="btn-submit-icon"
                style={{ border: 'none', cursor: manualKeyInput ? 'pointer' : 'not-allowed' }}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>
              Billing Information
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-4">
            <div className="logo-box">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
               <h1 style={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2 }}>Visionary</h1>
               <p className="badge-enterprise">Enterprise Edition</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Progress Indicators (Custom styles for simplicity in this demo, though ideally in CSS) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', backgroundColor: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)' }}>
               {[
                 { step: AppState.PLANNING, label: 'Director', activeStates: [AppState.PLANNING] },
                 { step: AppState.GENERATING_IMAGE, label: 'Art', activeStates: [AppState.GENERATING_IMAGE] },
                 { step: AppState.GENERATING_VIDEO, label: 'Motion', activeStates: [AppState.GENERATING_VIDEO] }
               ].map((item, idx) => (
                 <React.Fragment key={item.label}>
                   <div style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      backgroundColor: item.activeStates.includes(appState) ? 'var(--bg-black)' : 'transparent',
                      color: item.activeStates.includes(appState) ? 'var(--text-inverse)' : 'var(--text-tertiary)'
                   }}>
                     {item.label}
                   </div>
                   {idx < 2 && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>→</span>}
                 </React.Fragment>
               ))}
            </div>

            <Tooltip content="Reset API Key">
               <button onClick={handleResetKey} className="btn-icon" style={{ borderRadius: 'var(--radius-md)' }}>
                  <RotateCcw className="w-5 h-5" />
               </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container" style={{ padding: '2.5rem 1.5rem' }}>
        <div className="grid-layout">
          
          {/* Left Column: Input & Logs */}
          <div className="col-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex justify-between items-center">
                 <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Creative Brief</label>
                 <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Input</span>
              </div>
              
              <div className="relative">
                 <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR}
                    placeholder="Describe a scene to simulate..."
                    className="textarea-brief"
                 />
              </div>
              
              <button
                onClick={runSimulation}
                disabled={!brief.trim() || (appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR)}
                className="btn btn-primary"
              >
                {appState === AppState.IDLE || appState === AppState.COMPLETE || appState === AppState.ERROR ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '1rem' }}>▶</span>
                       <span>Start Production</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 spin" />
                    <span>Processing...</span>
                  </>
                )}
              </button>
            </div>

            <Terminal logs={logs} />
          </div>

          {/* Right Column: Visualization */}
          <div className="col-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Agents Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
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
            <div className="stage-container">
              {/* Stage Toolbar */}
              <div className="stage-toolbar">
                 <div className="flex gap-2">
                    <button 
                       onClick={() => setActiveTab('image')}
                       className={`btn-tab ${activeTab === 'image' ? 'active' : ''}`}
                    >
                       <div className="flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" />
                          Visual Asset
                       </div>
                    </button>
                    <button 
                       onClick={() => setActiveTab('video')}
                       className={`btn-tab ${activeTab === 'video' ? 'active' : ''}`}
                    >
                       <div className="flex items-center gap-2">
                          <Video className="w-3 h-3" />
                          Motion Asset
                       </div>
                    </button>
                 </div>
                 <div className="flex gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                 </div>
              </div>

              {/* Display Area */}
              <div className="stage-display">
                {appState === AppState.IDLE && !generatedImage && (
                  <div style={{ textAlign: 'center', maxWidth: '16rem' }}>
                    <div style={{ width: '4rem', height: '4rem', backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: 'var(--shadow-sm)' }}>
                       <Sparkles className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <h3 style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Ready for Production</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Submit a brief to start the automated agency pipeline.</p>
                  </div>
                )}

                {/* Loading State Overlay */}
                {(appState === AppState.GENERATING_IMAGE || appState === AppState.GENERATING_VIDEO) && (
                   <div className="loading-overlay">
                      <Loader2 className="w-8 h-8 spin" style={{ color: 'var(--text-primary)', marginBottom: '1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                         {appState === AppState.GENERATING_IMAGE ? 'Rendering 4K Textures...' : 'Simulating Physics Engine...'}
                      </p>
                   </div>
                )}
                 
                {/* Image View */}
                <div style={{ display: activeTab === 'image' ? 'flex' : 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                   {generatedImage ? (
                     <img 
                       src={generatedImage} 
                       alt="Generated Asset" 
                       className="stage-media"
                     />
                   ) : (
                      appState !== AppState.IDLE && activeTab === 'image' && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Waiting for Art Dept...</div>
                   )}
                </div>

                {/* Video View */}
                <div style={{ display: activeTab === 'video' ? 'flex' : 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                   {videoUrl ? (
                     <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="stage-media"
                      style={{ backgroundColor: '#000' }}
                     />
                   ) : (
                      appState !== AppState.IDLE && activeTab === 'video' && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Waiting for Motion Dept...</div>
                   )}
                </div>
              </div>
              
              {/* Metadata Footer */}
              {directorPlan && (
                <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-light)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', borderBottom: '1px solid var(--bg-surface-alt)', paddingBottom: '0.75rem' }}>
                      <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '4rem', flexShrink: 0 }}>Strategy</span>
                      <span style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{directorPlan.reasoning}</span>
                   </div>
                   {generatedImage && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', borderBottom: '1px solid var(--bg-surface-alt)', paddingBottom: '0.75rem' }}>
                         <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '4rem', flexShrink: 0 }}>Visual</span>
                         <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{directorPlan.visualPrompt}</span>
                      </div>
                   )}
                   {videoUrl && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                         <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '4rem', flexShrink: 0 }}>Motion</span>
                         <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{directorPlan.motionPrompt}</span>
                      </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
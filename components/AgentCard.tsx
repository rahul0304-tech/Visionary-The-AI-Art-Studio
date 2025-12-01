import React from 'react';
import { AgentType, AppState } from '../types';
import { Bot, Palette, Film, Loader2, CheckCircle2 } from 'lucide-react';

interface AgentCardProps {
  type: AgentType;
  currentState: AppState;
  label: string;
  description: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({ type, currentState, label, description }) => {
  const isActive = 
    (type === AgentType.DIRECTOR && currentState === AppState.PLANNING) ||
    (type === AgentType.ART_DEPT && currentState === AppState.GENERATING_IMAGE) ||
    (type === AgentType.MOTION_DEPT && currentState === AppState.GENERATING_VIDEO);

  const isCompleted = 
    (type === AgentType.DIRECTOR && [AppState.GENERATING_IMAGE, AppState.GENERATING_VIDEO, AppState.COMPLETE].includes(currentState)) ||
    (type === AgentType.ART_DEPT && [AppState.GENERATING_VIDEO, AppState.COMPLETE].includes(currentState)) ||
    (type === AgentType.MOTION_DEPT && currentState === AppState.COMPLETE);

  const getIcon = () => {
    switch (type) {
      case AgentType.DIRECTOR: return <Bot className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-600'}`} />;
      case AgentType.ART_DEPT: return <Palette className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-600'}`} />;
      case AgentType.MOTION_DEPT: return <Film className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-600'}`} />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  return (
    <div className={`
      relative p-6 rounded-xl border transition-all duration-500 ease-out
      ${isActive 
        ? 'border-black bg-white shadow-lg shadow-zinc-200 scale-[1.02] z-10' 
        : isCompleted 
          ? 'border-zinc-200 bg-zinc-50/50' 
          : 'border-zinc-200 bg-white'
      }
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg transition-colors duration-300 ${isActive ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}>
          {getIcon()}
        </div>
        {isActive && <Loader2 className="w-5 h-5 text-black animate-spin" />}
        {isCompleted && <CheckCircle2 className="w-5 h-5 text-zinc-400" />}
      </div>
      
      <h3 className={`font-semibold text-base mb-1 tracking-tight ${isActive ? 'text-black' : 'text-zinc-700'}`}>
        {label}
      </h3>
      <p className="text-sm text-zinc-500 leading-relaxed font-light">
        {description}
      </p>
    </div>
  );
};
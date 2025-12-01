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
      case AgentType.DIRECTOR: return <Bot className="w-6 h-6" />;
      case AgentType.ART_DEPT: return <Palette className="w-6 h-6" />;
      case AgentType.MOTION_DEPT: return <Film className="w-6 h-6" />;
      default: return <Bot className="w-6 h-6" />;
    }
  };

  return (
    <div className={`
      relative p-6 rounded-xl border transition-all duration-300
      ${isActive ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}
      ${isCompleted ? 'border-green-500/50 bg-green-500/5 text-zinc-400' : ''}
      ${!isActive && !isCompleted ? 'border-zinc-800 bg-zinc-900/50 text-zinc-500' : ''}
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-400' : isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800'}`}>
          {getIcon()}
        </div>
        {isActive && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
        {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      </div>
      
      <h3 className={`font-semibold text-lg mb-1 ${isActive ? 'text-blue-100' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'}`}>
        {label}
      </h3>
      <p className="text-sm opacity-80 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
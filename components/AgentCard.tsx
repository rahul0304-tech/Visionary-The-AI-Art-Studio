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
    // Icons inherit color from parent class
    const iconClass = "w-5 h-5";
    switch (type) {
      case AgentType.DIRECTOR: return <Bot className={iconClass} />;
      case AgentType.ART_DEPT: return <Palette className={iconClass} />;
      case AgentType.MOTION_DEPT: return <Film className={iconClass} />;
      default: return <Bot className={iconClass} />;
    }
  };

  let cardClass = "agent-card";
  if (isActive) cardClass += " active";
  else if (isCompleted) cardClass += " completed";

  return (
    <div className={cardClass}>
      <div className="flex justify-between mb-4">
        <div className="agent-icon-box">
          {getIcon()}
        </div>
        {isActive && <Loader2 className="w-5 h-5 animate-spin" />}
        {isCompleted && <CheckCircle2 className="w-5 h-5 text-tertiary" style={{ color: 'var(--text-tertiary)' }} />}
      </div>
      
      <h3 style={{ fontWeight: 600, marginBottom: '0.25rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {label}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
};
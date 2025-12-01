import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentType } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getAgentClass = (agent: AgentType) => {
    switch (agent) {
      case AgentType.DIRECTOR: return 'agent-director';
      case AgentType.ART_DEPT: return 'agent-art';
      case AgentType.MOTION_DEPT: return 'agent-motion';
      case AgentType.USER: return 'agent-user';
      default: return '';
    }
  };

  return (
    <div className="terminal-container scrollbar-hide">
      <div className="terminal-header">
        System Output
      </div>
      {logs.length === 0 && (
         <div style={{ color: '#52525b', fontStyle: 'italic', marginTop: '1rem' }}>Waiting for input...</div>
      )}
      {logs.map((log) => (
        <div key={log.id} className="log-entry">
          <span className="log-time">
            {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-2">
               <span className={`log-agent ${getAgentClass(log.agent)}`}>
               {log.agent}
               </span>
               <span style={{ color: '#a1a1aa' }}>{log.message}</span>
            </div>
            {log.details && (
              <span className="log-details">
                {log.details}
              </span>
            )}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};
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

  const getAgentColor = (agent: AgentType) => {
    switch (agent) {
      // Using soft pastels for readability against dark terminal
      case AgentType.DIRECTOR: return 'text-zinc-100';
      case AgentType.ART_DEPT: return 'text-zinc-300';
      case AgentType.MOTION_DEPT: return 'text-zinc-400';
      case AgentType.USER: return 'text-white';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="bg-[#18181b] rounded-xl border border-zinc-800 p-5 font-mono text-sm h-64 overflow-y-auto scrollbar-hide flex flex-col gap-2 shadow-2xl shadow-zinc-200/50">
      <div className="text-zinc-500 text-xs tracking-widest border-b border-zinc-800 pb-3 mb-2 sticky top-0 bg-[#18181b] uppercase">
        System Output
      </div>
      {logs.length === 0 && (
         <div className="text-zinc-700 italic mt-4">Waiting for input...</div>
      )}
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300 group">
          <span className="text-zinc-600 shrink-0 text-xs pt-1 select-none">
            {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <span className={`font-semibold text-xs tracking-wide ${getAgentColor(log.agent)}`}>
               {log.agent}
               </span>
               <span className="text-zinc-400">{log.message}</span>
            </div>
            {log.details && (
              <span className="text-zinc-600 text-xs mt-1 pl-2 border-l border-zinc-700 group-hover:text-zinc-500 transition-colors">
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
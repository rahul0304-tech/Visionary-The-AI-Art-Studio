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
      case AgentType.DIRECTOR: return 'text-purple-400';
      case AgentType.ART_DEPT: return 'text-pink-400';
      case AgentType.MOTION_DEPT: return 'text-cyan-400';
      case AgentType.USER: return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="bg-black/80 rounded-lg border border-zinc-800 p-4 font-mono text-sm h-64 overflow-y-auto scrollbar-hide flex flex-col gap-2 shadow-inner">
      <div className="text-zinc-500 border-b border-zinc-800 pb-2 mb-2 sticky top-0 bg-black/80 backdrop-blur-sm">
        > Visionary OS v2.5.0 initialized...
      </div>
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="text-zinc-600 shrink-0">
            [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
          </span>
          <div className="flex flex-col">
            <span className={`font-bold ${getAgentColor(log.agent)}`}>
              {log.agent}
            </span>
            <span className="text-zinc-300">{log.message}</span>
            {log.details && (
              <span className="text-zinc-500 text-xs mt-1 pl-2 border-l-2 border-zinc-800">
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
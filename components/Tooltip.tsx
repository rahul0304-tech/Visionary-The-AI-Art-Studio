import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 shadow-lg group-hover:block z-50 border border-zinc-700">
        {content}
        <div className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-zinc-800 border-r border-b border-zinc-700"></div>
      </div>
    </div>
  );
};
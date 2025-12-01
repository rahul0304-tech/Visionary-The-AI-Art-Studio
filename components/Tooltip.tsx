import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="tooltip-wrapper">
      {children}
      <div className="tooltip-content">
        {content}
        <div className="tooltip-arrow"></div>
      </div>
    </div>
  );
};
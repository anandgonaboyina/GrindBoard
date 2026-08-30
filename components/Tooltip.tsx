'use client';
import React from 'react';

interface TooltipProps {
  text?: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Tooltip({ text, position = 'top', children, className = '', disabled = false }: TooltipProps) {
  if (!text || disabled) return <>{children}</>;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const tooltipBox = (
    <div className={`absolute ${positionClasses[position]} hidden group-hover:flex items-center px-2 py-1 bg-slate-900/95 border border-white/15 text-[10px] sm:text-[11px] font-medium text-white/95 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md whitespace-nowrap pointer-events-none z-[9999] animate-in fade-in zoom-in-95 duration-150`}>
      {text}
    </div>
  );

  if (!children) {
    return tooltipBox;
  }

  return (
    <div className={`relative group inline-flex items-center justify-center ${className}`}>
      {children}
      {tooltipBox}
    </div>
  );
}

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text?: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Tooltip({ text, position = 'top', children, className = '', disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      // Approximate dimensions for tooltip calculation since we can't measure it before rendering
      // CSS translate will handle the centering offset
      switch (position) {
        case 'top':
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
      }

      setCoords({ top, left });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  if (!text || disabled) return <>{children}</>;

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  const tooltipBox = isVisible && typeof window !== 'undefined' ? createPortal(
    <div
      className={`fixed ${positionClasses[position]} px-2 py-1 bg-slate-900/95 border border-white/15 text-[10px] sm:text-[11px] font-medium text-white/95 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md whitespace-nowrap pointer-events-none z-[9999] animate-in fade-in zoom-in-95 duration-150`}
      style={{ top: coords.top, left: coords.left }}
    >
      {text}
    </div>,
    document.body
  ) : null;

  if (!children) {
    // If no children, we can't attach hover events easily without a wrapper anyway
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {tooltipBox}
    </div>
  );
}

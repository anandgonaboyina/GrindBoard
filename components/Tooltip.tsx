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
  
  // 1. ADDED: Ref to track the 3-second auto-hide timer
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 2. ADDED: Unified show function that triggers the 3-second auto-hide
  const showTooltip = () => {
    if (!text || disabled) return;
    
    updatePosition();
    setIsVisible(true);

    // Clear any existing timer so it doesn't close prematurely if you hover twice
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Auto-hide after 3 seconds for BOTH desktop and mobile
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // 3. ADDED: Cleanup the timer if the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={handleMouseLeave}
      // 4. ADDED: Mobile tap/touch support to instantly trigger the tooltip
      onClick={showTooltip}
      onTouchStart={showTooltip}
    >
      {children}
      {tooltipBox}
    </div>
  );
}
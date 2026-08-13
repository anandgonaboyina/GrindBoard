'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';

export default function DraggableClock({ children }: { children: React.ReactNode }) {
  const { 
    clockOffsets, 
    updateClockOffset, 
    resetClockOffset, 
    lockedWidgets, 
    isTimetableOpen, 
    widgetZIndices, 
    bringToFront,
    wallpaper,
    currentBgSrc,
    customDesktopWallpapers,
    activeDesktopCustomIndex,
    customMobileWallpapers,
    activeMobileCustomIndex
  } = useDashboardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const latestPos = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Match VideoBackground logic perfectly for active source
  let activeBgSrc = isMobile ? "/wallpapers/defaultWallpaper2.jpeg" : (currentBgSrc || wallpaper || "/wallpapers/naruto.webp");
  if (isMobile && activeMobileCustomIndex !== null && customMobileWallpapers[activeMobileCustomIndex]) {
    activeBgSrc = customMobileWallpapers[activeMobileCustomIndex];
  } else if (!isMobile && activeDesktopCustomIndex !== null && customDesktopWallpapers[activeDesktopCustomIndex]) {
    activeBgSrc = customDesktopWallpapers[activeDesktopCustomIndex];
  }

  // Detect mobile viewport size
  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    setIsMobile(media.matches);
    const listener = () => setIsMobile(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Sync with store when background changes
  useEffect(() => {
    if (activeBgSrc && clockOffsets[activeBgSrc]) {
      setPosition(clockOffsets[activeBgSrc]);
      latestPos.current = clockOffsets[activeBgSrc];
    } else {
      setPosition({ x: 0, y: 0 });
      latestPos.current = { x: 0, y: 0 };
    }
  }, [activeBgSrc, clockOffsets]);

  const handlePointerDown = (e: React.PointerEvent) => {
    bringToFront('clock');
    if (lockedWidgets.includes('clock')) return;

    // Only allow dragging on the wrapper itself, not on interactive children (buttons, toggles)
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.cursor-pointer')) {
      // If they clicked a button inside, let the button handle it
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startOffset.current = { ...position };
    latestPos.current = { ...position }; // Ensure latestPos matches current position if they just click without moving
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    
    const newPos = {
      x: startOffset.current.x + dx,
      y: startOffset.current.y + dy
    };
    setPosition(newPos);
    latestPos.current = newPos;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Save to store
    // Save to store using the guaranteed latest position
    if (activeBgSrc) {
      updateClockOffset(activeBgSrc, latestPos.current.x, latestPos.current.y);
    }
  };

  const handleDoubleClick = () => {
    if (isMobile) return;
    if (activeBgSrc) {
      resetClockOffset(activeBgSrc);
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div 
      className={`relative inline-block w-fit h-fit p-8 pointer-events-auto outline-none focus:outline-none transition-transform ${!isDragging ? 'duration-300' : 'duration-0'} ${lockedWidgets.includes('clock') ? '' : 'cursor-move'} group`}
      style={{ 
        transform: isTimetableOpen ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        zIndex: widgetZIndices?.['clock'] || 50,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      title={lockedWidgets.includes('clock') ? '' : "Drag to move. Double-click to reset position."}
    >
      {!lockedWidgets.includes('clock') && (
        <div className={`absolute inset-0 border-2 border-white/20 bg-white/5 rounded-3xl opacity-0 transition-opacity pointer-events-none ${isDragging ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
      )}
      <div className="relative pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

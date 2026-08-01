'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollableWithArrowsProps {
  children: React.ReactNode;
  className?: string;
  hideArrows?: boolean;
  downArrowOffset?: string;
  persistKey?: string;
}

export default function ScrollableWithArrows({ children, className = '', hideArrows = false, downArrowOffset = 'bottom-2', persistKey }: ScrollableWithArrowsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    if (persistKey && scrollRef.current) {
      const saved = sessionStorage.getItem(persistKey);
      if (saved) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = parseInt(saved, 10);
            checkScroll();
          }
        });
      }
    }
  }, [persistKey]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(Math.ceil(scrollTop + clientHeight) < scrollHeight);
      if (persistKey) {
        sessionStorage.setItem(persistKey, scrollTop.toString());
      }
    }
  };

  const scrollBy = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: direction === 'up' ? -150 : 150, behavior: 'smooth' });
    }
  };

  const scrollRafRef = useRef<number | null>(null);
  const scrollStartTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleArrowPointerDown = (direction: 'up' | 'down', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollBy(direction);
    
    if (scrollStartTimeout.current) clearTimeout(scrollStartTimeout.current);
    scrollStartTimeout.current = setTimeout(() => {
      const scrollStep = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += direction === 'up' ? -20 : 20;
          checkScroll();
        }
        scrollRafRef.current = requestAnimationFrame(scrollStep);
      };
      scrollRafRef.current = requestAnimationFrame(scrollStep);
    }, 300);
  };

  const handleArrowPointerUpOrLeave = (e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (scrollStartTimeout.current) clearTimeout(scrollStartTimeout.current);
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };

  useEffect(() => {
    return () => handleArrowPointerUpOrLeave();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(checkScroll, 100);
    // Add resize listener in case container changes size
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children]);

  // Drag to scroll logic
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const dragMode = useRef<'content' | 'scrollbar'>('content');

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    // Don't interfere with inputs or buttons
    if (e.button !== 0 || target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea' || target.closest('button')) return;

    isDragging.current = true;
    hasMoved.current = false;
    if (scrollRef.current) {
      startY.current = e.pageY;
      startScrollTop.current = scrollRef.current.scrollTop;

      const scrollbarWidth = currentTarget.offsetWidth - currentTarget.clientWidth;
      if (scrollbarWidth > 0 && e.clientX >= currentTarget.getBoundingClientRect().right - scrollbarWidth) {
        dragMode.current = 'scrollbar';
        try {
          currentTarget.setPointerCapture(e.pointerId);
        } catch (err) { }
      } else {
        dragMode.current = 'content';
        // Delay capture until actual movement to allow clicks to pass through!
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;

    const y = e.pageY;
    const walk = y - startY.current;

    if (!hasMoved.current && Math.abs(walk) > 5) {
      hasMoved.current = true;
      if (dragMode.current === 'content') {
        scrollRef.current.style.cursor = 'grabbing';
        scrollRef.current.style.userSelect = 'none';
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) { }
      }
    }

    if (hasMoved.current) {
      e.preventDefault();
      if (dragMode.current === 'scrollbar') {
        // Dragging native scrollbar thumb down -> content moves down
        const ratio = scrollRef.current.scrollHeight / scrollRef.current.clientHeight;
        scrollRef.current.scrollTop = startScrollTop.current + (walk * ratio);
      } else {
        // Panning content down -> content moves up
        scrollRef.current.scrollTop = startScrollTop.current - (walk * 1.5);
      }
    }
  };

  const handlePointerUpOrLeave = (e: React.PointerEvent) => {
    isDragging.current = false;
    hasMoved.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = '';
      scrollRef.current.style.userSelect = '';
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) { }
    }
  };

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col group/scrollable h-full">


      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        onWheel={(e) => {
          e.stopPropagation();
          e.currentTarget.scrollTop += e.deltaY;
          checkScroll();
        }}
        className={`flex-1 overflow-y-auto hidden-scrollbar ${className}`}
      >
        {children}
      </div>

      {!hideArrows && canScrollUp && (
        <button
          onPointerDown={(e) => handleArrowPointerDown('up', e)}
          onPointerUp={handleArrowPointerUpOrLeave}
          onPointerLeave={handleArrowPointerUpOrLeave}
          onPointerCancel={handleArrowPointerUpOrLeave}
          className="absolute top-2 right-0 z-10 hidden md:flex items-center justify-center w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-l-xl opacity-0 group-hover/scrollable:opacity-100 transition-opacity backdrop-blur-md border border-r-0 border-white/10 shadow-lg select-none"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {!hideArrows && canScrollDown && (
        <button
          onPointerDown={(e) => handleArrowPointerDown('down', e)}
          onPointerUp={handleArrowPointerUpOrLeave}
          onPointerLeave={handleArrowPointerUpOrLeave}
          onPointerCancel={handleArrowPointerUpOrLeave}
          className={`absolute ${downArrowOffset} right-0 z-10 hidden md:flex items-center justify-center w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-l-xl opacity-0 group-hover/scrollable:opacity-100 transition-opacity backdrop-blur-md border border-r-0 border-white/10 shadow-lg select-none`}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

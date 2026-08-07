'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableHorizontalWithArrowsProps {
  children: React.ReactNode;
  className?: string;
  hideArrows?: boolean;
}

export default function ScrollableHorizontalWithArrows({ children, className = '', hideArrows = false }: ScrollableHorizontalWithArrowsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -250 : 250, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children]);

  // Drag to scroll logic
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (e.button !== 0 || target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea' || target.closest('button')) return;

    isDragging.current = true;
    if (scrollRef.current) {
      startX.current = e.pageX;
      startScrollLeft.current = scrollRef.current.scrollLeft;
      scrollRef.current.style.cursor = 'grabbing';
      scrollRef.current.style.userSelect = 'none';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    
    
    e.preventDefault();

    const x = e.pageX;
    const walk = x - startX.current;
    scrollRef.current.scrollLeft = startScrollLeft.current - walk;
    checkScroll();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = '';
      scrollRef.current.style.userSelect = '';
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  };

  return (
    <div className={`relative w-full group ${className}`}>
      {/* Left Arrow */}
      {!hideArrows && canScrollLeft && (
        <button
          onClick={(e) => { e.preventDefault(); scrollBy('left'); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full shadow-lg border border-white/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory flex touch-pan-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-4 p-2 mx-auto">
          {children}
        </div>
      </div>

      {/* Right Arrow */}
      {!hideArrows && canScrollRight && (
        <button
          onClick={(e) => { e.preventDefault(); scrollBy('right'); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full shadow-lg border border-white/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}

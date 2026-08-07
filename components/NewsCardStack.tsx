'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Image as ImageIcon, Video, FileCode2 } from 'lucide-react';
import type { NewsPost } from './admin/AdminNewsManager';

interface NewsCardStackProps {
  posts: NewsPost[];
  unreadIds?: string[];
  onEdit?: (post: NewsPost) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function NewsCardStack({ posts, unreadIds = [], onEdit, onDelete, isAdmin }: NewsCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(posts.length > 0 ? posts.length - 1 : 0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset to last card if posts array completely changes (e.g., initial load)
  useEffect(() => {
    setActiveIndex(posts.length > 0 ? posts.length - 1 : 0);
  }, [posts.length]);

  // Swipe mechanics
  const touchStartX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchStartX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartX.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - touchStartX.current;

    // Resistance if we are at the edges
    if ((activeIndex === 0 && diff > 0) || (activeIndex === posts.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.2); // Rubber band effect
    } else {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 75 && activeIndex > 0) {
      // Swiped right -> go to previous (older)
      setActiveIndex(prev => prev - 1);
      setExpandedId(null);
    } else if (dragOffset < -75 && activeIndex < posts.length - 1) {
      // Swiped left -> go to next (newer)
      setActiveIndex(prev => prev + 1);
      setExpandedId(null);
    }
    touchStartX.current = null;
    setDragOffset(0);
  };

  const prev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      setExpandedId(null);
    }
  };

  const next = () => {
    if (activeIndex < posts.length - 1) {
      setActiveIndex(prev => prev + 1);
      setExpandedId(null);
    }
  };

  if (posts.length === 0) return null;

  return (
    <div className="relative w-full h-[550px] sm:h-[600px] flex items-center justify-center perspective-[1200px]">

      {/* Side Controls */}
      <button
        onClick={prev}
        disabled={activeIndex === 0}
        className="absolute -left-0.5 sm:left-[calc(50%-240px)] md:left-[calc(50%-280px)] top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-0 disabled:pointer-events-none transition-all text-white"
      >
        <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
      </button>

      <button
        onClick={next}
        disabled={activeIndex === posts.length - 1}
        className="absolute -right-0.5 sm:right-[calc(50%-240px)] md:right-[calc(50%-280px)] top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-0 disabled:pointer-events-none transition-all text-white"
      >
        <ChevronRight size={24} className="sm:w-8 sm:h-8" />
      </button>

      {/* Progress Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-xl">
        <span className="text-white/80 font-bold text-xs sm:text-sm font-mono tracking-widest">
          {activeIndex + 1} / {posts.length}
        </span>
      </div>

      {/* Card Stack Container */}
      {/* We push it slightly right (ml-8) so the left-stacking cards don't hit the screen edge on mobile */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[300px] sm:max-w-[340px] h-[460px] sm:h-[500px] ml-4 sm:ml-12 mt-[-40px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {posts.map((post, i) => {
          const isUnread = post._id && unreadIds.includes(post._id);
          const isExpanded = expandedId === post._id;

          let style = {};
          let classes = "absolute top-0 right-0 w-full h-full rounded-3xl flex flex-col transition-all duration-400 ease-out select-none border";

          const relativeIndex = activeIndex - i; // 0 is active, 1 is back stack, -1 is swiped away

          // Calculate stack depth math (Shifting Left, Scaling Down)
          if (relativeIndex === 0) {
            style = {
              transform: `translateX(${dragOffset}px) scale(1) translateY(0px)`,
              zIndex: 40,
              opacity: 1,
              boxShadow: '-10px 10px 40px rgba(0,0,0,0.6)'
            };
            classes += isUnread
              ? ' bg-[#1e3a8a] border-blue-400/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]'
              : ' bg-[#1e293b] border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]';

          } else if (relativeIndex === 1) {
            style = {
              transform: `translateX(calc(-15px + ${dragOffset * 0.5}px)) scale(0.95) translateY(10px)`,
              zIndex: 30,
              opacity: 1 - Math.abs(dragOffset) / 500,
              boxShadow: '-8px 8px 30px rgba(0,0,0,0.5)'
            };
            classes += isUnread
              ? ' bg-[#1e3a8a] border-blue-400/40'
              : ' bg-[#1e293b] border-white/15';

          } else if (relativeIndex === 2) {
            style = {
              transform: `translateX(calc(-30px + ${dragOffset * 0.25}px)) scale(0.90) translateY(20px)`,
              zIndex: 20,
              opacity: 0.8,
              boxShadow: '-6px 6px 20px rgba(0,0,0,0.4)'
            };
            classes += isUnread
              ? ' bg-[#1e3a8a] border-blue-400/30'
              : ' bg-[#1e293b] border-white/10';

          } else if (relativeIndex === 3) {
            style = {
              transform: `translateX(calc(-60px + ${dragOffset * 0.15}px)) scale(0.85) translateY(30px)`,
              zIndex: 10,
              opacity: 0.5,
              boxShadow: '-4px 4px 10px rgba(0,0,0,0.3)'
            };
            classes += ' bg-[#1e293b] border-white/5 pointer-events-none';

          } else if (relativeIndex < 0) {
            // Cards that have been swiped away (fly off to the right)
            style = {
              transform: `translateX(calc(150% + ${dragOffset}px)) scale(1.05) rotateY(15deg)`,
              zIndex: 50,
              opacity: 0,
              pointerEvents: 'none'
            };
            classes += ' bg-[#1e293b] border-white/10';

          } else {
            // Hidden cards deep in the stack
            style = {
              transform: `translateX(-80px) scale(0.8) translateY(40px)`,
              zIndex: 0,
              opacity: 0,
              pointerEvents: 'none'
            };
            classes += ' bg-[#161616]/20 border-transparent';
          }

          return (
            <div key={post._id || i} className={classes} style={style}>
              {isUnread && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse z-20 border border-blue-400 uppercase tracking-widest">
                  NEW
                </div>
              )}

              {/* Media Section */}
              {(post.media?.imageUrl || post.media?.videoUrl || post.media?.svgUrl) && (
                <div className="w-full h-48 sm:h-52 bg-black/50 border-b border-white/5 relative flex items-center justify-center overflow-hidden shrink-0 rounded-t-3xl pointer-events-none">
                  {post.media.videoUrl ? (
                    <video src={post.media.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : post.media.imageUrl ? (
                    <img src={post.media.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                  ) : post.media.svgUrl ? (
                    <img src={post.media.svgUrl} alt={post.title} className="w-full h-full object-contain p-6 drop-shadow-2xl" />
                  ) : null}
                </div>
              )}

              <div className="p-5 sm:p-6 flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <div className="flex flex-col gap-1.5 min-w-0 items-center text-center">
                  <h4 className="text-white font-bold text-lg sm:text-xl leading-snug max-w-[90%]">{post.title}</h4>
                  <span className="text-[10px] sm:text-xs text-blue-400 flex items-center justify-center gap-1.5 font-bold tracking-wider uppercase">
                    <Calendar size={12} className="opacity-70" /> {post.broadcastDate}
                  </span>
                </div>

                <div className="flex flex-col flex-1 mt-1">
                  <p className={`text-white/70 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-4' : ''}`}>
                    {post.content}
                  </p>
                  {post.content.length > 150 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : (post._id || null)); }}
                      className="text-blue-400 hover:text-white text-xs sm:text-sm font-bold self-start mt-3 transition-colors px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/30 rounded-lg border border-blue-500/20"
                    >
                      {isExpanded ? 'Show Less' : 'Read Full Update'}
                    </button>
                  )}
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                  <div className="flex items-center justify-end mt-4 pt-4 border-t border-white/10 gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors text-xs font-bold border border-white/5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (post._id) onDelete?.(post._id); }}
                      className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-xs font-bold border border-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

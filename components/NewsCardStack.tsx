'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Image as ImageIcon, Video, FileCode2, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import type { NewsPost } from './admin/AdminNewsManager';

export function getEmbedVideoUrl(url: string, isMuted: boolean = true): { type: 'iframe' | 'direct'; embedUrl: string } {
  if (!url) return { type: 'direct', embedUrl: '' };

  const trimmed = url.trim();

  // YouTube matchers (standard, share link, shorts, embeds)
  const ytRegExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = trimmed.match(ytRegExp);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'iframe',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&enablejsapi=1${isMuted ? '&mute=1' : '&mute=0'}`
    };
  }

  // Vimeo matchers
  const vimeoRegExp = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = trimmed.match(vimeoRegExp);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&controls=1${isMuted ? '&muted=1' : '&muted=0'}`
    };
  }

  // Check if it's a direct video file extension
  const isDirectVideoFile = Boolean(
    trimmed.match(/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i) ||
    trimmed.startsWith('data:video') ||
    trimmed.startsWith('blob:')
  );

  // Cloudinary player embed, Loom, Streamable, or any iframe embed page
  if (!isDirectVideoFile && (
    trimmed.includes('/embed') ||
    trimmed.includes('player.') ||
    trimmed.includes('cloudinary') ||
    trimmed.includes('loom.com') ||
    trimmed.includes('streamable.com') ||
    trimmed.includes('wistia.') ||
    trimmed.startsWith('http')
  )) {
    const hasParams = trimmed.includes('?');
    const separator = hasParams ? '&' : '?';

    // Strip out existing muted parameters
    let embedUrl = trimmed
      .replace(/([?&])muted=(true|false|1|0)/gi, '$1')
      .replace(/([?&])mute=(1|0)/gi, '$1')
      .replace(/&&/g, '&')
      .replace(/\?&/g, '?');

    if (isMuted) {
      embedUrl += `${separator}muted=true&mute=1&volume=0`;
    } else {
      embedUrl += `${separator}muted=false&mute=0&volume=1`;
    }

    return {
      type: 'iframe',
      embedUrl
    };
  }

  return { type: 'direct', embedUrl: trimmed };
}

interface NewsCardStackProps {
  posts: NewsPost[];
  unreadIds?: string[];
  onEdit?: (post: NewsPost) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
  isOpen?: boolean;
}

export default function NewsCardStack({ posts, unreadIds = [], onEdit, onDelete, isAdmin, isOpen = true }: NewsCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(posts.length > 0 ? posts.length - 1 : 0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset to last card if posts array changes
  useEffect(() => {
    setActiveIndex(posts.length > 0 ? posts.length - 1 : 0);
  }, [posts.length]);

  // Swipe mechanics with vertical scroll protection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwipingHorizontal = useRef<boolean | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Content vertical drag-to-scroll state
  const isContentDragging = useRef(false);
  const contentStartY = useRef(0);
  const contentStartScrollTop = useRef(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ('button' in e && e.button !== 0) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    isSwipingHorizontal.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - touchStartX.current;
    const diffY = clientY - touchStartY.current;

    // Detect direction lock
    if (isSwipingHorizontal.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          isSwipingHorizontal.current = true;
        } else {
          isSwipingHorizontal.current = false;
        }
      }
    }

    if (isSwipingHorizontal.current === true) {
      if ((activeIndex === 0 && diffX > 0) || (activeIndex === posts.length - 1 && diffX < 0)) {
        setDragOffset(diffX * 0.2);
      } else {
        setDragOffset(diffX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isSwipingHorizontal.current === true) {
      if (dragOffset > 75 && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
        setExpandedId(null);
      } else if (dragOffset < -75 && activeIndex < posts.length - 1) {
        setActiveIndex(prev => prev + 1);
        setExpandedId(null);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwipingHorizontal.current = null;
    setDragOffset(0);
  };

  // Content vertical drag-to-scroll handlers
  const handleContentMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isContentDragging.current = true;
    contentStartY.current = e.clientY;
    contentStartScrollTop.current = e.currentTarget.scrollTop;
  };

  const handleContentMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isContentDragging.current) return;
    const deltaY = e.clientY - contentStartY.current;
    e.currentTarget.scrollTop = contentStartScrollTop.current - deltaY;
  };

  const handleContentMouseUp = () => {
    isContentDragging.current = false;
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

  if (!isOpen || posts.length === 0) return null;

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
      <div
        ref={containerRef}
        className="relative w-full max-w-[300px] sm:max-w-[340px] h-[460px] sm:h-[500px] ml-4 sm:ml-12 mt-[-40px] touch-pan-y"
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
          let classes = "absolute top-0 right-0 w-full h-full rounded-3xl flex flex-col transition-all duration-400 ease-out border overflow-hidden select-none bg-[#18181b]";

          const relativeIndex = activeIndex - i;

          if (relativeIndex === 0) {
            style = {
              transform: `translateX(${dragOffset}px) scale(1) translateY(0px)`,
              zIndex: 40,
              opacity: 1,
              boxShadow: '-10px 10px 40px rgba(0,0,0,0.7)'
            };
            classes += isUnread
              ? ' border-blue-400/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]'
              : ' border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]';

          } else if (relativeIndex === 1) {
            style = {
              transform: `translateX(calc(-15px + ${dragOffset * 0.5}px)) scale(0.95) translateY(10px)`,
              zIndex: 30,
              opacity: 1 - Math.abs(dragOffset) / 500,
              boxShadow: '-8px 8px 30px rgba(0,0,0,0.5)'
            };
            classes += isUnread
              ? ' border-blue-400/40'
              : ' border-white/15';

          } else if (relativeIndex === 2) {
            style = {
              transform: `translateX(calc(-30px + ${dragOffset * 0.25}px)) scale(0.90) translateY(20px)`,
              zIndex: 20,
              opacity: 0.8,
              boxShadow: '-6px 6px 20px rgba(0,0,0,0.4)'
            };
            classes += isUnread
              ? ' border-blue-400/30'
              : ' border-white/10';

          } else if (relativeIndex === 3) {
            style = {
              transform: `translateX(calc(-60px + ${dragOffset * 0.15}px)) scale(0.85) translateY(30px)`,
              zIndex: 10,
              opacity: 0.5,
              boxShadow: '-4px 4px 10px rgba(0,0,0,0.3)'
            };
            classes += ' border-white/5 pointer-events-none';

          } else if (relativeIndex < 0) {
            style = {
              transform: `translateX(calc(150% + ${dragOffset}px)) scale(1.05) rotateY(15deg)`,
              zIndex: 50,
              opacity: 0,
              pointerEvents: 'none'
            };
            classes += ' border-white/10';

          } else {
            style = {
              transform: `translateX(-80px) scale(0.8) translateY(40px)`,
              zIndex: 0,
              opacity: 0,
              pointerEvents: 'none'
            };
            classes += ' border-transparent';
          }

          const videoSrc = post.media?.videoUrl || (
            post.media?.imageUrl && (
              post.media.imageUrl.includes('youtube.com') ||
              post.media.imageUrl.includes('youtu.be') ||
              post.media.imageUrl.includes('cloudinary.com') ||
              post.media.imageUrl.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i)
            ) ? post.media.imageUrl : null
          );

          const hasMedia = Boolean(post.media?.imageUrl || post.media?.videoUrl || post.media?.svgUrl);

          return (
            <div key={post._id || i} className={classes} style={style}>
              {isUnread && (
                <div className="absolute top-3 left-3 bg-blue-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse z-30 border border-blue-400 uppercase tracking-widest pointer-events-none">
                  NEW
                </div>
              )}

              {/* Video Overlay Controls (Mute/Unmute & Expand) */}
              {videoSrc && relativeIndex === 0 && (
                <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="p-2 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full text-white transition-all border border-white/20 shadow-lg active:scale-95 flex items-center gap-1.5"
                    title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                  >
                    {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-green-400" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:inline">{isMuted ? 'Muted' : 'Sound'}</span>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); setFullscreenVideo(videoSrc); }}
                    className="p-2 bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md rounded-full text-white transition-all border border-blue-400/30 shadow-lg active:scale-95 flex items-center gap-1.5"
                    title="Watch Full Video"
                  >
                    <Maximize2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:inline">Expand</span>
                  </button>
                </div>
              )}

              {/* Media Section: Top of Card (Transparent Corners & Seamless Aspect) */}
              {hasMedia && (
                <div className="absolute top-0 left-0 w-full h-[52%] sm:h-[55%] z-0 overflow-hidden rounded-t-3xl bg-transparent">
                  {(() => {
                    if (videoSrc) {
                      if (relativeIndex !== 0) {
                        return (
                          <div className="w-full h-full bg-transparent flex items-center justify-center">
                            <Video size={36} className="text-white/20" />
                          </div>
                        );
                      }

                      const parsed = getEmbedVideoUrl(videoSrc, isMuted);
                      if (parsed.type === 'iframe') {
                        return (
                          <iframe
                            key={`${videoSrc}-${isMuted}`}
                            src={parsed.embedUrl}
                            title={post.title}
                            className="w-full h-full border-0 object-cover rounded-t-3xl bg-transparent"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      }
                      return (
                        <video
                          key={`${videoSrc}-${isMuted}`}
                          ref={(el) => { if (el) el.muted = isMuted; }}
                          src={parsed.embedUrl}
                          controls
                          autoPlay
                          loop
                          muted={isMuted}
                          playsInline
                          className="w-full h-full object-cover rounded-t-3xl bg-transparent"
                        />
                      );
                    }

                    if (post.media?.imageUrl) {
                      return <img src={post.media.imageUrl} alt={post.title} className="w-full h-full object-cover rounded-t-3xl" />;
                    }

                    if (post.media?.svgUrl) {
                      return <img src={post.media.svgUrl} alt={post.title} className="w-full h-full object-contain p-6 drop-shadow-2xl" />;
                    }

                    return null;
                  })()}

                  {/* Gradient Transition onto bottom text */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#18181b] via-[#18181b]/80 to-transparent z-10 pointer-events-none" />
                </div>
              )}

              {/* Content Section: Placed below top media with hidden scrollbar & drag to scroll */}
              <div
                className={`p-4 sm:p-5 flex flex-col flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-20 touch-pan-y text-white cursor-grab active:cursor-grabbing ${hasMedia ? 'mt-[50%]' : ''}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleContentMouseDown(e);
                }}
                onMouseMove={handleContentMouseMove}
                onMouseUp={handleContentMouseUp}
                onMouseLeave={handleContentMouseUp}
              >
                <div className="flex flex-col gap-2.5 mt-auto">
                  <div className="flex flex-col gap-1 min-w-0 items-start text-left">
                    <h4 className="text-white font-black text-base sm:text-lg leading-snug max-w-[95%] drop-shadow-lg">
                      {post.title}
                    </h4>
                    <span className="text-[10px] sm:text-xs text-blue-400 flex items-center gap-1.5 font-bold tracking-wider uppercase drop-shadow-md">
                      <Calendar size={12} className="opacity-80" /> {post.broadcastDate}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <p className={`text-white/90 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap drop-shadow-md font-medium ${!isExpanded ? 'line-clamp-4' : ''}`}>
                      {post.content}
                    </p>
                    {post.content.length > 140 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : (post._id || null)); }}
                        className="text-blue-300 hover:text-white text-xs font-bold self-start mt-2 transition-colors px-3 py-1 bg-blue-500/25 hover:bg-blue-500/40 rounded-xl border border-blue-400/30 backdrop-blur-md shadow-lg"
                      >
                        {isExpanded ? 'Show Less' : 'Read Full Update'}
                      </button>
                    )}
                  </div>

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-white/15 gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs font-bold border border-white/10 backdrop-blur-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (post._id) onDelete?.(post._id); }}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-colors text-xs font-bold border border-red-500/30 backdrop-blur-md"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Video Overlay Modal */}
      {fullscreenVideo && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setFullscreenVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button Floating */}
            <button
              onClick={() => setFullscreenVideo(null)}
              className="absolute -top-10 right-0 z-50 p-2 text-white/80 hover:text-white transition-colors flex items-center gap-1 font-bold text-xs tracking-wider cursor-pointer bg-black/40 hover:bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20"
            >
              <X size={16} />
              <span>CLOSE</span>
            </button>

            {/* Video Container - Pure Aspect-Video without Black Letterbox Bars */}
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-transparent flex items-center justify-center">
              {(() => {
                const parsed = getEmbedVideoUrl(fullscreenVideo, false);
                if (parsed.type === 'iframe') {
                  return (
                    <iframe
                      src={parsed.embedUrl}
                      title="Fullscreen Video"
                      className="w-full h-full border-0 aspect-video rounded-2xl bg-transparent"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <video
                    ref={(el) => { if (el) el.muted = false; }}
                    src={parsed.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain rounded-2xl bg-transparent"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

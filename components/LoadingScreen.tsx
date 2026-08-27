"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, WifiOff, Sparkles, Zap, ExternalLink } from 'lucide-react';
import { setBypassCloudSync, useDashboardStore } from '@/store/dashboardStore';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Connecting to Workspace...');
  const [isOnline, setIsOnline] = useState(true);

  const _hasHydrated = useDashboardStore((state) => state._hasHydrated);

  useEffect(() => {
    const checkOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(checkOnline);

    if (!checkOnline) {
      setProgress(100);
      setStatusText('Offline Mode — Loading Local Workspace...');
      setBypassCloudSync(true);
      return;
    }

    // Dynamic progress while waiting for cloud response
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Authenticating & Loading Profile...');
    }, 300);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Decrypting Workspace & Timetable...');
    }, 700);

    const timer3 = setTimeout(() => {
      setProgress(85);
      setStatusText('Synchronizing Cloud Data...');
    }, 1400);

    // If network is slow and sync takes longer than 2.2 seconds, inform user
    const timerSlow = setTimeout(() => {
      if (!_hasHydrated) {
        setStatusText('Slow Connection — Synchronizing Cloud Data...');
      }
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerSlow);
    };
  }, []);

  // When store hydration succeeds, complete progress bar
  useEffect(() => {
    if (_hasHydrated) {
      setProgress(100);
      setStatusText('Workspace Ready!');
    }
  }, [_hasHydrated]);

  const handleLoadOffline = () => {
    setProgress(100);
    setStatusText('Loading Offline Instantly...');
    setBypassCloudSync(true);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[99999] flex flex-col items-center justify-center text-white font-sans overflow-hidden opacity-100 pointer-events-auto">
      <style>{`
        @keyframes flip3D {
          0% { transform: perspective(400px) rotateY(0deg); }
          50% { transform: perspective(400px) rotateY(180deg); }
          100% { transform: perspective(400px) rotateY(360deg); }
        }
        .animate-flip-3d {
          display: inline-block;
          animation: flip3D 2.5s infinite ease-in-out;
          transform-style: preserve-3d;
        }
      `}</style>

      {/* BACKGROUND GRAPHICS */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-purple-950/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* CONTENT CONTAINER */}
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center justify-between h-[85vh] py-8">
        
        {/* TOP BRANDING & TEXT */}
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <div className="relative mb-6 flex flex-col items-center">
            {/* Logo Wrapper */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-in zoom-in duration-700 mb-4 overflow-hidden">
              <img
                src="/icon.png"
                alt="Grind Board Logo"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/icon-192x192.png' }}
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both w-full">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                Grind Board
              </h1>

              {isOnline ? (
                <div className="text-[10px] md:text-xs font-mono font-bold text-blue-400 mb-6 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 inline-flex items-center gap-2 shadow-sm">
                  <div className="animate-flip-3d flex items-center justify-center">
                    <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span>Cloud Sync Enabled</span>
                </div>
              ) : (
                <div className="text-[10px] md:text-xs font-mono font-bold text-amber-400 mb-6 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 inline-flex items-center gap-2 shadow-sm">
                  <div className="animate-flip-3d flex items-center justify-center">
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span>Offline Mode</span>
                </div>
              )}

              <p className="text-xs md:text-sm text-white/80 leading-relaxed max-w-lg mx-auto font-sans">
                "Built to eliminate distractions and create a single, unified workspace. Everything you need to stay deeply focused, plan your day, and track your goals — created with a vision to clear all mental clutter, reclaim deep focus, and empower every single day with structure, clarity, and relentless drive."
              </p>

              <div className="mt-5 flex flex-col items-center justify-center gap-2 w-fit mx-auto animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold text-rose-200 bg-rose-500/10 border border-rose-500/25 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-md">
                  <span>Made with</span>
                  <span className="text-rose-500 animate-pulse text-sm sm:text-base">❤️</span>
                  <span>by <strong className="text-white font-extrabold tracking-wide">Anand</strong></span>
                </div>

                <a
                  href="https://github.com/anandgonaboyina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] md:text-xs font-mono font-bold text-sky-300/90 hover:text-sky-100 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 px-3 py-1 rounded-full transition-all hover:scale-105 shadow-sm group"
                  title="Visit Anand's GitHub Profile"
                >
                  <svg className="w-3.5 h-3.5 fill-sky-400 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>github.com/anandgonaboyina</span>
                  <ExternalLink className="w-3 h-3 text-sky-400 opacity-70 group-hover:opacity-100" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS LOADING BAR SECTION */}
        <div className="w-full max-w-md flex flex-col items-center pb-8 animate-in fade-in duration-1000 delay-500 fill-mode-both">
          {/* Progress Header Info */}
          <div className="w-full flex items-center justify-between text-xs font-mono font-semibold text-white/70 mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-sm animate-pulse shadow-md ${isOnline ? 'bg-blue-500 shadow-blue-500/80' : 'bg-amber-400 shadow-amber-400/80'}`} />
              <span className="text-[11px] md:text-xs text-blue-200/90 font-medium tracking-wide">
                {statusText}
              </span>
            </div>
            <span className="text-blue-400 font-bold text-xs">{progress}%</span>
          </div>

          {/* Glassmorphic Progress Bar */}
          <div className="w-full h-3 bg-slate-900/90 border border-white/15 rounded-full p-0.5 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                isOnline
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 shadow-[0_0_15px_rgba(59,130,246,0.8)]'
                  : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
              }`}
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer light effect inside progress fill */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>

          {/* INSTANT OFFLINE LOAD BUTTON & CONNECTION NOTICE */}
          <div className="mt-4 flex flex-col items-center gap-1.5 w-full">
            <span className="text-[11px] text-amber-200/90 font-medium">
              No internet or bad connection? You can load offline instantly!
            </span>
            <button
              onClick={handleLoadOffline}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 backdrop-blur-md cursor-pointer group"
              title="Skip waiting for online cloud sync and load instantly from local cache"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span>Load Offline Instantly</span>
            </button>
          </div>

          {/* Sync indicator subtext */}
          <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono mt-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> AES-256 Encrypted
            </span>
            <span className="flex items-center gap-1">
              {isOnline ? (
                <>
                  <div className="animate-flip-3d flex items-center justify-center">
                    <Wifi className="w-3 h-3 text-blue-400" />
                  </div>
                  <span>Cloud Syncing</span>
                </>
              ) : (
                <>
                  <div className="animate-flip-3d flex items-center justify-center">
                    <WifiOff className="w-3 h-3 text-amber-400" />
                  </div>
                  <span>Offline Local Cache</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

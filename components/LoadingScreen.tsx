"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, WifiOff, Zap, ExternalLink, Quote } from 'lucide-react';
import { setBypassCloudSync, setAbortInstantLoad, useDashboardStore } from '@/store/dashboardStore';

interface LoadingScreenProps {
  onFinished?: () => void;
}

export default function LoadingScreen({ onFinished }: LoadingScreenProps) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Connecting to Workspace...');
  const [isOnline, setIsOnline] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const _hasHydrated = useDashboardStore((state) => state._hasHydrated);
  const initialHydratedRef = React.useRef(useDashboardStore.getState()._hasHydrated);

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
      if (!useDashboardStore.getState()._hasHydrated) {
        setStatusText('Slow Connection — Synchronizing Cloud Data...');
      }
    }, 2200);

    // Guaranteed fallback: If sync/hydration is stalled after 3.5s, load local workspace automatically
    const timerSafety = setTimeout(() => {
      if (!useDashboardStore.getState()._hasHydrated) {
        console.warn("Hydration safety trigger activated: bypassing cloud hang.");
        setBypassCloudSync(true);
        useDashboardStore.getState().setHasHydrated(true);
      }
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerSlow);
      clearTimeout(timerSafety);
    };
  }, []);

  // When store hydration succeeds, complete progress bar & trigger smooth fade-out after settlement
  useEffect(() => {
    if (_hasHydrated) {
      setProgress(100);
      setStatusText('Workspace Ready!');

      const settlementDelay = initialHydratedRef.current ? 50 : 150;

      const timerFade = setTimeout(() => {
        setIsFadingOut(true);
      }, settlementDelay);

      const timerUnmount = setTimeout(() => {
        setIsDone(true);
        if (onFinished) onFinished();
      }, settlementDelay + 300);

      return () => {
        clearTimeout(timerFade);
        clearTimeout(timerUnmount);
      };
    }
  }, [_hasHydrated, onFinished]);

  const handleLoadOffline = () => {
    // Signal the in-flight getItem to abort the cloud fetch immediately
    setAbortInstantLoad(true);
    setBypassCloudSync(true);
    setProgress(100);
    setStatusText('Loading Offline Instantly...');
    // Give one tick for abortInstantLoad to be read, then force hydration
    setTimeout(() => {
      useDashboardStore.getState().setHasHydrated(true);
    }, 50);
  };

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 h-[100dvh] w-screen bg-[#06060e] z-[99999] flex flex-col justify-between p-5 sm:p-8 md:p-12 text-white font-sans overflow-hidden select-none transition-opacity duration-300 ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
    >
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
        @keyframes shimmerSlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer-slow {
          animation: shimmerSlow 2.5s infinite linear;
        }
      `}</style>

      {/* FULL-SCREEN BACKGROUND LIGHTING & GRADIENTS */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/25 via-indigo-950/15 to-purple-950/30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. TOP HEADER BAR */}
      <header className="relative z-10 w-full flex items-center justify-between">
        {/* AES Encryption Badge */}
        <div className="flex items-center gap-1.5 text-[9px] sm:text-xs font-mono font-semibold text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full backdrop-blur-md shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tracking-wide"><pre>AES-256 Encrypted</pre></span>
        </div>

        {/* Sync Mode Badge */}
        {isOnline ? (
          <div className="text-[9px] sm:text-xs font-mono font-bold text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 inline-flex items-center gap-2 shadow-sm backdrop-blur-md">
            <div className="animate-flip-3d flex items-center justify-center">
              <Wifi className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span><pre>Cloud Sync Enabled</pre>
            </span>
          </div>
        ) : (
          <div className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 inline-flex items-center gap-2 shadow-sm backdrop-blur-md">
            <div className="animate-flip-3d flex items-center justify-center">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span>Offline Mode</span>
          </div>
        )}
      </header>

      {/* 2. CENTERPIECE HERO */}
      <main className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center my-auto px-2">
        {/* Glowing Logo Container */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 p-0.5 shadow-[0_0_50px_rgba(59,130,246,0.4)] overflow-hidden">
            <img
              src="/icon.png"
              alt="Grind Board Logo"
              className="w-full h-full object-cover rounded-[22px]"
              onError={(e) => { e.currentTarget.src = '/icon-192x192.png' }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent drop-shadow-md">
          Grind Board
        </h1>

        {/* Vision Statement */}
        <div className="relative max-w-xl mx-auto mb-6 px-4">
          <Quote className="w-4 h-4 text-blue-400/40 absolute -top-2 -left-1 rotate-180 hidden sm:block" />
          <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed font-sans italic drop-shadow-sm">
            "Built to eliminate distractions and create a single, unified workspace. Everything you need to stay deeply focused, plan your day, and track your goals — created with a vision to clear all mental clutter and empower every single day."
          </p>
        </div>

        {/* Creator Attribution & GitHub Pill Row (Visible on Mobile here) */}
        <div className="flex md:hidden flex-wrap items-center justify-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-200 bg-rose-500/10 border border-rose-500/25 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md">
            <span>Made with</span>
            <span className="text-rose-500 animate-pulse text-sm">❤️</span>
            <span>by <strong className="text-white font-extrabold tracking-wide">Anand</strong></span>
          </div>

          <a
            href="https://github.com/anandgonaboyina"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 px-3.5 py-1.5 rounded-full transition-all hover:scale-105 shadow-sm group"
            title="Visit Anand's GitHub Profile"
          >
            <svg className="w-3.5 h-3.5 fill-sky-400 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>github.com/anandgonaboyina</span>
            <ExternalLink className="w-3 h-3 text-sky-400 opacity-70 group-hover:opacity-100" />
          </a>
        </div>
      </main>

      {/* 3. FULL-WIDTH BOTTOM PROGRESS & OFFLINE CONTROLS */}
      <footer className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Creator Attribution & GitHub Pill Row (Visible on Desktop here above the loading status text) */}
        <div className="hidden md:flex items-center justify-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-200 bg-rose-500/10 border border-rose-500/25 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md">
            <span>Made with</span>
            <span className="text-rose-500 animate-pulse text-sm">❤️</span>
            <span>by <strong className="text-white font-extrabold tracking-wide">Anand</strong></span>
          </div>

          <a
            href="https://github.com/anandgonaboyina"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 px-3.5 py-1.5 rounded-full transition-all hover:scale-105 shadow-sm group"
            title="Visit Anand's GitHub Profile"
          >
            <svg className="w-3.5 h-3.5 fill-sky-400 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>github.com/anandgonaboyina</span>
            <ExternalLink className="w-3 h-3 text-sky-400 opacity-70 group-hover:opacity-100" />
          </a>
        </div>

        {/* Status Text & Percentage */}
        <div className="w-full flex items-center justify-between text-xs font-mono font-semibold text-white/80 mb-2 px-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse shadow-md ${isOnline ? 'bg-blue-400 shadow-blue-500/80' : 'bg-amber-400 shadow-amber-400/80'}`} />
            <span className="text-xs sm:text-sm text-blue-200/90 font-medium tracking-wide truncate">
              {statusText}
            </span>
          </div>
          <span className="text-blue-400 font-bold text-xs sm:text-sm shrink-0 ml-2">{progress}%</span>
        </div>

        {/* Full-width Glass Progress Bar */}
        <div className="w-full h-3.5 bg-black/60 border border-white/15 rounded-full p-0.5 shadow-2xl backdrop-blur-md relative overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${isOnline
              ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.8)]'
              : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)]'
              }`}
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-slow" />
          </div>
        </div>

        {/* Instant Offline Button Bar */}
        <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2 sm:px-4 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-2 backdrop-blur-md shadow-sm">
          <span className="text-[11px] sm:text-xs text-amber-200/90 font-medium text-center sm:text-left">
            Slow network or taking time? Skip waiting and load instantly:
          </span>
          <button
            onClick={handleLoadOffline}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 group"
            title="Skip waiting for online cloud sync and load instantly from local cache"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
            <span>Load Offline Instantly</span>
          </button>
        </div>
      </footer>

    </div>
  );
}


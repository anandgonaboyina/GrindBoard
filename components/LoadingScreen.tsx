"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, WifiOff, Sparkles, Zap } from 'lucide-react';
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
        @keyframes profileFlip {
          0% { transform: perspective(600px) rotateY(90deg) scale(0.8); opacity: 0; }
          50% { transform: perspective(600px) rotateY(-10deg) scale(1.05); opacity: 1; }
          100% { transform: perspective(600px) rotateY(0deg) scale(1); opacity: 1; }
        }
        .profile-flip {
          animation: profileFlip 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      {/* Ambient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-500/15 rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between p-6 sm:p-8 text-center max-w-lg w-full h-full my-auto">
        <div className="flex flex-col items-center w-full min-h-[250px] justify-center my-auto">
          <div className="flex flex-col items-center animate-in fade-in duration-700 w-full">
            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-5 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl shadow-blue-500/30 profile-flip opacity-0">
              <img
                src="/icon-512x512.png"
                alt="Creator Profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/icon-192x192.png' }}
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both w-full">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                Grind Board
              </h1>

              {isOnline ? (
                <div className="text-[10px] md:text-xs font-mono font-bold text-blue-400 mb-6 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 inline-flex items-center gap-1.5 shadow-inner">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Cloud Sync Enabled</span>
                </div>
              ) : (
                <div className="text-[10px] md:text-xs font-mono font-bold text-amber-400 mb-6 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 inline-flex items-center gap-1.5 shadow-inner">
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline Mode</span>
                </div>
              )}

              <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                "Built to eliminate distractions and create a single, unified workspace.
                Everything you need to stay deeply focused, plan your day, and track your goals."
              </p>
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

          {/* INSTANT OFFLINE LOAD BUTTON */}
          <button
            onClick={handleLoadOffline}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 backdrop-blur-md cursor-pointer group"
            title="Skip waiting for online cloud sync and load instantly from local cache"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
            <span>Load Offline Instantly</span>
          </button>

          {/* Sync indicator subtext */}
          <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono mt-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> AES-256 Encrypted
            </span>
            <span className="flex items-center gap-1">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-blue-400" /> Cloud Syncing
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" /> Offline Local Cache
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

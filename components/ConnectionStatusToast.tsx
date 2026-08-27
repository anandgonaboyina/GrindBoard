'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2, XCircle } from 'lucide-react';

export default function ConnectionStatusToast() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(onlineStatus);
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3200);

    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app_sync_now'));
      }
      setTimeout(() => setIsVisible(false), 3200);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 3500);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isVisible || isOnline === null) return null;

  return (
    <div
      style={{ zIndex: 40 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
    >
      <style>{`
        @keyframes scale3DCard {
          0% { transform: perspective(800px) rotateX(25deg) scale(0.6); opacity: 0; }
          65% { transform: perspective(800px) rotateX(-6deg) scale(1.04); opacity: 1; }
          100% { transform: perspective(800px) rotateX(0deg) scale(1); opacity: 1; }
        }
        .animate-card-3d {
          animation: scale3DCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* 3D Scale-Up Floating Card - Transparent Outer Container */}
      <div className="animate-card-3d flex flex-col items-center justify-center p-4 text-center gap-3 transition-all">
        {/* Big Icon Centerpiece with Checkmark / Cross Badge */}
        <div className="relative flex items-center justify-center my-1">
          {/* Inner Glass Icon Container */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border backdrop-blur-xl shadow-2xl ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-emerald-500/30'
                : 'bg-red-950/40 border-red-500/40 text-red-400 shadow-red-500/30'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-10 h-10 animate-pulse text-emerald-400" />
            ) : (
              <WifiOff className="w-10 h-10 text-red-400" />
            )}
          </div>

          {/* Overlapping Tick / Cross Badge */}
          <div className="absolute -top-2 -right-2">
            {isOnline ? (
              <CheckCircle2
                className="w-8 h-8 text-emerald-400 fill-emerald-950 shadow-lg animate-bounce"
                style={{ animationDuration: '2s' }}
              />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 fill-red-950 shadow-lg" />
            )}
          </div>
        </div>

        {/* Text Details at Bottom */}
        <div className="flex flex-col items-center gap-1.5 relative z-10">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-lg">
            {isOnline ? 'Connected to Internet' : 'Offline Mode Active'}
          </h3>
          <span
            className={`text-[10px] font-mono font-bold uppercase px-3 py-0.5 rounded-full border backdrop-blur-md shadow-md ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}
          >
            {isOnline ? 'Online' : 'Offline — Not Connected'}
          </span>
        </div>
      </div>
    </div>
  );
}

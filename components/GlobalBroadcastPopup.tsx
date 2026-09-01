"use client";

import React, { useEffect, useState } from 'react';
import { Radio, X } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

export default function GlobalBroadcastPopup() {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const { dismissedBroadcasts, dismissBroadcast } = useDashboardStore();

  useEffect(() => {
    const fetchLatestBroadcast = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_IS_LOCAL === 'true' ? 'https://dashboard-cloud-nu.vercel.app' : '';
        const res = await fetch(`${apiUrl}/api/broadcasts`);
        const data = await res.json();
        
        if (res.ok && data.broadcasts && data.broadcasts.length > 0) {
          const latest = data.broadcasts[0];
          
          // Check if already dismissed in store
          if (!dismissedBroadcasts.includes(latest.id)) {
            setBroadcast(latest);
          }
        }
      } catch (err) {
        console.error('Failed to fetch broadcasts:', err);
      }
    };
    fetchLatestBroadcast();
  }, [dismissedBroadcasts]); // Re-run if dismissed list changes

  const handleDismiss = () => {
    if (!broadcast) return;
    dismissBroadcast(broadcast.id);
    setBroadcast(null);
  };

  if (!broadcast) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-black/80 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(236,72,153,0.15)] flex flex-col gap-2 min-w-[320px] max-w-md animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 shrink-0 border border-pink-500/30">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide">{broadcast.title}</h4>
            <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Developer Broadcast</span>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-white/40 hover:text-white p-1.5 transition-colors hover:bg-white/10 rounded-lg shrink-0"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="mt-1">
        <p className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap pl-[52px]">{broadcast.content}</p>
      </div>
    </div>
  );
}

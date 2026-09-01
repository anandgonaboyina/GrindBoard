"use client";

import React, { useEffect, useState } from 'react';
import { Users, X } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

export default function GroupRequestPopup() {
  const [pendingCount, setPendingCount] = useState(0);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkRequests = async () => {
      const token = localStorage.getItem('dashboard_sync_token');
      if (!token) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      try {
        const res = await fetch('/api/groups/requests', {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        });
        
        if (res.status === 401) {
          return;
        }
        
        const data = await res.json();

        if (res.ok && data.requests && data.requests.length > 0) {
          setPendingCount(data.requests.length);
          setTargetGroupId(data.requests[0].groupId);
          setIsVisible(true);
        }
      } catch (err) {
        // Silently ignore network errors
      }
    };

    // Check on load
    checkRequests();
  }, []);

  if (!isVisible || pendingCount === 0) return null;

  return (
    <div className="fixed top-28 right-4 md:top-24 md:right-6 z-[9999] bg-[#0f0f13]/95 backdrop-blur-xl border border-emerald-500/20 rounded-lg md:rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300 w-[calc(100vw-32px)] max-w-[240px] md:max-w-[320px]">

      {/* Sleek Glowing Left Accent Line */}
      <div className="w-[3px] md:w-1 bg-gradient-to-b from-emerald-400 to-teal-500 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />

      <div className="flex items-center gap-2 md:gap-3 p-1.5 md:p-3 w-full">
        {/* Compact Icon */}
        <div className="w-6 h-6 md:w-9 md:h-9 bg-emerald-500/10 rounded-md md:rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0 shadow-inner">
          <Users className="w-3 h-3 md:w-4 md:h-4 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white/95 font-bold text-[10px] md:text-sm leading-none truncate">Group Requests</h4>
          <p className="text-white/50 text-[8px] md:text-xs mt-0.5 md:mt-1 tracking-wide truncate">
            {pendingCount} pending request{pendingCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={() => {
              setIsVisible(false);
              const state = useDashboardStore.getState();
              state.setConnectInitialTab('groups');
              if (!state.isSettingsOpen) {
                state.toggleSettings();
              }
              window.dispatchEvent(new Event('open-connect'));
              if (targetGroupId) {
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('open-group-direct', { detail: { groupId: targetGroupId } }));
                }, 100);
              }
            }}
            className="bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-300 hover:text-white text-[9px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded md:rounded-md transition-all active:scale-95 shadow-sm"
          >
            View
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/30 hover:text-white bg-white/5 hover:bg-white/10 p-1 md:p-1.5 rounded md:rounded-md transition-colors active:scale-90"
            title="Dismiss"
          >
            <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

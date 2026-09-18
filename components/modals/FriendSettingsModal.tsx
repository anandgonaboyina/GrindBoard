'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';

interface FriendSettingsModalProps {
  friend: any | null;
  onClose: () => void;
  onToggleTaskSharing: (friendshipId: string, currentSharingState: any) => Promise<void>;
}

export default function FriendSettingsModal({ friend, onClose, onToggleTaskSharing }: FriendSettingsModalProps) {
  if (!friend || typeof document === 'undefined') {
    return null;
  }

  const getMyUserId = () => {
    try {
      const token = localStorage.getItem('dashboard_sync_token');
      if (token) {
        return JSON.parse(atob(token.split('.')[1])).userId;
      }
    } catch (e) {}
    return null;
  };

  const myUserId = getMyUserId();
  const isSharingTasks = myUserId && friend.taskSharing?.[myUserId] === true;

  return createPortal(
    <div
      className="fixed inset-0 z-[10006] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#12121a] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings size={16} className="text-blue-400" /> Friendship Settings
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-white/60 mb-6">
          Manage what <strong className="text-white">{friend.user?.username}</strong> can see on your profile.
        </p>

        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white/90">Share Tasks</span>
            <span className="text-[10px] text-white/50">Allow them to view your daily tasks</span>
          </div>
          <button
            onClick={() => onToggleTaskSharing(friend.id, friend.taskSharing)}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              isSharingTasks ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                isSharingTasks ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Timetable from '@/components/Timetable';
import { useDashboardStore } from '@/store/dashboardStore';

interface FriendTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendTimetableModal({ isOpen, onClose }: FriendTimetableModalProps) {
  const viewingFriend = useDashboardStore((state) => state.viewingFriend);

  if (!isOpen || !viewingFriend || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10005] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-2 sm:p-4"
      onClick={onClose}
    >
      
      <div
        className="w-full max-w-3xl relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 sm:-top-12 right-0 bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors text-white"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <Timetable />
      </div>
    </div>,
    document.body
  );
}


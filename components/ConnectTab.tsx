'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore, setAuthTransition } from '@/store/dashboardStore';
import { UserCircle, Users, Trophy, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ConnectGroupsTab from './connectTabSections/ConnectGroupsTab';

// Subcomponents
import AuthSection from './connectTabSections/AuthSection';
import ProfileTab from './connectTabSections/ProfileTab';
import FriendsTab from './connectTabSections/FriendsTab';
import LeaderboardTab from './connectTabSections/LeaderboardTab';

export default function ConnectTab() {
  const { connectInitialTab, setConnectInitialTab } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'leaderboard' | 'groups'>(connectInitialTab || 'profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  
  // Notification Badges
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [groupRequestsCount, setGroupRequestsCount] = useState(0);

  // Global Modals
  const [selectedImageOverlay, setSelectedImageOverlay] = useState<{ url: string; title: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: React.ReactNode; requireText?: string;
    isDestructive?: boolean; confirmText?: string; hideCancel?: boolean; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const token = localStorage.getItem('dashboard_sync_token');
    const storedUsername = localStorage.getItem('dashboard_username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }

    const handleOpenLeaderboard = () => setActiveTab('leaderboard');
    window.addEventListener('open-leaderboard', handleOpenLeaderboard);

    const handleGroupRequestsUpdate = (e: any) => setGroupRequestsCount(e.detail);
    window.addEventListener('group-requests-updated', handleGroupRequestsUpdate);

    return () => {
      window.removeEventListener('open-leaderboard', handleOpenLeaderboard);
      window.removeEventListener('group-requests-updated', handleGroupRequestsUpdate);
    };
  }, []);

  useEffect(() => {
    if (connectInitialTab) {
      setActiveTab(connectInitialTab);
      const timer = setTimeout(() => setConnectInitialTab(undefined), 500);
      return () => { clearTimeout(timer); setConnectInitialTab(undefined); };
    }
  }, [connectInitialTab, setConnectInitialTab]);

  const handleLogout = async () => {
    setAuthTransition(true);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dashboard')) localStorage.removeItem(key);
    });
    localStorage.removeItem('stopwatch_paused_secs');
    localStorage.removeItem('stopwatch_last_active');

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: null })
    }).catch(console.error);

    window.location.href = '/';
  };

  if (!isLoggedIn) {
    return <AuthSection />;
  }

  return (
    <div className="flex flex-col w-full h-full max-h-[80vh] min-w-0 relative max-w-lg mx-auto pt-2 px-2">
{/* Pinned sticky Navbar */}
      <div className="sticky top-0 z-30 flex justify-between items-center bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full p-1 mb-2 shadow-xl shadow-black/40 w-full shrink-0 ring-1 ring-white/5 relative">
        
        {/* Animated Sliding Background Pill */}
        <div className="absolute inset-y-1 left-1 right-1 pointer-events-none z-0">
          <div 
            className={`h-full w-1/4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-transform duration-500 ease-out
              ${activeTab === 'profile' ? 'translate-x-0' : ''}
              ${activeTab === 'friends' ? 'translate-x-full' : ''}
              ${activeTab === 'leaderboard' ? 'translate-x-[200%]' : ''}
              ${activeTab === 'groups' ? 'translate-x-[300%]' : ''}
            `}
          />
        </div>

        <button onClick={() => setActiveTab('profile')} className={`group relative z-10 flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-colors duration-300 ${activeTab === 'profile' ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <UserCircle size={16} className={`transition-transform duration-300 ${activeTab === 'profile' ? 'scale-110 drop-shadow-md' : 'group-hover:-translate-y-0.5'}`} />
          <span className="text-[9px] font-bold tracking-wide">Profile</span>
        </button>

        <button onClick={() => setActiveTab('friends')} className={`group relative z-10 flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-colors duration-300 ${activeTab === 'friends' ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Users size={16} className={`transition-transform duration-300 ${activeTab === 'friends' ? 'scale-110 drop-shadow-md' : 'group-hover:-translate-y-0.5'}`} />
          <span className="text-[9px] font-bold tracking-wide">Friends</span>
          {pendingRequestsCount > 0 && (
            <span className="absolute top-1 right-3 sm:right-6 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(225,29,72,0.6)] border border-white/20 animate-in zoom-in duration-300">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button onClick={() => setActiveTab('leaderboard')} className={`group relative z-10 flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-colors duration-300 ${activeTab === 'leaderboard' ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Trophy size={16} className={`transition-transform duration-300 ${activeTab === 'leaderboard' ? 'scale-110 drop-shadow-md' : 'group-hover:-translate-y-0.5'}`} />
          <span className="text-[9px] font-bold tracking-wide">Ranks</span>
        </button>

        <button onClick={() => setActiveTab('groups')} className={`group relative z-10 flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-colors duration-300 ${activeTab === 'groups' ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
          <Users size={16} className={`transition-transform duration-300 ${activeTab === 'groups' ? 'scale-110 drop-shadow-md' : 'group-hover:-translate-y-0.5'}`} />
          <span className="text-[9px] font-bold tracking-wide">Groups</span>
          {groupRequestsCount > 0 && (
            <span className="absolute top-1 right-3 sm:right-6 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(225,29,72,0.6)] border border-white/20 animate-in zoom-in duration-300">
              {groupRequestsCount}
            </span>
          )}
        </button>
        
      </div>

{/* Dynamic Tab Rendering (Using CSS Hiding to prevent re-fetching) */}
      <div className={activeTab === 'profile' ? 'contents' : 'hidden'}>
        <ProfileTab username={username} handleLogout={handleLogout} setConfirmModal={setConfirmModal} setSelectedImageOverlay={setSelectedImageOverlay} />
      </div>

      <div className={activeTab === 'friends' ? 'contents' : 'hidden'}>
        <FriendsTab setPendingRequestsCount={setPendingRequestsCount} setConfirmModal={setConfirmModal} />
      </div>

      <div className={activeTab === 'leaderboard' ? 'contents' : 'hidden'}>
        <LeaderboardTab setSelectedImageOverlay={setSelectedImageOverlay} />
      </div>

      <div className={activeTab === 'groups' ? 'contents' : 'hidden'}>
        <ConnectGroupsTab />
      </div>
      <ConfirmationModal
        {...confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {selectedImageOverlay && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedImageOverlay(null)}>
          <div className="relative max-w-sm sm:max-w-md w-full bg-gray-900/95 border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col items-center overflow-hidden gap-3" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImageOverlay(null)} className="absolute top-3 right-3 text-white/70 hover:text-white p-1.5 bg-black/50 hover:bg-black/80 rounded-full transition-colors z-10 border border-white/10">
              <X className="w-4 h-4" />
            </button>
            <div className="w-full max-h-[65vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-white/10 p-1">
              <img src={selectedImageOverlay.url} alt={selectedImageOverlay.title} className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-white tracking-wide">{selectedImageOverlay.title}</h4>
          </div>
        </div>
      )}
    </div>
  );
}
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
      <div className="sticky top-0 z-30 flex justify-between items-center bg-black/90 backdrop-blur-xl border border-white/10 rounded-full p-1 mb-2 shadow-lg w-full shrink-0">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'profile' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}>
          <UserCircle size={16} />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
        <button onClick={() => setActiveTab('friends')} className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'friends' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}>
          <Users size={16} />
          <span className="text-[9px] font-bold">Friends</span>
          {pendingRequestsCount > 0 && (
            <span className="absolute top-1 right-3 sm:right-6 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full shadow-md">
              {pendingRequestsCount}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'leaderboard' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}>
          <Trophy size={16} />
          <span className="text-[9px] font-bold">Ranks</span>
        </button>
        <button onClick={() => setActiveTab('groups')} className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'groups' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}>
          <Users size={16} />
          <span className="text-[9px] font-bold">Groups</span>
          {groupRequestsCount > 0 && (
            <span className="absolute top-1 right-3 sm:right-6 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full shadow-md">
              {groupRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Dynamic Tab Rendering */}
      {activeTab === 'profile' && <ProfileTab username={username} handleLogout={handleLogout} setConfirmModal={setConfirmModal} setSelectedImageOverlay={setSelectedImageOverlay} />}
      {activeTab === 'friends' && <FriendsTab setPendingRequestsCount={setPendingRequestsCount} setConfirmModal={setConfirmModal} />}
      {activeTab === 'leaderboard' && <LeaderboardTab setSelectedImageOverlay={setSelectedImageOverlay} />}
      {activeTab === 'groups' && <ConnectGroupsTab />}

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
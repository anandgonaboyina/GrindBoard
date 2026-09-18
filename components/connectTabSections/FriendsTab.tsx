'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Search, RefreshCw, BarChart2, Check, X, Calendar, Settings, Sparkles, Users, UserPlus, UserX } from 'lucide-react';
import { createPortal } from 'react-dom';
import Timetable from '../Timetable'; // Adjust import paths
import FriendTimetableModal from '../modals/FriendTimetableModal';
import FriendTasksModal from '../modals/FriendTasksModal';
import FriendSettingsModal from '../modals/FriendSettingsModal';

interface FriendsTabProps {
  setPendingRequestsCount: (count: number) => void;
  setConfirmModal: (modal: any) => void;
}

function FriendsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 w-full py-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 via-blue-900/30 to-purple-950/40 border border-blue-500/30 shadow-md relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center animate-pulse">
              <Users className="w-4 h-4 text-blue-400 animate-bounce" />
            </div>
            <div className="absolute -inset-1 rounded-full border border-blue-400/40 border-t-blue-400 animate-spin" style={{ animationDuration: '2.5s' }}></div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-200 tracking-wide">Syncing Friends</span>
              <Sparkles className="w-3 h-3 text-blue-300 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="h-2 w-28 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 opacity-70">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30"></div>
              <div className="flex flex-col gap-1">
                <div className="h-2.5 w-20 bg-white/20 rounded"></div>
                <div className="h-2 w-28 bg-white/10 rounded"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-white/10 rounded-md"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FriendsSearchLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 w-full py-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-center gap-2 py-3 text-indigo-300 text-xs font-bold animate-pulse bg-indigo-950/20 rounded-xl border border-indigo-500/20">
        <Search className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '2s' }} />
        <span>Searching User Directory...</span>
        <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="p-2 rounded-lg bg-black/40 border border-white/10 animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10"></div>
            <div className="h-2.5 w-24 bg-white/20 rounded"></div>
          </div>
          <div className="h-5 w-12 bg-blue-500/20 rounded"></div>
        </div>
      ))}
    </div>
  );
}

function EmptyFriendsState() {
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-5 rounded-2xl bg-gradient-to-b from-indigo-950/30 via-black/40 to-black/60 border border-indigo-500/25 text-center shadow-lg relative overflow-hidden my-2 group">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500"></div>

      <div className="relative mb-2.5 flex items-center justify-center">
        <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-400/35 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)] animate-pulse">
          <UserPlus className="w-5 h-5 text-indigo-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-purple-300 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      <h4 className="text-xs md:text-sm font-bold text-white tracking-wide mb-1 flex items-center justify-center gap-1.5">
        Connect & Study Together!
      </h4>
      <p className="text-[10px] md:text-xs text-white/60 max-w-xs leading-relaxed mb-3">
        You haven't added any friends yet. Add friends to share daily task lists, view timetables, and compare focus stats!
      </p>

      <div className="flex flex-col gap-1.5 w-full max-w-xs bg-black/40 p-2.5 rounded-xl border border-white/5 text-[9.5px] md:text-[10.5px] text-white/70 text-left">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[9px] flex items-center justify-center shrink-0 border border-blue-500/30">1</span>
          <span>Use the <strong>"Find with User Name/Alias Name"</strong> box below to search.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[9px] flex items-center justify-center shrink-0 border border-purple-500/30">2</span>
          <span>Click <strong>"Add Friend"</strong> to send a connection request.</span>
        </div>
      </div>
    </div>
  );
}

function EmptyFriendSearchState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/40 border border-white/10 text-center my-1">
      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-1.5 shadow-inner">
        <UserX className="w-4.5 h-4.5 text-white/40 animate-pulse" />
      </div>
      <h5 className="text-xs font-bold text-white/80">No User Found</h5>
      <p className="text-[10px] text-white/50 max-w-xs mt-0.5 leading-relaxed">
        No registered account matches "{query}". Please double-check the spelling of their username or alias.
      </p>
    </div>
  );
}

// ==========================================
//OPTIMIZATION: Wrapped in memo to prevent parent renders from trickling down
// ==========================================
const FriendsTab = memo(function FriendsTab({ setPendingRequestsCount, setConfirmModal }: FriendsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearchedFriends, setHasSearchedFriends] = useState(false);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const [isSearchingFriends, setIsSearchingFriends] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  
  const [loadingFriendAction, setLoadingFriendAction] = useState<{ friendId: string; type: 'tasks' | 'timetable' | 'stats' } | null>(null);
  const [sendingRequestUserId, setSendingRequestUserId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Modals state
  const [showFriendTimetable, setShowFriendTimetable] = useState(false);
  const [showFriendTasks, setShowFriendTasks] = useState(false);
  const [friendTaskTab, setFriendTaskTab] = useState<'today' | 'tomorrow'>('today');
  const [friendTaskGroupTab, setFriendTaskGroupTab] = useState<number>(0);
  const [friendSettingsModal, setFriendSettingsModal] = useState<any>(null);

  const fetchFriendsData = useCallback(async () => {
    setIsFriendsLoading(true);
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;
    try {
      const res = await fetch('/api/friends', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setFriends((data.acceptedFriends || []).filter((f: any) => f && f.user));
        const pRequests = (data.pendingRequests || []).filter((r: any) => r && r.user);
        setPendingRequests(pRequests);
        setSentRequests((data.sentRequests || []).filter((r: any) => r && r.user));
        
        // Elevate pending count to the parent nav
        setPendingRequestsCount(pRequests.length);
      }
    } catch (err) {}
    setIsFriendsLoading(false);
  }, [setPendingRequestsCount]);

  useEffect(() => {
    fetchFriendsData();
  }, [fetchFriendsData]);

  const showAlertModal = useCallback((title: string, message: React.ReactNode, onConfirm?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'Done',
      hideCancel: true,
      onConfirm: () => {
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
    });
  }, [setConfirmModal]);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 1) return;
    setHasSearchedFriends(true); setIsSearchingFriends(true);
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setSearchResults(res.ok ? data.users || [] : []);
    } catch (err) { setSearchResults([]); }
    setIsSearchingFriends(false);
  }, [searchQuery]);

  const sendFriendRequest = useCallback(async (receiverId: string) => {
    if (sendingRequestUserId) return;
    setSendingRequestUserId(receiverId);
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId })
      });
      if (res.ok) {
        showAlertModal('Friend Request Sent', 'Your friend request has been sent successfully!');
        fetchFriendsData();
      } else {
        const data = await res.json();
        showAlertModal('Request Error', data.error || 'Failed to send request');
      }
    } catch (err) {
      showAlertModal('Network Error', 'Failed to send friend request');
    } finally {
      setSendingRequestUserId(null);
    }
  }, [sendingRequestUserId, fetchFriendsData, showAlertModal]);

  const handleFriendRequest = useCallback(async (friendshipId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (processingRequestId) return;
    setProcessingRequestId(friendshipId);
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId, status })
      });
      if (res.ok) fetchFriendsData();
    } catch (err) { }
    finally {
      setProcessingRequestId(null);
    }
  }, [processingRequestId, fetchFriendsData]);

  const removeFriend = useCallback(async (friendshipId: string, friendName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Friend',
      message: `Are you sure you want to remove "${friendName}" from your friends?`,
      isDestructive: true,
      onConfirm: async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        try {
          const res = await fetch(`/api/friends?id=${friendshipId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) fetchFriendsData();
        } catch (err) { }
      }
    });
  }, [setConfirmModal, fetchFriendsData]);

  const cancelFriendRequest = useCallback(async (friendshipId: string, friendName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Request',
      message: `Are you sure you want to cancel the request to "${friendName}"?`,
      isDestructive: true,
      onConfirm: async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        try {
          const res = await fetch(`/api/friends?id=${friendshipId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) fetchFriendsData();
        } catch (err) { }
      }
    });
  }, [setConfirmModal, fetchFriendsData]);

  const viewFriendStats = useCallback(async (friendId: string, friendUsername: string) => {
    if (loadingFriendAction) return;
    setLoadingFriendAction({ friendId, type: 'stats' });
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/stats?friendId=${friendId}&type=stats&t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok) {
        useDashboardStore.getState().setViewingFriend({ username: friendUsername, stats: data.stats });
        useDashboardStore.getState().setConnectInitialTab('friends');
        sessionStorage.setItem('returnToConnect', 'true');
        useDashboardStore.getState().toggleSettings(); // Close settings to see stats modal
        if (!useDashboardStore.getState().isStatsOpen) {
          useDashboardStore.getState().toggleStats();
        }
      } else {
        showAlertModal('Error', 'Failed to fetch stats: ' + data.error);
      }
    } catch (err) {
      showAlertModal('Error', 'Network error while fetching stats');
    } finally {
      setLoadingFriendAction(null);
    }
  }, [loadingFriendAction, showAlertModal]);

  const viewFriendTimetable = useCallback(async (friendId: string, friendUsername: string) => {
    if (loadingFriendAction) return;
    setLoadingFriendAction({ friendId, type: 'timetable' });
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/stats?friendId=${friendId}&type=timetable&t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok) {
        useDashboardStore.getState().setViewingFriend({ username: friendUsername, stats: data.stats });
        setShowFriendTimetable(true);
      } else {
        showAlertModal('Error', 'Failed to fetch timetable: ' + data.error);
      }
    } catch (err) {
      showAlertModal('Error', 'Network error while fetching timetable');
    } finally {
      setLoadingFriendAction(null);
    }
  }, [loadingFriendAction, showAlertModal]);

  const viewFriendTasks = useCallback(async (friendId: string, friendUsername: string) => {
    if (loadingFriendAction) return;
    setLoadingFriendAction({ friendId, type: 'tasks' });
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/stats?friendId=${friendId}&type=tasks&t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok) {
        useDashboardStore.getState().setViewingFriend({ username: friendUsername, stats: data.stats });
        setShowFriendTasks(true);
      } else {
        showAlertModal('Error', 'Failed to fetch tasks: ' + data.error);
      }
    } catch (err) {
      showAlertModal('Error', 'Network error while fetching tasks');
    } finally {
      setLoadingFriendAction(null);
    }
  }, [loadingFriendAction, showAlertModal]);

  const handleToggleTaskSharing = useCallback(async (friendshipId: string, currentSharingState: any) => {
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;
    try {
      const myUserId = JSON.parse(atob(token.split('.')[1])).userId;
      const isCurrentlySharing = currentSharingState?.[myUserId] === true;
      const newTaskSharing = { ...currentSharingState, [myUserId]: !isCurrentlySharing };

      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, taskSharing: newTaskSharing })
      });

      if (res.ok) {
        fetchFriendsData();
        setFriendSettingsModal((prev: any) => prev ? { ...prev, taskSharing: newTaskSharing } : null);
      } else {
        showAlertModal('Sharing Error', 'Failed to update sharing settings');
      }
    } catch (e) {
      showAlertModal('Sharing Error', 'Error updating sharing settings');
    }
  }, [fetchFriendsData, showAlertModal]);


  return (
    <div className="flex flex-col gap-5 min-w-0 w-full animate-in fade-in slide-in-from-bottom-2">
       {(
            
        <div className="flex flex-col gap-5 min-w-0 w-full animate-in fade-in slide-in-from-bottom-2">
          <div className="min-w-0 w-full">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h4 className="text-sm font-semibold truncate pr-2">My Friends ({friends.length})</h4>
              <button
                onClick={() => {
                  useDashboardStore.getState().setViewingFriend(null);
                  sessionStorage.setItem('returnToConnect', 'true');
                  useDashboardStore.getState().toggleSettings();
                  if (!useDashboardStore.getState().isStatsOpen) useDashboardStore.getState().toggleStats();
                }}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold transition-colors border border-blue-500/20 flex items-center justify-center gap-1.5 animate-pulse shrink-0"
              >
                <BarChart2 size={14} /> My Stats
              </button>
            </div>
            {isFriendsLoading ? (
              <FriendsLoadingSkeleton />
            ) : friends.length === 0 ? (
              <EmptyFriendsState />
            ) : (
              <div className="flex flex-col gap-2 w-full min-w-0">
                {friends.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-black/40 border border-white/5 p-1 rounded hover:bg-black/60 hover:border-white/10 transition-colors group min-w-0 w-full gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden pr-1">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-[8px] md:text-[10px] shadow-md border border-white/10 shrink-0 overflow-hidden">
                        {f.user.profilePicture ? <img src={f.user.profilePicture} alt="" className="w-full h-full object-cover" /> : f.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 overflow-hidden justify-center gap-0.5">
                        <div className="flex items-center gap-1.5 mt-0.5 w-full overflow-hidden">
                          <span className="font-bold text-[9px] md:text-[11px] tracking-wide truncate leading-none w-full">{f.user.username}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-0.5 mt-0.5 w-full max-w-[220px] md:max-w-[280px]">
                          {f.user.lastActive ? (
                            <span className="text-[8px] md:text-[9px] text-indigo-300 font-bold bg-indigo-500/20 px-1 py-0.5 rounded flex items-center justify-center leading-none gap-1 truncate w-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                              <span className="truncate">Active: {new Date(f.user.lastActive).toLocaleString([], { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          ) : (
                            <span className="text-[8px] md:text-[9px] text-white/50 font-bold bg-white/5 px-1 py-0.5 rounded flex items-center justify-center leading-none gap-1 truncate w-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0"></span>
                              <span className="truncate">Active: Unknown</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {f.taskSharing?.[f.user.id] !== false && (
                        <button
                          onClick={() => viewFriendTasks(f.user.id, f.user.username)}
                          disabled={!!loadingFriendAction}
                          className="p-1 md:px-2 md:py-1 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-semibold hover:bg-emerald-500/20 transition-all h-6 md:h-7 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-sm"
                          title="View Tasks"
                        >
                          {loadingFriendAction?.friendId === f.user.id && loadingFriendAction?.type === 'tasks' ? (
                            <>
                              <RefreshCw size={10} className="md:w-3 md:h-3 animate-spin text-emerald-400 shrink-0" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Check size={10} className="md:w-3 md:h-3 shrink-0" />
                              <span>View Tasks</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => viewFriendTimetable(f.user.id, f.user.username)}
                        disabled={!!loadingFriendAction}
                        className="p-1 md:px-2 md:py-1 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20 flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-semibold hover:bg-purple-500/20 transition-all h-6 md:h-7 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-sm"
                        title="View Timetable"
                      >
                        {loadingFriendAction?.friendId === f.user.id && loadingFriendAction?.type === 'timetable' ? (
                          <>
                            <RefreshCw size={10} className="md:w-3 md:h-3 animate-spin text-purple-400 shrink-0" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <Calendar size={10} className="md:w-3 md:h-3 shrink-0" />
                            <span className="hidden md:inline">TimeTable</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => viewFriendStats(f.user.id, f.user.username)}
                        disabled={!!loadingFriendAction}
                        className="p-1 md:px-2 md:py-1 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-semibold hover:bg-blue-500/20 transition-all h-6 md:h-7 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-sm"
                        title="View Stats"
                      >
                        {loadingFriendAction?.friendId === f.user.id && loadingFriendAction?.type === 'stats' ? (
                          <>
                            <RefreshCw size={10} className="md:w-3 md:h-3 animate-spin text-blue-400 shrink-0" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <BarChart2 size={10} className="md:w-3 md:h-3 shrink-0" />
                            <span className="hidden md:inline">Stats</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setFriendSettingsModal(f)}
                        className="text-white/40 hover:text-white w-6 h-6 md:w-7 md:h-7 rounded border border-transparent hover:border-white/10 hover:bg-white/5 flex items-center justify-center transition-colors shrink-0"
                        title="Friend Settings"
                      >
                        <Settings size={12} className="md:w-3.5 md:h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFriend(f.id, f.user?.username || 'Unknown')}
                        className="text-red-400/70 hover:text-red-400 w-6 h-6 md:w-7 md:h-7 rounded border border-transparent hover:border-red-500/20 hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0"
                        title="Remove Friend"
                      >
                        <X size={12} className="md:w-3.5 md:h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full min-w-0 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="relative flex-1 min-w-0">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchingFriends ? 'text-blue-400 animate-spin' : 'text-white/40'}`} />
              <input
                type="text"
                placeholder="Find with User Name..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === '') {
                    setSearchResults([]);
                    setHasSearchedFriends(false);
                  }
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs text-white/90 placeholder:text-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingFriends || !searchQuery.trim()}
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 rounded-lg font-semibold transition-all text-xs shrink-0 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[84px]"
            >
              {isSearchingFriends ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-white shrink-0" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </button>
          </form>

          {isSearchingFriends ? (
            <FriendsSearchLoadingSkeleton />
          ) : hasSearchedFriends && searchResults.length === 0 ? (
            <EmptyFriendSearchState query={searchQuery} />
          ) : null}

          {searchResults.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-3 w-full min-w-0">
              <h4 className="font-semibold mb-2 text-white/60 text-[10px] uppercase tracking-wider">Results</h4>
              <div className="flex flex-col gap-2 w-full min-w-0">
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-black/40 p-2 rounded-lg min-w-0 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white/10 overflow-hidden">
                        {u.profilePicture ? <img src={u.profilePicture} alt="" className="w-full h-full object-cover" /> : (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ? u.username : u.alias || u.username).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm truncate flex items-center gap-1.5">
                        {u.username.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                          <>
                            <span>{u.username}</span>
                            {u.alias && <span className="text-white/40 text-[10px]">({u.alias})</span>}
                          </>
                        ) : (
                          <span>{u.alias}</span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(u.id)}
                      disabled={sendingRequestUserId === u.id}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      {sendingRequestUserId === u.id ? (
                        <>
                          <RefreshCw size={12} className="animate-spin text-blue-400 shrink-0" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Add Friend</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requests Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 min-w-0 w-full">
              <h4 className="text-xs font-semibold mb-2 border-b border-white/10 pb-1.5 flex items-center gap-1.5 text-white/70 uppercase tracking-wider truncate">
                Approvals {pendingRequests.length > 0 && <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">{pendingRequests.length}</span>}
              </h4>
              {pendingRequests.length === 0 ? (
                <p className="text-white/40 italic text-[10px]">No pending requests.</p>
              ) : (
                <div className="flex flex-col gap-2 min-w-0 w-full">
                  {pendingRequests.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-black/40 border border-white/10 p-2 rounded-lg min-w-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center font-bold shrink-0 border border-white/10 overflow-hidden text-xs">
                          {r.user.profilePicture ? <img src={r.user.profilePicture} alt="" className="w-full h-full object-cover" /> : (r.user.alias || r.user.username).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-xs truncate">{r.user.alias || r.user.username}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleFriendRequest(r.id, 'ACCEPTED')}
                          disabled={processingRequestId === r.id}
                          className="w-7 h-7 flex items-center justify-center bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-md border border-green-500/30 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
                          title="Accept"
                        >
                          {processingRequestId === r.id ? <RefreshCw size={12} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={() => handleFriendRequest(r.id, 'REJECTED')}
                          disabled={processingRequestId === r.id}
                          className="w-7 h-7 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md border border-red-500/30 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
                          title="Reject"
                        >
                          {processingRequestId === r.id ? <RefreshCw size={12} className="animate-spin" /> : <X size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/5 min-w-0 w-full opacity-70">
              <h4 className="text-xs font-semibold mb-2 border-b border-white/10 pb-1.5 uppercase tracking-wider truncate text-white/70">Sent Requests</h4>
              {sentRequests.length === 0 ? (
                <p className="text-white/40 italic text-[10px]">No sent requests.</p>
              ) : (
                <div className="flex flex-col gap-2 min-w-0 w-full">
                  {sentRequests.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-black/40 p-2 rounded-lg text-xs min-w-0 gap-2 border border-white/5">
                      <span className="truncate min-w-0 flex-1">{r.user.alias || r.user.username}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white/40 text-[10px]">Pending</span>
                        <button onClick={() => cancelFriendRequest(r.id, r.user?.username || 'Unknown')} className="w-6 h-6 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 transition-colors" title="Cancel Request">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Modals  */}
      <FriendTimetableModal
        isOpen={showFriendTimetable}
        onClose={() => {
          setShowFriendTimetable(false);
          useDashboardStore.getState().setViewingFriend(null);
        }}
      />
      <FriendTasksModal
        isOpen={showFriendTasks}
        onClose={() => {
          setShowFriendTasks(false);
          useDashboardStore.getState().setViewingFriend(null);
        }}
      />
      <FriendSettingsModal
        friend={friendSettingsModal}
        onClose={() => setFriendSettingsModal(null)}
        onToggleTaskSharing={handleToggleTaskSharing}
      />

     
    </div>

  );
});

export default FriendsTab;
'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore, setAuthTransition } from '@/store/dashboardStore';
import { Users, UserPlus, Rss, LogIn, UserCircle, Search, Trash, Lock, Unlock, Check, X, ShieldAlert, BarChart2, Map, Clock, Trophy, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, Info, Eye, EyeOff, Flame, Calendar, Settings, Sparkles, UserX, WifiOff } from 'lucide-react';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';
import ConnectGroupsTab from './ConnectGroupsTab';
import Timetable from './Timetable';
import Link from 'next/link';

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

function LeaderboardLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 w-full animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-500/40 to-amber-300/20 border-2 border-yellow-400/60 flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.4)] animate-pulse">
          <Trophy className="w-7 h-7 text-yellow-300 animate-bounce" />
        </div>
        <div className="absolute -inset-1.5 rounded-full border border-yellow-400/40 border-t-yellow-300 animate-spin" style={{ animationDuration: '2s' }}></div>
        <div className="absolute -top-1 -right-1">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-xs font-bold tracking-wider text-yellow-300/90 uppercase animate-pulse">
          Computing Leaderboard Rankings...
        </span>
        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
      </div>

      <div className="w-full flex flex-col gap-2 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-950/20 via-black/40 to-yellow-950/20 border border-yellow-500/10 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-400">#{i}</div>
              <div className="w-7 h-7 rounded-full bg-white/10"></div>
              <div className="h-3 w-24 bg-white/15 rounded"></div>
            </div>
            <div className="h-4 w-16 bg-yellow-500/20 rounded-md"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConnectTab() {
  const { history, tasks, timetableGrid, connectInitialTab, setConnectInitialTab } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'leaderboard' | 'groups'>(connectInitialTab || 'profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [showFriendTimetable, setShowFriendTimetable] = useState(false);
  const [showFriendTasks, setShowFriendTasks] = useState(false);
  const [friendTaskTab, setFriendTaskTab] = useState<'today' | 'tomorrow'>('today');
  const [friendTaskGroupTab, setFriendTaskGroupTab] = useState<number>(0);
  const [friendSettingsModal, setFriendSettingsModal] = useState<any>(null);

  useEffect(() => {
    if (connectInitialTab) {
      setActiveTab(connectInitialTab);
    }
  }, [connectInitialTab]);

  // Auth state
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Friends state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string, username: string, profilePicture?: string, alias?: string }[]>([]);
  const [hasSearchedFriends, setHasSearchedFriends] = useState(false);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const [isSearchingFriends, setIsSearchingFriends] = useState(false);
  const [friends, setFriends] = useState<{ id: string, taskSharing?: Record<string, boolean>, user: { id: string, username: string, lastActive?: string, profilePicture?: string, alias?: string } }[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ id: string, user: { id: string, username: string, lastActive?: string, profilePicture?: string, alias?: string } }[]>([]);
  const [sentRequests, setSentRequests] = useState<{ id: string, user: { id: string, username: string, lastActive?: string, profilePicture?: string, alias?: string } }[]>([]);

  // Group requests state for badge
  const [groupRequestsCount, setGroupRequestsCount] = useState(0);

  // Info Modal state for Leaderboard
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedImageOverlay, setSelectedImageOverlay] = useState<{ url: string; title: string } | null>(null);

  // Leaderboard & Alias state
  const [alias, setAlias] = useState('');
  const [aliasLoading, setAliasLoading] = useState(false);
  const [isAliasUnlocked, setIsAliasUnlocked] = useState(false);
  const [aliasPassword, setAliasPassword] = useState('');
  const [showAliasPassword, setShowAliasPassword] = useState(false);
  const [aliasUnlockLoading, setAliasUnlockLoading] = useState(false);
  const [aliasUnlockError, setAliasUnlockError] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [profilePictureSuccess, setProfilePictureSuccess] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [aliasSuccess, setAliasSuccess] = useState('');

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'today' | 'week' | 'month'>('today');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'current' | 'previous'>('current');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [expandedLeaderboardUserId, setExpandedLeaderboardUserId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    requireText?: string;
    isDestructive?: boolean;
    confirmText?: string;
    hideCancel?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });

  const showAlertModal = (title: string, message: React.ReactNode, onConfirm?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'Done',
      hideCancel: true,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('dashboard_sync_token');
    const storedUsername = localStorage.getItem('dashboard_username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      fetchFriendsData();
    }

    // Listen for custom event from StatsModal
    const handleOpenLeaderboard = () => {
      setActiveTab('leaderboard');
    };
    window.addEventListener('open-leaderboard', handleOpenLeaderboard);

    const handleGroupRequestsUpdate = (e: any) => {
      setGroupRequestsCount(e.detail);
    };
    window.addEventListener('group-requests-updated', handleGroupRequestsUpdate);

    return () => {
      window.removeEventListener('open-leaderboard', handleOpenLeaderboard);
      window.removeEventListener('group-requests-updated', handleGroupRequestsUpdate);
    };
  }, []);

  useEffect(() => {
    if (connectInitialTab) {
      setActiveTab(connectInitialTab);
      // We clear it after a short delay to ensure it doesn't get stuck, 
      // but long enough that it isn't cleared before being used.
      const timer = setTimeout(() => {
        setConnectInitialTab(undefined);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [connectInitialTab, setConnectInitialTab]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'friends') {
      fetchFriendsData();
      const interval = setInterval(fetchFriendsData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (activeTab === 'profile' && isLoggedIn) {
      fetchProfile();
    }
    if (activeTab === 'leaderboard' && isLoggedIn) {
      fetchLeaderboard();
    }
  }, [activeTab, isLoggedIn]);

  const fetchProfile = async () => {
    const cachedAlias = localStorage.getItem('dashboard_alias');
    const cachedPic = localStorage.getItem('dashboard_profile_picture');
    if (cachedAlias) setAlias(cachedAlias);
    if (cachedPic) setProfilePicture(cachedPic);

    try {
      const token = localStorage.getItem('dashboard_sync_token');
      const res = await fetch('/api/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const storedUsername = localStorage.getItem('dashboard_username');
        const me = data.users.find((u: any) => u.username === storedUsername);
        if (me) {
          if (me.alias) {
            setAlias(me.alias);
            localStorage.setItem('dashboard_alias', me.alias);
          }
          if (me.profilePicture) {
            setProfilePicture(me.profilePicture);
            localStorage.setItem('dashboard_profile_picture', me.profilePicture);
          } else {
            localStorage.removeItem('dashboard_profile_picture');
            setProfilePicture('');
          }
          if (me.isAdmin === true || me.isAdmin === "true") {
            setIsAdminUser(true);
          }
        }
      }
    } catch (err) { }
  };

  const updateProfilePicture = async (url: string) => {
    setProfilePictureLoading(true);
    setProfilePictureSuccess('');
    try {
      const token = localStorage.getItem('dashboard_sync_token');
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profilePicture: url })
      });
      if (res.ok) {
        setProfilePicture(url);
        if (url) {
          localStorage.setItem('dashboard_profile_picture', url);
        } else {
          localStorage.removeItem('dashboard_profile_picture');
        }
        setProfilePictureSuccess('Saved!');
        setTimeout(() => setProfilePictureSuccess(''), 3000);
      }
    } catch (err) { }
    setProfilePictureLoading(false);
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const token = localStorage.getItem('dashboard_sync_token');
      const res = await fetch('/api/leaderboard', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok && data.leaderboard) {
        setLeaderboardData(data.leaderboard);
      }
    } catch (e) {
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchFriendsData = async () => {
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) {
      setIsFriendsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setFriends((data.acceptedFriends || []).filter((f: any) => f && f.user));
        setPendingRequests((data.pendingRequests || []).filter((r: any) => r && r.user));
        setSentRequests((data.sentRequests || []).filter((r: any) => r && r.user));
      }

      // Also check group requests
      const groupRes = await fetch('/api/groups/requests', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroupRequestsCount((groupData.requests || []).length);
      }
    } catch (err) { }
    finally {
      setIsFriendsLoading(false);
    }
  };



  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthLoading(true);

    if (authMode === 'forgot') {
      try {
        if (forgotStep === 'email') {
          const res = await fetch('/api/auth/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_otp', email: authEmail })
          });
          const data = await res.json();
          if (res.ok) {
            setAuthSuccessMsg('OTP sent to your email! (Check spam)');
            setForgotStep('reset');
          } else {
            setAuthError(data.error || 'Failed to send OTP');
          }
        } else {
          const res = await fetch('/api/auth/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset_password', email: authEmail, otp: authPin, newPassword: authPassword })
          });
          const data = await res.json();
          if (res.ok) {
            setAuthSuccessMsg('Password reset! Please login.');
            setAuthMode('login');
            setForgotStep('email');
            setAuthPin('');
            setAuthPassword('');
          } else {
            setAuthError(data.error || 'Password reset failed');
          }
        }
      } catch (err) {
        setAuthError('Network error');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    try {
      setAuthTransition(true);
      const bodyPayload = authMode === 'register'
        ? { username: authUsername, email: authEmail, password: authPassword }
        : { username: authUsername, password: authPassword };

      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('dashboard_sync_token', data.token);
        localStorage.setItem('dashboard_username', data.username);

        if (authMode === 'login') {
          // If logging in on a new device, clear the empty local state so it doesn't overwrite the cloud data!
          localStorage.removeItem('dashboard-storage');
          localStorage.removeItem('dashboard_last_modified');
        }

        fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token, username: data.username })
        }).catch(console.error);

        window.location.reload();
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthTransition(true);

    // Clear all dashboard-related local storage to prevent state leakage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dashboard')) {
        localStorage.removeItem(key);
      }
    });

    // Also clear other potential cached stuff like stopwatch timers if needed
    localStorage.removeItem('stopwatch_paused_secs');
    localStorage.removeItem('stopwatch_last_active');

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: null })
    }).catch(console.error);

    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you absolutely sure you want to delete your account? This action cannot be undone and ALL your data will be permanently deleted.',
      requireText: 'DELETE',
      isDestructive: true,
      onConfirm: async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        if (!token) return;
        try {
          const res = await fetch('/api/auth/delete', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showAlertModal('Account Deleted', 'Your account has been deleted successfully.', handleLogout);
          } else {
            showAlertModal('Delete Failed', 'Failed to delete account.');
          }
        } catch (err) {
          console.error(err);
          showAlertModal('Network Error', 'Network error while deleting account.');
        }
      }
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 1) return;
    setHasSearchedFriends(true);
    setIsSearchingFriends(true);
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data.users || []);
      else setSearchResults([]);
    } catch (err) { setSearchResults([]); }
    finally {
      setIsSearchingFriends(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
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
    } catch (err) { }
  };

  const handleFriendRequest = async (friendshipId: string, status: 'ACCEPTED' | 'REJECTED') => {
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
  };

  const removeFriend = async (friendshipId: string, friendName: string) => {
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
  };

  const cancelFriendRequest = async (friendshipId: string, friendName: string) => {
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
  };

  const viewFriendStats = async (friendId: string, friendUsername: string) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/stats?friendId=${friendId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
    } catch (err) { }
  };

  const viewFriendTimetable = async (friendId: string, friendUsername: string) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/stats?friendId=${friendId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        useDashboardStore.getState().setViewingFriend({ username: friendUsername, stats: data.stats });
        setShowFriendTimetable(true);
      } else {
        showAlertModal('Error', 'Failed to fetch timetable: ' + data.error);
      }
    } catch (err) { }
  };

  const viewFriendTasks = async (friendId: string, friendUsername: string) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/friends/stats?friendId=${friendId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        useDashboardStore.getState().setViewingFriend({ username: friendUsername, stats: data.stats });
        setShowFriendTasks(true);
      } else {
        showAlertModal('Error', 'Failed to fetch tasks: ' + data.error);
      }
    } catch (err) { }
  };

  const handleToggleTaskSharing = async (friendshipId: string, currentSharingState: any) => {
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
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-h-[80vh] w-full max-w-sm mx-auto p-4 overflow-hidden ">
        <div className="bg-black/40 p-6 rounded-2xl border border-white/10 w-full text-center shadow-2xl backdrop-blur-md">
          <ShieldAlert className="mx-auto text-blue-400 w-10 h-10 mb-3" />
          <h3 className="text-xl font-bold mb-1">Cloud Sync & Connect</h3>
          <p className="text-white/60 mb-5 text-xs">Log in to backup data and connect.</p>

          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            {authMode === 'forgot' ? (
              <>
                {forgotStep === 'email' ? (
                  <input
                    type="email"
                    placeholder="Enter email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="6-digit OTP"
                      required
                      value={authPin}
                      onChange={e => setAuthPin(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors tracking-widest text-center text-sm"
                    />
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password"
                        required
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {authMode === 'register' && (
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                )}
                <input
                  type="text"
                  placeholder={authMode === 'login' ? "Username or Email" : "Username"}
                  required
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </>
            )}

            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            {authSuccessMsg && <p className="text-green-400 text-xs">{authSuccessMsg}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2 text-sm shadow-lg shadow-blue-500/20"
            >
              {authLoading ? 'Wait...' : (authMode === 'login' ? 'Login' : 'Register')}
            </button>

            <div className="flex flex-col gap-2 mt-2">
              {authMode !== 'login' && (
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMsg(''); }}
                  className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                >
                  Back to Login
                </button>
              )}
              {authMode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                  >
                    Need an account? Register
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setAuthError(''); }}
                    className="text-white/40 hover:text-white/60 text-xs transition-colors"
                  >
                    Forgot Password?
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full max-h-[80vh] min-w-0 relative max-w-lg mx-auto pt-2 px-2">

      {/* Pill-shaped Navbar - Now OUTSIDE the scroller, pinned to the absolute top */}
      <div className="sticky flex justify-between items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1 mb-2 shadow-lg w-full shrink-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'profile' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}
        >
          <UserCircle size={16} />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'friends' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}
        >
          <Users size={16} />
          <span className="text-[9px] font-bold">Friends</span>
          {pendingRequests.length > 0 && (
            <span className="absolute top-1 right-3 sm:right-6 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full shadow-md">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'leaderboard' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}
        >
          <Trophy size={16} />
          <span className="text-[9px] font-bold">Ranks</span>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all ${activeTab === 'groups' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/90'}`}
        >
          <Users size={16} />
          <span className="text-[9px] font-bold">Groups</span>
          {groupRequestsCount > 0 && (
            <span className="absolute top-1 right-3 sm:right-6 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full shadow-md">
              {groupRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Wrapper - This is the ONLY part that scrolls now */}
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="flex flex-col items-center w-full gap-2.5 md:gap-3 animate-in fade-in slide-in-from-bottom-2">

          {/* Header Card */}
          <div className="flex items-center w-full gap-3 bg-gradient-to-r from-white/5 to-transparent p-2 rounded-2xl border border-white/10 shadow-sm">
            <div
              onClick={() => { if (profilePicture) setSelectedImageOverlay({ url: profilePicture, title: username }); }}
              className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold shadow-inner border-2 border-white/10 shrink-0 overflow-hidden ${profilePicture ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all' : ''}`}
              title={profilePicture ? "Click to expand photo" : ""}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0 w-full">
              <h3 className="text-lg md:text-xl font-bold truncate w-full text-white/90 leading-tight">{username}</h3>
              <div className="flex items-center gap-1.5 mt-1 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                <span className="text-[9px] md:text-[10px] text-green-400 font-bold tracking-wide uppercase">Sync Active</span>
              </div>

              {/* Danger Zone Actions */}
              <div className="flex gap-4 w-full mt-2 pb-1">
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Sign Out',
                      message: 'Are you sure you want to sign out?',
                      isDestructive: true,
                      onConfirm: handleLogout
                    });
                  }}
                  className="flex-1 p-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-colors border border-white/10 font-semibold text-[10px] md:text-xs"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-red-500/10 border border-white/60 text-white-200 text-[10px] leading-relaxed p-2.5 rounded-xl flex items-start gap-2 w-full shadow-sm">
            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-red-400" />
            <p>
              Accounts inactive for 90 days are <strong className="text-red-400 font-bold">permanently deleted</strong>. Export your data regularly!
            </p>
          </div>

          {/* Profile Pic Settings */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between w-full">
              <label className="text-[10px] md:text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-wider">
                <UserCircle className="text-blue-400 w-3.5 h-3.5" /> Avatar URL
              </label>
              {profilePictureSuccess && <span className="text-green-400 text-[10px] font-bold animate-pulse">{profilePictureSuccess}</span>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <input
                type="url"
                placeholder="https://.../img.png"
                value={profilePicture}
                onChange={e => setProfilePicture(e.target.value)}
                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors text-[10px] md:text-xs text-white/90 placeholder:text-white/30"
              />
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => updateProfilePicture(profilePicture)}
                  disabled={profilePictureLoading}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold text-[10px] md:text-xs shadow-md"
                >
                  {profilePictureLoading ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Remove Avatar',
                      message: 'Remove profile picture?',
                      isDestructive: true,
                      onConfirm: () => updateProfilePicture('')
                    });
                  }}
                  disabled={profilePictureLoading || !profilePicture}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-lg transition-colors font-semibold text-[10px] md:text-xs disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Alias Settings */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between w-full">
              <label className="text-[10px] md:text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="text-purple-400 w-3.5 h-3.5" /> Anonymous Alias
              </label>
              {aliasSuccess && <span className="text-green-400 text-[10px] font-bold animate-pulse">{aliasSuccess}</span>}
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex gap-1.5 w-full mt-0.5">
                <input
                  type="text"
                  placeholder="Anonymous alias..."
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-500 transition-colors text-[10px] md:text-xs text-white/90 placeholder:text-white/30"
                />
                <button
                  onClick={async () => {
                    setAliasLoading(true);
                    setAliasSuccess('');
                    const token = localStorage.getItem('dashboard_sync_token');
                    const res = await fetch('/api/users', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ alias })
                    });
                    if (res.ok) {
                      setAliasSuccess('Saved!');
                      setTimeout(() => setAliasSuccess(''), 3000);
                    }
                    setAliasLoading(false);
                  }}
                  disabled={aliasLoading}
                  className="px-4 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-semibold text-[10px] md:text-xs shadow-md shrink-0"
                >
                  {aliasLoading ? 'Wait' : 'Save'}
                </button>
              </div>
              <p className="text-white/40 text-[9px] leading-tight">Shown on the global leaderboard instead of your real username.</p>
            </div>
          </div>

          {/* Security & Danger Zone */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between w-full">
              <label className="text-[10px] md:text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className={`${isAliasUnlocked ? "text-green-400" : "text-red-400"} w-3.5 h-3.5`} /> Danger Zone
              </label>
              {isAliasUnlocked && (
                <button onClick={() => setIsAliasUnlocked(false)} className="text-[9px] text-white/40 hover:text-white transition-colors underline underline-offset-2 capitalize">
                  Lock
                </button>
              )}
            </div>

            {!isAliasUnlocked ? (
              <div className="flex flex-col gap-1.5 w-full">
                <p className="text-white/40 text-[9px] leading-tight">Enter your password to unlock account deletion.</p>
                <div className="flex gap-1.5 w-full mt-0.5 relative">
                  <input
                    type={showAliasPassword ? "text" : "password"}
                    placeholder="Enter password..."
                    value={aliasPassword}
                    onChange={e => setAliasPassword(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && aliasPassword && !aliasUnlockLoading) {
                        setAliasUnlockLoading(true);
                        setAliasUnlockError('');
                        try {
                          const res = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, password: aliasPassword })
                          });
                          if (res.ok) {
                            setIsAliasUnlocked(true);
                            setAliasPassword('');
                          } else {
                            setAliasUnlockError('Incorrect password');
                          }
                        } catch (err) {
                          setAliasUnlockError('Error');
                        } finally {
                          setAliasUnlockLoading(false);
                        }
                      }
                    }}
                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 transition-colors text-[10px] md:text-xs text-white/90 placeholder:text-white/30 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAliasPassword(!showAliasPassword)}
                    className="absolute right-[85px] top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showAliasPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={async () => {
                      setAliasUnlockLoading(true);
                      setAliasUnlockError('');
                      try {
                        const res = await fetch('/api/auth/login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username, password: aliasPassword })
                        });
                        if (res.ok) {
                          setIsAliasUnlocked(true);
                          setAliasPassword('');
                        } else {
                          setAliasUnlockError('Incorrect password');
                        }
                      } catch (err) {
                        setAliasUnlockError('Error');
                      } finally {
                        setAliasUnlockLoading(false);
                      }
                    }}
                    disabled={aliasUnlockLoading || !aliasPassword}
                    className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors font-semibold text-[10px] md:text-xs disabled:opacity-50 shrink-0"
                  >
                    {aliasUnlockLoading ? '...' : 'Unlock'}
                  </button>
                </div>
                {aliasUnlockError && <p className="text-red-400 text-[9px] mt-0.5 font-medium">{aliasUnlockError}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 w-full mt-1">
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete Account',
                      message: 'Are you sure you want to delete your account? This action cannot be undone.',
                      isDestructive: true,
                      requireText: 'DELETE',
                      onConfirm: handleDeleteAccount
                    });
                  }}
                  className="w-full px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl transition-colors font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Trash size={14} /> Delete Account Permanently
                </button>
              </div>
            )}
          </div>

          {/* Admin Dashboard Access */}
          {isAdminUser && (
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm mt-2">
              <label className="text-[10px] md:text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Admin Access
              </label>
              <p className="text-indigo-200/50 text-[9px] leading-tight">Switch to the Global Admin Panel.</p>
              <Link
                href="/admin"
                className="w-full px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-center rounded-xl transition-all font-bold text-xs shadow-[0_0_15px_rgba(99,102,241,0.4)] mt-1"
              >
                Open Admin Dashboard
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
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
                          className="p-1 md:px-2 md:py-1 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-semibold hover:bg-emerald-500/20 transition-colors h-6 md:h-7"
                          title="View Tasks"
                        >
                          <Check size={10} className="md:w-3 md:h-3" /> <span>View Tasks</span>
                        </button>
                      )}
                      <button
                        onClick={() => viewFriendTimetable(f.user.id, f.user.username)}
                        className="p-1 md:px-2 md:py-1 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20 flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-semibold hover:bg-purple-500/20 transition-colors h-6 md:h-7"
                        title="View Timetable"
                      >
                        <Calendar size={10} className="md:w-3 md:h-3" /> <span className="hidden md:inline">TimeTable</span>
                      </button>
                      <button
                        onClick={() => viewFriendStats(f.user.id, f.user.username)}
                        className="p-1 md:px-2 md:py-1 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-semibold hover:bg-blue-500/20 transition-colors h-6 md:h-7"
                        title="View Stats"
                      >
                        <BarChart2 size={10} className="md:w-3 md:h-3" /> <span className="hidden md:inline">Stats</span>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
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
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs"
              />
            </div>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 px-4 rounded-lg font-semibold transition-colors text-xs shrink-0 shadow-md">
              Search
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
                    <button onClick={() => sendFriendRequest(u.id)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors">
                      Add Friend
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
                        <button onClick={() => handleFriendRequest(r.id, 'ACCEPTED')} className="w-7 h-7 flex items-center justify-center bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-md border border-green-500/30 transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={() => handleFriendRequest(r.id, 'REJECTED')} className="w-7 h-7 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md border border-red-500/30 transition-colors">
                          <X size={14} />
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



      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="flex flex-col gap-1 md:gap-2 w-full lg:max-w-3xl mx-auto min-w-0 h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 min-w-0 w-full shrink-0">
            <h4 className="text-xs md:text-sm font-bold flex items-center gap-1 truncate">
              <Trophy className="text-yellow-400 w-3 h-3 md:w-4 md:h-4 shrink-0" />
              <span className="truncate">Global Leaderboard</span>
              <button onClick={() => setShowInfoModal(true)} className="ml-1 px-1.5 py-0.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0 flex items-center gap-1" title="About Leaderboard">
                <span className="text-[12px] font-semibold hidden md:inline">About Leaderboard</span>
                <Info className="w-4 h-4" />
              </button>
            </h4>
            <button
              onClick={fetchLeaderboard}
              className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${leaderboardLoading ? "animate-spin text-blue-400" : "text-white/60"}`} />
            </button>
          </div>

          {typeof navigator !== 'undefined' && !navigator.onLine && (
            <div className="w-full px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] md:text-xs font-medium flex items-center justify-between gap-2 shadow-sm my-1 shrink-0 animate-in fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Offline Mode: Live ranks won't update. Showing cached/local stats.</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[9px] font-mono shrink-0 uppercase font-bold">Offline</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5 w-full shrink-0 items-center justify-center">
            <div className="w-full">
              <div className="relative flex w-full bg-black/40 p-0.5 md:p-1 rounded-full border border-white/10 isolate">
                {(() => {
                  const viewOptions = [
                    { filter: 'today', period: 'current', label: 'Today' },
                    { filter: 'today', period: 'previous', label: 'Yesterday' },
                    { filter: 'week', period: 'current', label: 'This Week' },
                    { filter: 'week', period: 'previous', label: 'Last Week' },
                    { filter: 'month', period: 'current', label: 'This Month' },
                    { filter: 'month', period: 'previous', label: 'Last Month' },
                  ];
                  const activeIndex = viewOptions.findIndex(o => o.filter === leaderboardFilter && o.period === leaderboardPeriod);

                  return (
                    <>
                      <div
                        className="absolute top-0.5 bottom-0.5 md:top-1 md:bottom-1 rounded-full bg-blue-500/20 border border-blue-500/30 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] -z-10 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                        style={{
                          width: `calc((100% - 4px) / 6)`,
                          left: `calc(2px + ((100% - 4px) / 6) * ${activeIndex})`
                        }}
                      />
                      {viewOptions.map((opt, i) => {
                        const isActive = activeIndex === i;
                        return (
                          <button
                            key={`${opt.filter}-${opt.period}`}
                            onClick={() => {
                              setLeaderboardFilter(opt.filter as any);
                              setLeaderboardPeriod(opt.period as any);
                            }}
                            className={`flex-1 py-0.5 md:py-1 rounded-full text-[7px] sm:text-[9px] md:text-[11px] tracking-tighter md:tracking-normal font-bold transition-all whitespace-nowrap text-center ${isActive ? 'text-blue-300 drop-shadow-md' : 'text-white/40 hover:text-white/80'}`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="relative w-full shrink-0 min-w-0">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-white/30 w-3 h-3 md:w-3.5 md:h-3.5" />
              <input
                type="text"
                placeholder="Search user..."
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-full pl-7 pr-3 py-1 md:py-1.5 text-[9px] md:text-xs outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {leaderboardLoading && leaderboardData.length === 0 ? (
            <LeaderboardLoadingSkeleton />
          ) : (
            <div className="flex-1 relative overflow-hidden min-h-0 w-full pb-1">
              <ScrollableWithArrows className="flex flex-col gap-1 w-full min-w-0 pr-1 h-full pb-10">
                {(() => {
                  const getVal = (u: any) => {
                    if (leaderboardFilter === 'today') return leaderboardPeriod === 'current' ? u.todayFocused : u.yesterdayFocused;
                    if (leaderboardFilter === 'week') return leaderboardPeriod === 'current' ? u.thisWeekFocused : u.lastWeekFocused;
                    return leaderboardPeriod === 'current' ? u.thisMonthFocused : u.lastMonthFocused;
                  };

                  const sortLeaderboardUsers = (users: any[], filter: string, period: string) => {
                    return [...users].sort((a, b) => {
                      const valA = getVal(a) || 0;
                      const valB = getVal(b) || 0;

                      // 1. Primary: Sort by selected period focus time (descending)
                      if (valA !== valB) return valB - valA;

                      // 2. Tie breaker: wakeupTime (earlier is better, missing is worst)
                      const wakeA = a.wakeupTime ? new Date(a.wakeupTime).getTime() : Infinity;
                      const wakeB = b.wakeupTime ? new Date(b.wakeupTime).getTime() : Infinity;
                      if (wakeA !== wakeB) {
                        return wakeA < wakeB ? -1 : 1;
                      }

                      // 3. Tie breaker: streak (descending)
                      const streakA = a.streak || 0;
                      const streakB = b.streak || 0;
                      if (streakA !== streakB) return streakB - streakA;

                      // 4. Tie breaker: this week focused (descending)
                      const weekA = a.thisWeekFocused || 0;
                      const weekB = b.thisWeekFocused || 0;
                      if (weekA !== weekB) return weekB - weekA;

                      // 5. Tie breaker: this month focused (descending)
                      const monthA = a.thisMonthFocused || 0;
                      const monthB = b.thisMonthFocused || 0;
                      if (monthA !== monthB) return monthB - monthA;

                      return 0;
                    });
                  };

                  const sortedData = sortLeaderboardUsers(leaderboardData, leaderboardFilter, leaderboardPeriod);
                  const filteredData = sortedData.filter(u => u.displayName.toLowerCase().includes(leaderboardSearch.toLowerCase()));

                  if (filteredData.length === 0) return <p className="text-white/40 italic text-center py-2 text-[9px] md:text-xs">No user found.</p>;

                  return filteredData.map((user, index) => {
                    const val = getVal(user);
                    const isTop3 = index < 3 && val > 0;
                    const rankColors = ['bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]', 'bg-gray-300/20 text-gray-300 border-gray-300/30', 'bg-amber-700/20 text-amber-500 border-amber-700/30'];
                    const rankColor = isTop3 ? rankColors[index] : 'bg-white/5 text-white/50 border-white/10';

                    return (
                      <div key={user.id} className={`flex flex-col gap-0.5 p-0.5 sm:p-1 rounded-xl border transition-all w-full min-w-0 ${user.isMe ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)] z-10' : 'bg-black/40 border-white/5 hover:bg-black/60 hover:border-white/10'}`}>
                        <div className={`flex items-center justify-between w-full min-w-0 gap-1 sm:gap-1.5 ${leaderboardFilter === 'today' && leaderboardPeriod === 'current' ? 'cursor-pointer group/row' : ''}`}
                          onClick={() => {
                            if (leaderboardFilter === 'today' && leaderboardPeriod === 'current') {
                              setExpandedLeaderboardUserId(expandedLeaderboardUserId === user.id ? null : user.id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1 sm:gap-1 min-w-0 flex-1">
                            {/* Left Column: Rank number & Profile picture side by side */}
                            <div className="flex items-center gap-1 sm:gap-1 shrink-0">
                              <span className={`font-black text-[14px] sm:text-xs md:text-xl leading-none tracking-tighter min-w-[14px] sm:min-w-[18px] text-center ${isTop3 ? (index === 0 ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]' : index === 1 ? 'text-gray-200' : 'text-amber-500') : 'text-white/60'}`}>
                                {index + 1}
                              </span>
                              <div
                                onClick={(e) => {
                                  if (user.profilePicture) {
                                    e.stopPropagation();
                                    setSelectedImageOverlay({ url: user.profilePicture, title: user.displayName });
                                  }
                                }}
                                className={`w-9 h-9 sm:w-8.5 sm:h-8.5 md:w-9.5 md:h-9.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-[10px] sm:text-xs md:text-sm shrink-0 overflow-hidden border border-white/10 ${user.profilePicture ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all' : ''}`}
                                title={user.profilePicture ? "Click to view photo" : ""}
                              >
                                {user.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : user.displayName.charAt(0).toUpperCase()}
                              </div>
                            </div>

                            {/* Middle Column: Display name and 4-item grid */}
                            <div className="flex flex-col min-w-0 overflow-hidden justify-center gap-0.5 flex-1">
                              <div className="flex items-center gap-0.5 w-full overflow-hidden">
                                <span className={`font-bold text-[10px] sm:text-xs md:text-sm tracking-wide truncate leading-none ${user.isMe ? 'text-blue-400 font-extrabold' : 'text-white/90'}`}>
                                  {user.displayName}
                                </span>
                              </div>

                              <div className="grid grid-cols-[auto_auto] gap-0.5 sm:gap-1 w-fit">
                                {(user.streak > 0 || user.maxStreak > 0) && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-red-500/15 border border-red-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 shrink-0" />
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-red-300 font-bold leading-none whitespace-nowrap">
                                      {user.streak}d <span className="text-red-300/70 font-normal text-[7px] sm:text-[8.5px]">(Max:{user.maxStreak || 0})</span>
                                    </span>
                                  </div>
                                )}
                                {user.wakeupTime && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-blue-500/15 border border-blue-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-blue-300/80 font-medium leading-none shrink-0">Wake:</span>
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-blue-200 font-bold leading-none whitespace-nowrap">
                                      {new Date(user.wakeupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                                {user.workStartedTime && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-orange-500/15 border border-orange-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-orange-300/80 font-medium leading-none shrink-0">Work:</span>
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-orange-200 font-bold leading-none whitespace-nowrap">
                                      {new Date(user.workStartedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                                {user.bedTime && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-indigo-500/15 border border-indigo-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-indigo-300/80 font-medium leading-none shrink-0">Last Active:</span>
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-indigo-200 font-bold leading-none whitespace-nowrap">
                                      {new Date(user.bedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-0.5 sm:gap-1 shrink-0 pl-0">
                            <div className="flex flex-col items-end justify-center leading-none">
                              <span className="font-mono font-bold text-[10.5px] sm:text-xs md:text-sm tracking-tighter text-white dark:text-white/90">
                                {Math.floor(val / 60)}<span className="text-[8px] md:text-[10px] ml-0.5 text-gray-500 dark:text-white/40 mr-0.5">h</span>{val % 60}<span className="text-[8px] md:text-[10px] ml-0.5 text-gray-500 dark:text-white/40">m</span>
                              </span>
                            </div>
                            {leaderboardFilter === 'today' && leaderboardPeriod === 'current' && (
                              <div className="text-white/30 group-hover/row:text-white/70 transition-colors shrink-0 flex items-center justify-center pl-0">
                                <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 ${expandedLeaderboardUserId === user.id ? 'rotate-180' : ''}`} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Stats */}
                        {expandedLeaderboardUserId === user.id && leaderboardFilter === 'today' && leaderboardPeriod === 'current' && (() => {
                          const daysPassedThisWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
                          const thisWeekDailyAvg = Math.round((user.thisWeekFocused || 0) / daysPassedThisWeek);
                          const lastWeekDailyAvg = Math.round((user.lastWeekFocused || 0) / 7);

                          return (
                            <div className="w-full mt-1 pt-1 border-t border-white/10 flex flex-col gap-1 animate-fade-in min-w-0">
                              <div className="text-[7.5px] md:text-[8.5px] text-white/60 font-mono text-left bg-black/30 px-2 py-0.5 rounded select-all cursor-text flex items-center justify-between border border-white/5">
                                <span className="uppercase tracking-widest font-semibold text-white/40">User ID:</span>
                                <span>{user.id.slice(0, 5)}...{user.id.slice(-4)}</span>
                              </div>

                              <div className="grid grid-cols-4 gap-0.5 sm:gap-1 text-center min-w-0">
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-yellow-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-yellow-400 font-bold uppercase tracking-wider truncate" title="Daily Average of This Week">This Wk Avg</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-yellow-300 truncate">{Math.floor(thisWeekDailyAvg / 60)}h {thisWeekDailyAvg % 60}m</span>
                                </div>
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-amber-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-amber-400 font-bold uppercase tracking-wider truncate" title="Daily Average of Last Week">Last Wk Avg</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-amber-300 truncate">{Math.floor(lastWeekDailyAvg / 60)}h {lastWeekDailyAvg % 60}m</span>
                                </div>
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-purple-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-purple-400 font-bold uppercase tracking-wider truncate">This Week</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-purple-300 truncate">{Math.floor(user.thisWeekFocused / 60)}h {user.thisWeekFocused % 60}m</span>
                                </div>
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-emerald-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-emerald-400 font-bold uppercase tracking-wider truncate">This Month</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-emerald-300 truncate">{Math.floor(user.thisMonthFocused / 60)}h {user.thisMonthFocused % 60}m</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                })()}
              </ScrollableWithArrows>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal overlay (highest z-index) */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        requireText={confirmModal.requireText}
        isDestructive={confirmModal.isDestructive}
        confirmText={confirmModal.confirmText}
        hideCancel={confirmModal.hideCancel}
      />

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 p-5 rounded-xl w-full max-w-sm flex flex-col gap-3 relative max-h-[80vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setShowInfoModal(false)} className="absolute top-3 right-3 text-white/40 hover:text-white p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm md:text-base font-bold flex items-center gap-2 text-white"><Info className="w-4 h-4 text-blue-400" /> About Leaderboard</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              The Global Leaderboard ranks users based on their total focus time. Focus time is strictly tracked by completing Timer or Stopwatch sessions on the dashboard.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-300">Daily Streaks</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">You earn a streak day by accumulating at least 60 minutes of focus time in a single day. Miss a day, and your current streak resets.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-300">Sleep Schedule</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">Your Wake and Work times are captured via the Daily Routine modal. Your Last Active time is logged automatically based on when you stop working.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-300">Privacy & IDs</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">Your personal data is secured by JWT encryption. We mask user IDs for privacy. IDs are only used to send friend requests.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-2 w-full py-2 bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Image Overlay Modal */}
      {selectedImageOverlay && (
        <div
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImageOverlay(null)}
        >
          <div
            className="relative max-w-sm sm:max-w-md w-full bg-gray-900/95 border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col items-center overflow-hidden gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImageOverlay(null)}
              className="absolute top-3 right-3 text-white/70 hover:text-white p-1.5 bg-black/50 hover:bg-black/80 rounded-full transition-colors z-10 border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-full max-h-[65vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-white/10 p-1">
              <img
                src={selectedImageOverlay.url}
                alt={selectedImageOverlay.title}
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex flex-col items-center text-center">
              <h4 className="text-sm md:text-base font-bold text-white tracking-wide">{selectedImageOverlay.title}</h4>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'groups' && <ConnectGroupsTab />}

      {/* Friend Timetable Modal */}
      {showFriendTimetable && useDashboardStore.getState().viewingFriend && (
        <div
          className="fixed inset-0 z-[10005] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-2 sm:p-4"
          onClick={() => {
            setShowFriendTimetable(false);
            useDashboardStore.getState().setViewingFriend(null);
          }}
        >
          <div
            className="w-full max-w-3xl relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowFriendTimetable(false);
                useDashboardStore.getState().setViewingFriend(null);
              }}
              className="absolute -top-10 sm:-top-12 right-0 bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors text-white"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <Timetable />
          </div>
        </div>
      )}

      {/* Friend Tasks Modal */}
      {showFriendTasks && useDashboardStore.getState().viewingFriend && (() => {
        const viewingFriend = useDashboardStore.getState().viewingFriend;
        const friendStats = viewingFriend?.stats || {};
        const friendTasksList = friendTaskTab === 'today' ? (friendStats.tasks || []) : (friendStats.tomorrowTasks || []);
        const friendGroupNames = friendStats.taskGroupNames || ['Tab 1', 'Tab 2', 'Tab 3'];

        const isTaskDone = (t: any) => {
          if (Boolean(t.completed) && t.completed !== 'false') return true;
          if (t.duration !== undefined && t.duration <= 0) return true;
          return false;
        };

        const groupFilteredTasks = friendTasksList.filter((t: any) => (t.groupId || 0) === friendTaskGroupTab);

        const sortedTasks = [...groupFilteredTasks].sort((a: any, b: any) => {
          const aDone = isTaskDone(a);
          const bDone = isTaskDone(b);
          if (aDone === bDone) return 0;
          return aDone ? 1 : -1;
        });

        const totalRemainingMinutes = friendTasksList
          .filter((t: any) => !isTaskDone(t))
          .reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

        const formatDuration = (mins: number) => {
          if (!mins || mins <= 0) return '0m';
          if (mins < 60) return `${mins}m`;
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return m > 0 ? `${h}h ${m}m` : `${h}h`;
        };

        return (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => {
            setShowFriendTasks(false);
            useDashboardStore.getState().setViewingFriend(null);
          }}>
            <div className="bg-[#0f0f13] w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowFriendTasks(false);
                    useDashboardStore.getState().setViewingFriend(null);
                  }}
                  className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-md transition-all shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-white/10 bg-black/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center border border-white/10 shadow-lg shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight truncate">{viewingFriend?.username}'s Tasks</h2>
                  <p className="text-xs text-white/50">Viewing shared personal tasks</p>
                </div>
              </div>

              {/* Header Controls: Today/Tomorrow Tabs & Total Left */}
              <div className="border-b border-white/5 bg-black/20 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex bg-white/5 rounded-md overflow-hidden border border-white/10 shrink-0">
                    <button
                      onClick={() => setFriendTaskTab('today')}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${friendTaskTab === 'today' ? 'bg-sky-500/20 text-sky-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setFriendTaskTab('tomorrow')}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${friendTaskTab === 'tomorrow' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}
                    >
                      Tomorrow
                    </button>
                  </div>

                  {totalRemainingMinutes > 0 && (
                    <div className="relative group">
                      <span className="text-[10px] sm:text-xs font-bold text-sky-300 flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 rounded-md border border-sky-500/30 shadow-sm">
                        Total Left: {formatDuration(totalRemainingMinutes)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-tabs for grouping (Tab 1, Tab 2, Tab 3) */}
                <div className="flex items-start gap-1 mt-1">
                  {[0, 1, 2].map((idx) => {
                    const tabTasks = friendTasksList.filter((t: any) => (t.groupId || 0) === idx);
                    const tabRemaining = tabTasks.filter((t: any) => !isTaskDone(t)).reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

                    return (
                      <div
                        key={idx}
                        className={`relative flex flex-col flex-1 min-w-0 rounded-md border transition-all h-[28px] cursor-pointer ${friendTaskGroupTab === idx
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                          : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10 hover:text-white/80'
                          }`}
                        onClick={() => setFriendTaskGroupTab(idx)}
                      >
                        <div className="w-full px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-left truncate select-none">
                          {friendGroupNames[idx] || `Tab ${idx + 1}`}
                        </div>
                        {tabRemaining > 0 && (
                          <div className={`absolute bottom-0 right-0 text-[7.5px] font-bold uppercase tracking-widest px-1 py-[1px] rounded-tl-md rounded-br-md border-t border-l shadow-sm ${friendTaskGroupTab === idx ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-black/60 text-white/40 border-white/20'}`}>
                            {formatDuration(tabRemaining)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar p-4">
                {sortedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {sortedTasks.map((task: any, index: number) => {
                      const done = isTaskDone(task);
                      return (
                        <div key={task.id || index} className={`flex items-center justify-between p-3 rounded-lg border bg-white/[0.02] hover:bg-white/10 transition-all shadow-sm ${done ? 'opacity-75 grayscale-[30%] border-white/10' : 'border-white/20'}`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                            <div className="flex items-center justify-center shrink-0">
                              {done ? (
                                <div className="w-4 h-4 rounded-[4px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex items-center justify-center">
                                  <Check size={11} className="text-white stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-[4px] border-[1.5px] border-white/40" />
                              )}
                            </div>
                            <span className="text-[11px] font-black text-sky-300/90 tabular-nums select-none shrink-0">{index + 1}</span>
                            <span className={`text-xs md:text-sm font-semibold truncate ${done ? 'text-white/40 line-through' : 'text-white/90'}`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.duration > 0 && !done && (
                              <span className="text-[9px] md:text-[10px] font-semibold tracking-wide text-white/90 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/20 shadow-sm">
                                {formatDuration(task.duration)} left
                              </span>
                            )}
                            <span className={`text-[9px] md:text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border shadow-sm ${done ? 'text-emerald-300/80 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-200 bg-emerald-500/20 border-emerald-400/20'}`}>
                              {done ? (
                                formatDuration(Math.max(task.timeSpent || 0, task.duration || 0)) + ' done'
                              ) : (
                                formatDuration(task.timeSpent || 0) + ' done'
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-white/40 text-center italic text-sm mt-8">No {friendTaskTab} tasks found in this tab.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Friend Settings Modal */}
      {friendSettingsModal && (
        <div className="fixed inset-0 z-[10006] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setFriendSettingsModal(null)}>
          <div className="bg-[#12121a] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Settings size={16} className="text-blue-400" /> Friendship Settings</h3>
              <button onClick={() => setFriendSettingsModal(null)} className="text-white/50 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-white/60 mb-6">Manage what <strong className="text-white">{friendSettingsModal.user?.username}</strong> can see on your profile.</p>

            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white/90">Share Tasks</span>
                <span className="text-[10px] text-white/50">Allow them to view your daily tasks</span>
              </div>
              <button
                onClick={() => handleToggleTaskSharing(friendSettingsModal.id, friendSettingsModal.taskSharing)}
                className={`w-10 h-5 rounded-full relative transition-colors ${(() => {
                  try {
                    const token = localStorage.getItem('dashboard_sync_token');
                    if (token) {
                      const myUserId = JSON.parse(atob(token.split('.')[1])).userId;
                      return friendSettingsModal.taskSharing?.[myUserId] === true ? 'bg-emerald-500' : 'bg-white/20';
                    }
                  } catch (e) { }
                  return 'bg-white/20';
                })()}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${(() => {
                  try {
                    const token = localStorage.getItem('dashboard_sync_token');
                    if (token) {
                      const myUserId = JSON.parse(atob(token.split('.')[1])).userId;
                      return friendSettingsModal.taskSharing?.[myUserId] === true ? 'translate-x-5' : '';
                    }
                  } catch (e) { }
                  return '';
                })()}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
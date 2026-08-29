import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Users, Search, Plus, Trash, Trash2, Check, X, ShieldAlert, ArrowLeft, ArrowRight, Edit2, Settings, Info, Clock, Sparkles, Flame, WifiOff, Calendar, Lock } from 'lucide-react';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';
import GroupTaskManager from './GroupTaskManager';

function EmptyCreatedGroupsState({ onOpenCreate }: { onOpenCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-b from-sky-950/30 via-black/40 to-black/60 border border-sky-500/25 text-center shadow-lg relative my-1.5 group w-full box-border">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-500"></div>

      <div className="relative mb-1.5 flex items-center justify-center shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/15 border border-sky-400/35 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.25)] animate-pulse">
          <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-sky-300 animate-bounce" style={{ animationDuration: '2.8s' }} />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-blue-300 animate-spin" style={{ animationDuration: '3.5s' }} />
        </div>
      </div>

      <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide mb-1 px-1 text-center w-full leading-tight">
        Build Your Focus Circle!
      </h4>
      <p className="text-[10px] sm:text-xs text-white/60 w-full max-w-[280px] sm:max-w-xs leading-relaxed mb-2.5 px-2 break-words text-center">
        You haven't created any groups yet. Create a group to share tasks and sync focus progress with friends!
      </p>

      <button
        onClick={onOpenCreate}
        className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer border border-sky-400/30 shrink-0"
      >
        <Plus size={13} className="animate-pulse shrink-0" /> <span>Create Your First Group</span>
      </button>
    </div>
  );
}

function EmptyJoinedGroupsState({ onSwitchToSearch }: { onSwitchToSearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-950/30 via-black/40 to-black/60 border border-purple-500/25 text-center shadow-lg relative my-1.5 group w-full box-border">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500"></div>

      <div className="relative mb-1.5 flex items-center justify-center shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 border border-purple-400/35 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.25)] animate-pulse">
          <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-300 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-indigo-300 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide mb-1 px-1 text-center w-full leading-tight">
        Explore Joined Groups
      </h4>
      <p className="text-[10px] sm:text-xs text-white/60 w-full max-w-[280px] sm:max-w-xs leading-relaxed mb-2.5 px-2 break-words text-center">
        You haven't joined any groups yet. Search the directory to discover public groups or join friends!
      </p>

      <button
        onClick={onSwitchToSearch}
        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer border border-purple-400/30 shrink-0"
      >
        <Search size={13} className="animate-pulse shrink-0" /> <span>Find Groups to Join</span>
      </button>
    </div>
  );
}

function EmptyGroupSearchState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/10 text-center my-2">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
        <Search className="w-5 h-5 text-white/40 animate-pulse" />
      </div>
      <h5 className="text-xs font-bold text-white/80">No Groups Found</h5>
      <p className="text-[10px] text-white/50 max-w-xs mt-0.5 leading-relaxed">
        {query ? `No public or requested groups match "${query}". Try a different search term!` : 'No groups found in directory right now.'}
      </p>
    </div>
  );
}

function GroupsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full py-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-950/40 via-blue-900/30 to-indigo-950/40 border border-sky-500/30 shadow-md relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center animate-pulse">
              <Users className="w-4.5 h-4.5 text-sky-400 animate-bounce" />
            </div>
            <div className="absolute -inset-1 rounded-xl border border-sky-400/40 border-t-sky-300 animate-spin" style={{ animationDuration: '3s' }}></div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-sky-200 tracking-wide">Fetching Groups</span>
              <Sparkles className="w-3 h-3 text-sky-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="h-2 w-32 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
        <Clock className="w-4 h-4 text-sky-300/70 animate-spin" style={{ animationDuration: '5s' }} />
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="h-2.5 w-24 bg-white/10 rounded animate-pulse mb-0.5"></div>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 animate-pulse">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-32 bg-white/20 rounded"></div>
              <div className="h-2 w-44 bg-white/10 rounded"></div>
            </div>
            <ArrowRight size={14} className="text-white/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupSearchLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 w-full py-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-center gap-2 py-3 text-sky-300 text-xs font-bold animate-pulse bg-sky-950/20 rounded-xl border border-sky-500/20">
        <Search className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '2s' }} />
        <span>Searching Groups Directory...</span>
        <Sparkles className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/10 animate-pulse flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-28 bg-white/20 rounded"></div>
            <div className="h-2 w-40 bg-white/10 rounded"></div>
          </div>
          <div className="h-5 w-14 bg-blue-500/20 rounded-md"></div>
        </div>
      ))}
    </div>
  );
}

export default function ConnectGroupsTab() {
  const { userGroups, setUserGroups, selectedGroupId, setSelectedGroupId } = useDashboardStore();
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'search'>('groups');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingGroups, setIsSearchingGroups] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupAvatarUrl, setNewGroupAvatarUrl] = useState('');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [newGroupAllowRequests, setNewGroupAllowRequests] = useState(true);
  const [newGroupTasks, setNewGroupTasks] = useState<{ id: string, title: string, duration: number, groupId?: number }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');
  const [editingGroupTaskDurationId, setEditingGroupTaskDurationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<any>(null);
  const [viewingDay, setViewingDay] = useState<'today' | 'yesterday'>('today');
  const [activeGroupTab, setActiveGroupTab] = useState<number>(0);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupTitle, setEditGroupTitle] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupAvatarUrl, setEditGroupAvatarUrl] = useState('');
  const [editGroupIsPrivate, setEditGroupIsPrivate] = useState(false);
  const [editGroupAllowRequests, setEditGroupAllowRequests] = useState(true);
  const [memberNewTaskTitles, setMemberNewTaskTitles] = useState<Record<string, string>>({});
  const [memberNewTaskDurations, setMemberNewTaskDurations] = useState<Record<string, string>>({});
  const [editingTabIdx, setEditingTabIdx] = useState<number | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [memberActiveTabs, setMemberActiveTabs] = useState<Record<string, number>>({});
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  useEffect(() => {
    if (viewingGroup) {
      const members = viewingGroup.members || [];
      const meMember = members.find((m: any) => m.isMe || (myUsername && m.username === myUsername));
      const isMember = Boolean(meMember) || groups.some((g: any) => String(g._id) === String(viewingGroup._id));
      if (isMember) {
        const welcomeKey = `group_welcome_seen_${viewingGroup._id}`;
        const hasSeen = typeof window !== 'undefined' ? localStorage.getItem(welcomeKey) : 'true';
        if (!hasSeen) {
          setShowWelcomeModal(true);
        }
      }
    } else {
      setShowWelcomeModal(false);
    }
  }, [viewingGroup?._id]);

  const dismissWelcomeModal = () => {
    if (viewingGroup) {
      localStorage.setItem(`group_welcome_seen_${viewingGroup._id}`, 'true');
    }
    setShowWelcomeModal(false);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    isDestructive?: boolean;
    confirmText?: string;
    hideCancel?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

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

  const userId = localStorage.getItem('dashboard_username'); // Need user ID or just use username to identify

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (viewingGroup && userGroups && userGroups.length > 0) {
      const updated = userGroups.find((g: any) => g._id === viewingGroup._id);
      if (updated && updated !== viewingGroup) {
        setViewingGroup(updated);
      }
    }
  }, [userGroups]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;

    try {
      const [groupsRes, requestsRes] = await Promise.all([
        fetch('/api/groups', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/groups/requests', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const groupsData = await groupsRes.json();
      const requestsData = await requestsRes.json();

      if (groupsData.groups) {
        setGroups(groupsData.groups);
        setUserGroups(groupsData.groups); // sync to store for TaskManager
      }
      if (requestsData) {
        setRequests(requestsData.requests || []);
        setSentRequests(requestsData.sentRequests || []);
        // Fire custom event to update ConnectTab badge
        window.dispatchEvent(new CustomEvent('group-requests-updated', { detail: (requestsData.requests || []).length }));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleOpenGroupDirect = async (e: any) => {
      const groupId = e.detail?.groupId;
      if (!groupId) return;

      const existingGroup = groups.find((g: any) => String(g._id) === String(groupId));
      if (existingGroup) {
        setViewingGroup(existingGroup);
        return;
      }

      const token = localStorage.getItem('dashboard_sync_token');
      if (!token) return;
      try {
        const res = await fetch(`/api/groups/${groupId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.group) {
          setViewingGroup(data.group);
        }
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('open-group-direct', handleOpenGroupDirect);
    return () => {
      window.removeEventListener('open-group-direct', handleOpenGroupDirect);
    };
  }, [groups]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSearch();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchSearch = async () => {
    setHasSearched(true);
    setIsSearchingGroups(true);
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const q = searchQuery.trim();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/groups/search${q ? `?q=${encodeURIComponent(q)}` : ''}`, { headers });
      const data = await res.json();
      setSearchResults(data.groups || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingGroups(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearch();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle) return;
    setIsCreating(true);
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newGroupTitle, description: newGroupDesc, avatarUrl: newGroupAvatarUrl.trim(), isPrivate: newGroupIsPrivate, allowJoinRequests: newGroupAllowRequests, tasks: newGroupTasks })
      });
      const data = await res.json();
      if (res.ok) {
        setNewGroupTitle('');
        setNewGroupDesc('');
        setNewGroupAvatarUrl('');
        setNewGroupIsPrivate(false);
        setNewGroupAllowRequests(true);
        setNewGroupTasks([]);
        setNewTaskTitle('');
        setNewTaskDuration('');
        fetchData();
        setIsCreateFormOpen(false);
      } else {
        showAlertModal('Group Error', data.error || 'Failed to create group');
      }
    } catch (e) {
      console.error(e);
      showAlertModal('Group Error', 'An error occurred while creating the group.');
    }
    setIsCreating(false);
  };

  const handleJoinRequest = async (groupId: string) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch('/api/groups/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ groupId })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.joinedInstantly) {
          showAlertModal('Group Joined!', '🎉 You joined this public group instantly! Compare your focus time and work on goals with your rivals.');
        } else {
          showAlertModal('Request Sent', 'Your group join request has been sent to the group admin successfully!');
        }
        fetchData();
        if (viewingGroup && viewingGroup._id === groupId) {
          // Refetch viewing group
          const gRes = await fetch(`/api/groups/${groupId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          const gData = await gRes.json();
          if (gData.group) setViewingGroup(gData.group);
        }
      } else {
        showAlertModal('Request Error', data.error || 'Failed to send request');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExitGroup = async (groupId: string, groupTitle: string, isAdmin: boolean) => {
    setConfirmModal({
      isOpen: true,
      title: 'Exit Group',
      message: `Are you sure you want to exit "${groupTitle}"? ${isAdmin ? 'As admin, group ownership will automatically transfer to the next member.' : 'Your member progress will be removed.'}`,
      isDestructive: true,
      onConfirm: async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        try {
          const res = await fetch(`/api/groups/${groupId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: 'exit_group' })
          });
          if (res.ok) {
            setGroups(prev => prev.filter(g => g._id !== groupId));
            setUserGroups(userGroups.filter((g: any) => g._id !== groupId));
            if (viewingGroup && viewingGroup._id === groupId) {
              setViewingGroup(null);
            }
            if (selectedGroupId === groupId) {
              setSelectedGroupId(null);
            }
            fetchData();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleClaimLeadership = async (groupId: string) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'claim_leadership' })
      });
      if (res.ok) {
        showAlertModal('Leadership Claimed!', '👑 You are now the Group Admin! You have full administrative control.');
        fetchData();
        if (viewingGroup && viewingGroup._id === groupId) {
          const gRes = await fetch(`/api/groups/${groupId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          const gData = await gRes.json();
          if (gData.group) setViewingGroup(gData.group);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGroupTask = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newTaskTitle.trim()) return;
    const countInTab = newGroupTasks.filter(t => (t.groupId || 0) === activeGroupTab).length;
    if (countInTab >= 6) {
      showAlertModal('Limit Reached', 'Each tab section can have at most 6 tasks.');
      return;
    }
    const dur = parseInt(newTaskDuration);
    setNewGroupTasks([...newGroupTasks, {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      duration: isNaN(dur) || dur < 0 ? 0 : dur,
      groupId: activeGroupTab
    }]);
    setNewTaskTitle('');
    setNewTaskDuration('');
  };

  const handleEditGroupTaskDuration = async (groupId: string, taskId: string, duration: number) => {
    if (!viewingGroup) return;
    const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
    const myUserId = myMemberInfo?.userId || '';

    const currentMyTasks = viewingGroup.memberTasks?.[myUserId] || viewingGroup.tasks || [];
    const updatedMyTasks = currentMyTasks.map((t: any) => t.id === taskId ? { ...t, duration } : t);
    const updatedMemberTasks = {
      ...(viewingGroup.memberTasks || {}),
      [myUserId]: updatedMyTasks
    };
    setViewingGroup({ ...viewingGroup, memberTasks: updatedMemberTasks });

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'edit_group_task_duration', taskId, duration })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGroupTaskCompletion = async (taskId: string, currentComp: any, targetUserId: string) => {
    if (!viewingGroup) return;
    const membersList = viewingGroup.members || [];
    const myMemberInfo = membersList.find((m: any) => m.isMe || m.username === myUsername);
    if (!myMemberInfo || myMemberInfo.userId !== targetUserId) return; // Only for myself

    const isCompleted = currentComp?.completed || false;
    const newCompleted = !isCompleted;
    const timeSpent = currentComp?.timeSpent || 0;

    // Optimistic UI update
    const userCompsForDay = viewingGroup.completions?.[myMemberInfo.userId]?.[dateStr] || {};
    const updatedUserComps = {
      ...userCompsForDay,
      [taskId]: { completed: newCompleted, timeSpent }
    };
    const updatedGroupComps = {
      ...(viewingGroup.completions || {}),
      [myMemberInfo.userId]: {
        ...(viewingGroup.completions?.[myMemberInfo.userId] || {}),
        [dateStr]: updatedUserComps
      }
    };

    setViewingGroup({ ...viewingGroup, completions: updatedGroupComps });

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      await fetch(`/api/groups/${viewingGroup._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'update_completion',
          dateStr,
          taskId,
          completed: newCompleted,
          timeSpent
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGroupTaskInView = async (tabIdx: number, title: string, durationMins: number) => {
    if (!viewingGroup || !title.trim()) return;
    const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
    const myUserId = myMemberInfo?.userId || '';

    const currentMyTasks = viewingGroup.memberTasks?.[myUserId] || viewingGroup.tasks || [];
    const tabTasksCount = currentMyTasks.filter((t: any) => (t.groupId || 0) === tabIdx).length;
    if (tabTasksCount >= 6) {
      showAlertModal('Limit Reached', 'Each tab section can have at most 6 tasks.');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      duration: durationMins || 25,
      groupId: tabIdx
    };

    const updatedMyTasks = [...currentMyTasks, newTask];
    const updatedMemberTasks = {
      ...(viewingGroup.memberTasks || {}),
      [myUserId]: updatedMyTasks
    };
    setViewingGroup({ ...viewingGroup, memberTasks: updatedMemberTasks });

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${viewingGroup._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_task_list', tasks: updatedMyTasks })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditGroupTaskTitle = async (groupId: string, taskId: string, newTitle: string) => {
    if (!newTitle.trim() || !viewingGroup) return;
    const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
    const myUserId = myMemberInfo?.userId || '';

    const currentMyTasks = viewingGroup.memberTasks?.[myUserId] || viewingGroup.tasks || [];
    const updatedMyTasks = currentMyTasks.map((t: any) => t.id === taskId ? { ...t, title: newTitle.trim() } : t);
    const updatedMemberTasks = {
      ...(viewingGroup.memberTasks || {}),
      [myUserId]: updatedMyTasks
    };
    setViewingGroup({ ...viewingGroup, memberTasks: updatedMemberTasks });

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'edit_group_task_title', taskId, title: newTitle.trim() })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGroupTabNames = async (groupId: string, newTabNames: string[]) => {
    if (!viewingGroup) return;

    setViewingGroup((prev: any) => prev ? { ...prev, tabNames: newTabNames } : prev);

    const updatedUserGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? {
      ...g,
      tabNames: newTabNames
    } : g);
    setUserGroups(updatedUserGroups);

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_group_tab_names', tabNames: newTabNames })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTabNames = async (groupId: string, newTabNames: string[]) => {
    if (!viewingGroup) return;
    const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
    const myUserId = myMemberInfo?.userId || '';

    const updatedMemberTabNames = {
      ...(viewingGroup.memberTabNames || {}),
      [myUserId]: newTabNames
    };
    setViewingGroup((prev: any) => prev ? { ...prev, memberTabNames: updatedMemberTabNames } : prev);

    const updatedUserGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? {
      ...g,
      memberTabNames: updatedMemberTabNames
    } : g);
    setUserGroups(updatedUserGroups);

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_tab_names', tabNames: newTabNames, targetUserId: myUserId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGroupTask = async (groupId: string, taskId: string) => {
    if (!viewingGroup) return;
    const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
    const myUserId = myMemberInfo?.userId || '';

    const currentMyTasks = viewingGroup.memberTasks?.[myUserId] || viewingGroup.tasks || [];
    const updatedMyTasks = currentMyTasks.filter((t: any) => t.id !== taskId);
    const updatedMemberTasks = {
      ...(viewingGroup.memberTasks || {}),
      [myUserId]: updatedMyTasks
    };
    setViewingGroup({ ...viewingGroup, memberTasks: updatedMemberTasks });

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_task_list', tasks: updatedMyTasks })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGroupPrivacy = async (groupId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_info', title: viewingGroup.title, description: viewingGroup.description, isPrivate: !currentStatus, allowJoinRequests: viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true })
      });
      if (res.ok) {
        fetchData();
        setViewingGroup({ ...viewingGroup, isPrivate: !currentStatus });
      }
    } catch (e) { }
  };

  const handleToggleGroupRequests = async (groupId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_info', title: viewingGroup.title, description: viewingGroup.description, isPrivate: viewingGroup.isPrivate, allowJoinRequests: !currentStatus })
      });
      if (res.ok) {
        fetchData();
        setViewingGroup({ ...viewingGroup, allowJoinRequests: !currentStatus });
      }
    } catch (e) { }
  };

  const handleProcessRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch('/api/groups/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Group',
      message: `Are you sure you want to permanently delete "${groupTitle}" and all its data?`,
      isDestructive: true,
      onConfirm: async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        try {
          const res = await fetch(`/api/groups/${groupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            if (selectedGroupId === groupId) setSelectedGroupId(null);
            fetchData();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleGrantEdit = async (groupId: string, targetUserId: string, canEdit: boolean) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'grant_edit', targetUserId, canEdit })
      });
      fetchData(); // re-fetch to update members
      if (viewingGroup && viewingGroup._id === groupId) {
        // Update local viewing group to avoid flash
        setViewingGroup({ ...viewingGroup, members: viewingGroup.members.map((m: any) => m.userId === targetUserId ? { ...m, canEdit } : m) });
      }
    } catch (e) { }
  };

  const handleRemoveMember = async (groupId: string, targetUserId: string, targetUsername: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove "${targetUsername}" from this group? All their group progress data will be permanently deleted.`,
      isDestructive: true,
      onConfirm: async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        try {
          const res = await fetch(`/api/groups/${groupId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: 'remove_member', targetUserId })
          });
          if (res.ok) {
            if (viewingGroup && viewingGroup._id === groupId) {
              const updatedMemberTasks = { ...(viewingGroup.memberTasks || {}) };
              delete updatedMemberTasks[targetUserId];
              const updatedCompletions = { ...(viewingGroup.completions || {}) };
              delete updatedCompletions[targetUserId];
              
              setViewingGroup({
                ...viewingGroup,
                members: viewingGroup.members.filter((m: any) => m.userId !== targetUserId),
                memberTasks: updatedMemberTasks,
                completions: updatedCompletions
              });
            }
            fetchData();
            const gRes = await fetch(`/api/groups/${groupId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const gData = await gRes.json();
            if (gData.group) setViewingGroup(gData.group);
          }
        } catch (e) { }
      }
    });
  };

  const handleUpdateGroupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroupId || !editGroupTitle.trim()) return;

    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${editingGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_info', title: editGroupTitle.trim(), description: editGroupDesc.trim(), avatarUrl: editGroupAvatarUrl.trim(), isPrivate: editGroupIsPrivate, allowJoinRequests: editGroupAllowRequests })
      });
      if (res.ok) {
        if (viewingGroup) {
          setViewingGroup({ ...viewingGroup, title: editGroupTitle.trim(), description: editGroupDesc.trim(), avatarUrl: editGroupAvatarUrl.trim(), isPrivate: editGroupIsPrivate, allowJoinRequests: editGroupAllowRequests });
        }
        setEditingGroupId(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateStr = viewingDay === 'today' ? getLocalDateString(0) : getLocalDateString(-1);

  // Parse user info securely (temporary hack to know who I am without passing props)
  const myUsername = localStorage.getItem('dashboard_username') || '';

  const isMeMember = (m: any) => Boolean(m.isMe || (myUsername && m.username?.toLowerCase() === myUsername.toLowerCase()));

  const myGroupsList = groups.filter(g => g.members?.some((m: any) => isMeMember(m) && (m.role === 'admin' || g.adminId === m.userId)));
  const joinedGroupsList = groups.filter(g => g.members?.some((m: any) => isMeMember(m) && m.role !== 'admin' && g.adminId !== m.userId));

  const getGroupStats = (group: any, dayString?: string) => {
    const d = new Date();
    const todayStr = dayString || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let myDone = 0;
    let highestDone = 0;
    const membersList = group.members || [];
    const myMemberInfo = membersList.find((m: any) => isMeMember(m));
    const myUserId = myMemberInfo ? myMemberInfo.userId : null;
    const myUsername = myMemberInfo ? myMemberInfo.username : null;

    let myTasks: any[] = [];
    if (group.memberTasks) {
      if (myUserId && group.memberTasks[myUserId] !== undefined) myTasks = group.memberTasks[myUserId];
      else if (myUsername && group.memberTasks[myUsername] !== undefined) myTasks = group.memberTasks[myUsername];
      else if (group.adminId === myUserId || group.adminId === myUsername || myMemberInfo?.role === 'admin') myTasks = group.tasks || [];
    } else {
      myTasks = group.tasks || [];
    }

    const myTotalDuration = myTasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

    if (group.completions) {
      for (const m of membersList) {
        let mDone = 0;
        const uId = m.userId || '';
        const uName = m.username || '';
        let mTasks: any[] = [];
        if (group.memberTasks) {
          if (uId && group.memberTasks[uId] !== undefined) mTasks = group.memberTasks[uId];
          else if (uName && group.memberTasks[uName] !== undefined) mTasks = group.memberTasks[uName];
          else if (group.adminId === uId || group.adminId === uName || m.role === 'admin') mTasks = group.tasks || [];
        } else {
          mTasks = group.tasks || [];
        }

        const mComps = (uId && group.completions[uId]?.[todayStr]) || (uName && group.completions[uName]?.[todayStr]) || {};
        for (const t of mTasks) {
          const comp = mComps[t.id];
          if (comp) {
            if (comp.completed) {
              mDone += Math.max(comp.timeSpent || 0, t.duration || 0);
            } else {
              mDone += (comp.timeSpent || 0);
            }
          }
        }
        if (mDone > highestDone) highestDone = mDone;
        if ((myUserId && m.userId === myUserId) || (myUsername && m.username === myUsername) || (myUserId === null && m.isMe)) {
          myDone = mDone;
        }
      }
    }

    const myTimeLeft = Math.max(0, myTotalDuration - myDone);
    return { totalDuration: myTotalDuration, myDone, myTimeLeft, highestDone };
  };

  const globalFormatTime = (mins: number) => {
    if (mins === 0) return '0m';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (viewingGroup) {
    const members = viewingGroup.members || [];
    const meMember = members.find((m: any) => isMeMember(m));
    const isMember = Boolean(meMember);
    const isAdmin = Boolean(meMember?.role === 'admin') || Boolean(viewingGroup.adminId && (meMember?.userId === viewingGroup.adminId || (myUsername && viewingGroup.adminId === myUsername)));

    return (
      <div className="flex flex-col w-full animate-in fade-in slide-in-from-right-2">
        {typeof navigator !== 'undefined' && !navigator.onLine && (
          <div className="w-full px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] md:text-xs font-medium flex items-center justify-between gap-2 shadow-sm mb-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Offline Mode: Showing cached group data. Member ranks will sync live when online.</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[9px] font-mono shrink-0 uppercase font-bold">Offline</span>
          </div>
        )}
        {/* Sticky Top-Left Floating Rounded Back Button - Pinned below the top Connect navbar */}
        <div className="sticky top-14 z-20 py-1 mb-2 flex items-center justify-between w-full pointer-events-none">
          <button
            onClick={() => setViewingGroup(null)}
            className="pointer-events-auto p-1.5 px-3 rounded-full bg-slate-900/90 hover:bg-black text-white shadow-xl border border-white/20 backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer hover:border-blue-400 group"
            title="Back to groups list"
          >
            <ArrowLeft size={14} className="text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Groups</span>
          </button>
        </div>

        {/* Group Header Card - Standard Relative Card (Scrolls Up naturally with content) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-purple-950/80 p-2.5 sm:p-3 rounded-2xl border border-white/20 shadow-xl mb-3 backdrop-blur-xl">
          {/* Ambient Decorative Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none z-0" />

          <div className="relative z-10 flex flex-col gap-1.5 w-full">
            {/* Top Bar: Group Title + Status Badges + Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                <h3 className="font-bold text-white text-sm sm:text-base md:text-lg tracking-tight truncate max-w-[160px] xs:max-w-[240px] sm:max-w-xs md:max-w-md">
                  {viewingGroup.title}
                </h3>

                {/* Status Badges */}
                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAdmin) {
                        handleToggleGroupPrivacy(viewingGroup._id, viewingGroup.isPrivate);
                      }
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${viewingGroup.isPrivate ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}
                    title={isAdmin ? "Click to toggle privacy" : "Privacy status"}
                  >
                    {viewingGroup.isPrivate ? <><ShieldAlert size={8} /> Private</> : <><Check size={8} /> Public</>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isAdmin) {
                        const currentStatus = viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true;
                        handleToggleGroupRequests(viewingGroup._id, currentStatus);
                      }
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${(viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}
                    title={isAdmin ? "Click to toggle join requests requirement" : "Join requests status"}
                  >
                    {viewingGroup.isPrivate ? (
                      (viewingGroup.allowJoinRequests !== false) ? <><Check size={8} /> Requests Allowed</> : <><ShieldAlert size={8} /> Requests Blocked</>
                    ) : (
                      (viewingGroup.allowJoinRequests !== false) ? <><ShieldAlert size={8} /> Approval Required</> : <><Check size={8} /> Instant Join Enabled</>
                    )}
                  </button>

                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <Users size={8} /> {viewingGroup.members?.length || 0}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setShowWelcomeModal(true)}
                  className="px-2 py-0.5 flex items-center gap-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-purple-500/30 shadow-sm"
                  title="Group Member Controls Guide"
                >
                  <Sparkles size={10} className="text-purple-300 animate-pulse" />
                  <span>Guide</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditGroupTitle(viewingGroup.title);
                      setEditGroupDesc(viewingGroup.description || '');
                      setEditGroupAvatarUrl(viewingGroup.avatarUrl || '');
                      setEditGroupIsPrivate(viewingGroup.isPrivate || false);
                      setEditGroupAllowRequests(viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true);
                      setEditingGroupId(viewingGroup._id);
                    }}
                    className="px-2 py-0.5 flex items-center gap-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-white transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 shadow-sm"
                    title="Edit Group Settings"
                  >
                    <Settings size={10} />
                    <span>Edit</span>
                  </button>
                )}

                {!isMember && (
                  (viewingGroup.isPrivate && viewingGroup.allowJoinRequests === false) ? (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md border border-red-500/30 whitespace-nowrap">
                      Blocked
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinRequest(viewingGroup._id)}
                      disabled={sentRequests.some(r => String(r.groupId) === String(viewingGroup._id))}
                      className="px-2.5 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-md transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
                    >
                      {sentRequests.some(r => String(r.groupId) === String(viewingGroup._id)) ? 'Pending' : viewingGroup.isPrivate ? 'Request' : 'Join'}
                    </button>
                  )
                )}

                {isMember && (
                  <button
                    type="button"
                    onClick={() => handleExitGroup(viewingGroup._id, viewingGroup.title, isAdmin)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-md transition-colors cursor-pointer border border-rose-500/30"
                    title="Exit group"
                  >
                    Exit Group
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(viewingGroup._id, viewingGroup.title)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors cursor-pointer border border-red-500/30"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Rounded Rectangle Profile Photo + 2x2 Stats Grid (Table of Rows & Columns) */}
            <div className="flex flex-col gap-2 mt-1 bg-black/40 p-2.5 rounded-xl border border-white/10 shadow-inner w-full">
              <div className="flex items-center gap-2.5 w-full">
                {/* Rounded Rectangle Group Profile Photo */}
                <div className="relative group/avatar shrink-0">
                  {viewingGroup.avatarUrl ? (
                    <img
                      src={viewingGroup.avatarUrl}
                      alt={viewingGroup.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-white/20 shadow-md bg-black/60"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-600/40 via-indigo-600/40 to-purple-600/40 border border-white/20 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md uppercase tracking-wider">
                      {viewingGroup.title?.[0] || 'G'}
                    </div>
                  )}
                </div>

                {/* 2x2 Table Grid of 4 Metrics */}
                <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-0 font-mono">
                  {/* Row 1 Col 1: Target Time */}
                  <div className="flex items-center justify-between px-2 py-1 bg-sky-500/10 rounded-lg border border-sky-500/20 text-[9px] sm:text-[10px]">
                    <span className="text-sky-300/80 font-sans font-bold flex items-center gap-1">🎯 Target</span>
                    <span className="font-bold text-sky-300">{globalFormatTime(getGroupStats(viewingGroup, dateStr).totalDuration)}</span>
                  </div>
                  {/* Row 1 Col 2: High Time */}
                  <div className="flex items-center justify-between px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[9px] sm:text-[10px]">
                    <span className="text-amber-300/80 font-sans font-bold flex items-center gap-1">🏆 High Time</span>
                    <span className="font-bold text-amber-300">{globalFormatTime(getGroupStats(viewingGroup, dateStr).highestDone)}</span>
                  </div>
                  {/* Row 2 Col 1: Done Time */}
                  <div className="flex items-center justify-between px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[9px] sm:text-[10px]">
                    <span className="text-emerald-300/80 font-sans font-bold flex items-center gap-1">✅ Done Time</span>
                    <span className="font-bold text-emerald-300">{globalFormatTime(getGroupStats(viewingGroup, dateStr).myDone)}</span>
                  </div>
                  {/* Row 2 Col 2: Left Time */}
                  <div className="flex items-center justify-between px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-[9px] sm:text-[10px]">
                    <span className="text-indigo-300/80 font-sans font-bold flex items-center gap-1">⏳ Left Time</span>
                    <span className="font-bold text-indigo-300">{globalFormatTime(getGroupStats(viewingGroup, dateStr).myTimeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Tab-specific summary in Header */}
              {(() => {
                const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
                const myUserId = myMemberInfo?.userId || '';
                const myAllTasks = viewingGroup.memberTasks?.[myUserId] || viewingGroup.tasks || [];
                const myTabTasks = myAllTasks.filter((t: any) => (t.groupId || 0) === activeGroupTab);
                const myComps = viewingGroup.completions?.[myUserId]?.[dateStr] || {};
                const activeTabDone = myTabTasks.reduce((sum: number, t: any) => {
                  const comp = myComps[t.id];
                  if (!comp) return sum;
                  if (comp.completed) return sum + Math.max(comp.timeSpent || 0, t.duration || 0);
                  return sum + (comp.timeSpent || 0);
                }, 0);
                const activeTabDuration = myTabTasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
                const activeTabLeft = Math.max(0, activeTabDuration - activeTabDone);
                const myTabNames = viewingGroup.memberTabNames?.[myUserId] || viewingGroup.tabNames || ['Tab 1', 'Tab 2', 'Tab 3'];
                const currentTabName = myTabNames[activeGroupTab] || `Tab ${activeGroupTab + 1}`;

                return (
                  <div className="flex items-center justify-between text-[9px] px-2.5 py-1 bg-white/[0.04] rounded-lg border border-white/10 font-mono w-full">
                    <span className="text-white/60 font-sans font-medium flex items-center gap-1">
                      📌 <strong className="text-blue-300">{currentTabName}</strong> Specific:
                    </span>
                    <div className="flex items-center gap-3">
                      <span>Done: <strong className="text-emerald-300">{globalFormatTime(activeTabDone)}</strong></span>
                      <span>Left: <strong className="text-indigo-300">{globalFormatTime(activeTabLeft)}</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 3-day Abandonment Claim Banner */}
            {viewingGroup.pendingDeletion && (
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] flex items-center justify-between gap-2 shadow-sm my-0.5">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold flex items-center gap-1 text-amber-300">
                    <Clock size={11} className="animate-spin" style={{ animationDuration: '6s' }} /> Admin Left Group
                  </span>
                  <span className="text-[9px] text-white/70 truncate">
                    Group scheduled for deletion in 3 days unless claimed!
                  </span>
                </div>
                <button
                  onClick={() => handleClaimLeadership(viewingGroup._id)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[9.5px] font-bold rounded-md transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  Claim Leadership
                </button>
              </div>
            )}

            {/* Editing Form or Description Strip */}
            {editingGroupId === viewingGroup._id ? (
              <form onSubmit={handleUpdateGroupInfo} className="flex flex-col gap-1.5 bg-black/40 p-2 rounded-lg border border-white/10 mt-0.5 w-full">
                <div className="flex flex-col gap-0.5 w-full">
                  <label className="text-[9px] text-white/50 font-bold uppercase">Group Title</label>
                  <input
                    autoFocus
                    value={editGroupTitle}
                    onChange={e => setEditGroupTitle(e.target.value)}
                    className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs font-bold text-white outline-none focus:border-blue-500 w-full"
                  />
                </div>
                <div className="flex flex-col gap-0.5 w-full">
                  <label className="text-[9px] text-white/50 font-bold uppercase">Group Description</label>
                  <textarea
                    rows={2}
                    value={editGroupDesc}
                    onChange={e => setEditGroupDesc(e.target.value)}
                    placeholder="Enter group description..."
                    className="bg-black/60 border border-white/20 rounded px-2 py-1 text-[10.5px] text-white outline-none focus:border-blue-500 w-full resize-none"
                  />
                </div>
                <div className="flex flex-col gap-0.5 w-full">
                  <label className="text-[9px] text-white/50 font-bold uppercase">Group Profile Photo URL</label>
                  <input
                    type="url"
                    value={editGroupAvatarUrl}
                    onChange={e => setEditGroupAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs font-mono text-white outline-none focus:border-blue-500 w-full placeholder:text-white/30"
                  />
                </div>
                <div className="flex flex-col gap-2 p-2 bg-black/40 border border-white/10 rounded-lg my-1 w-full">
                  {/* Private vs Public Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-white/90">Group Visibility</span>
                      <span className="text-[8.5px] text-white/50">
                        {editGroupIsPrivate ? 'Private (Hidden from discovery)' : 'Public (Discoverable by everyone)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditGroupIsPrivate(!editGroupIsPrivate)}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editGroupIsPrivate ? 'bg-purple-600' : 'bg-blue-600'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editGroupIsPrivate ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="h-px bg-white/10 w-full" />

                  {/* Request Access / Instant Join Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-white/90">
                        {editGroupIsPrivate ? 'Allow Join Requests' : 'Require Admin Approval to Join'}
                      </span>
                      <span className="text-[8.5px] leading-tight">
                        {editGroupAllowRequests ? (
                          editGroupIsPrivate ? (
                            <span className="text-amber-300/90 font-medium">📩 Users can send join requests to admin</span>
                          ) : (
                            <span className="text-amber-300/90 font-medium">🔒 Approval Required: Members must request access to join</span>
                          )
                        ) : (
                          editGroupIsPrivate ? (
                            <span className="text-rose-300/90 font-medium">🚫 Invite Only: Join requests blocked</span>
                          ) : (
                            <span className="text-emerald-300 font-bold">⚡ Anyone can join instantly without request access</span>
                          )
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditGroupAllowRequests(!editGroupAllowRequests)}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editGroupAllowRequests ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editGroupAllowRequests ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <button type="submit" className="px-2.5 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] rounded font-bold">Save</button>
                  <button type="button" onClick={() => setEditingGroupId(null)} className="px-2.5 py-0.5 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded font-bold">Cancel</button>
                </div>
              </form>
            ) : viewingGroup.description && (
              <div
                onDoubleClick={() => {
                  if (isAdmin) {
                    setEditGroupTitle(viewingGroup.title);
                    setEditGroupDesc(viewingGroup.description || '');
                    setEditGroupAvatarUrl(viewingGroup.avatarUrl || '');
                    setEditGroupIsPrivate(viewingGroup.isPrivate || false);
                    setEditGroupAllowRequests(viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true);
                    setEditingGroupId(viewingGroup._id);
                  }
                }}
                className={`w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 ${isAdmin ? 'cursor-text' : ''}`}
                title={isAdmin ? "Double click to edit" : ""}
              >
                <p className="text-[10.5px] sm:text-xs text-white/80 leading-snug break-words">
                  {viewingGroup.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {requests.filter(r => String(r.groupId) === String(viewingGroup._id)).length > 0 && members.find((m: any) => m.isMe)?.role === 'admin' && (
          <div className="mb-3 px-1 border border-blue-500/30 bg-blue-500/5 rounded-xl p-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-300/80 mb-2 px-1">Join Requests</h4>
            <div className="flex flex-col gap-1.5">
              {requests.filter(r => String(r.groupId) === String(viewingGroup._id)).map(req => (
                <div key={req._id} className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white/90">{req.username}</span>
                    <span className="text-[9px] text-white/50">wants to join this group</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleProcessRequest(req._id, 'accepted')} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-colors cursor-pointer" type="button">
                      <Check size={14} />
                    </button>
                    <button onClick={() => handleProcessRequest(req._id, 'rejected')} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer" type="button">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!members.find((m: any) => m.isMe) && !groups.some(g => String(g._id) === String(viewingGroup._id))) && viewingGroup.isPrivate ? (
          <div className="flex flex-col items-center justify-center p-8 bg-black/20 border border-white/5 rounded-xl my-4">
            <ShieldAlert size={32} className="text-white/20 mb-3" />
            <h4 className="text-sm font-bold text-white/70 mb-1">Private Group</h4>
            <p className="text-[10px] text-white/40 text-center max-w-[250px]">
              The tasks and progress of this group are hidden from non-members.
              {(viewingGroup.allowJoinRequests !== false) ? ' You can request to join to gain access.' : ' The Admin of this Group has blocked join requests.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 mb-3 w-full bg-black/40 p-2 rounded-xl border border-white/10">
              {/* Row 1: Day Switcher + Group Header Tab Selector */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
                {/* Day Switcher */}
                <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setViewingDay('yesterday')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${viewingDay === 'yesterday' ? 'bg-purple-500/80 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                  >
                    <Calendar size={11} /> Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingDay('today')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${viewingDay === 'today' ? 'bg-blue-500/80 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                  >
                    Today
                  </button>
                </div>

                {/* Group Header Tab Selector (Group Level Tab Names) */}
                <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10 w-full sm:w-auto sm:flex-1 max-w-full sm:max-w-sm p-0.5 gap-1">
                  {(() => {
                    const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
                    const myUserId = myMemberInfo?.userId || '';
                    const groupTabNames = viewingGroup.tabNames || ['Tab 1', 'Tab 2', 'Tab 3'];

                    return groupTabNames.map((tabName: string, idx: number) => {
                      const isEditingThisTab = editingTabIdx === idx;

                      return (
                        <div
                          key={idx}
                          className={`flex-1 flex items-center justify-center rounded-md text-[9.5px] font-bold uppercase transition-all ${
                            activeGroupTab === idx
                              ? 'bg-blue-500/25 text-blue-300 border border-blue-400/40 shadow-sm'
                              : 'text-white/50 hover:text-white/80 border border-transparent'
                          }`}
                        >
                          {isEditingThisTab ? (
                            <input
                              type="text"
                              autoFocus
                              value={editingTabName}
                              onChange={(e) => setEditingTabName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const currentNames = [...groupTabNames];
                                  currentNames[idx] = editingTabName.trim() || `Tab ${idx + 1}`;
                                  handleUpdateGroupTabNames(viewingGroup._id, currentNames);
                                  setEditingTabIdx(null);
                                }
                                if (e.key === 'Escape') setEditingTabIdx(null);
                              }}
                              onBlur={() => {
                                const currentNames = [...groupTabNames];
                                currentNames[idx] = editingTabName.trim() || `Tab ${idx + 1}`;
                                handleUpdateGroupTabNames(viewingGroup._id, currentNames);
                                setEditingTabIdx(null);
                              }}
                              className="w-full bg-black/80 border border-blue-400 rounded px-1 py-0.5 text-[9.5px] text-white outline-none text-center font-bold"
                            />
                          ) : (
                            <div
                              onClick={() => setActiveGroupTab(idx)}
                              onDoubleClick={() => {
                                const isGroupAdmin = viewingGroup.adminId === myUserId || viewingGroup.members?.some((m: any) => (m.isMe || m.username === myUsername) && m.role === 'admin');
                                if (isGroupAdmin) {
                                  setEditingTabIdx(idx);
                                  setEditingTabName(tabName);
                                }
                              }}
                              className="w-full py-1 px-1.5 flex items-center justify-center gap-1 cursor-pointer truncate"
                              title={viewingGroup.adminId === myUserId ? "Double click to rename group header tab" : "Group Header Tab"}
                            >
                              <span className="truncate">{tabName}</span>
                              {activeGroupTab === idx && (
                                <span className="text-[7.5px] text-blue-300/60 font-mono">✏️</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Row 2: Member Search Bar (Single Dedicated Full Width for Desktop & Mobile) */}
              <div className="relative w-full">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search member..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-6 py-1.5 text-[10px] text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-all font-semibold"
                />
                {memberSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-[10px] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Member Leaderboard & Status Overview */}
            <div className="pb-6">
              {(() => {
                const getMemberTasks = (m: any) => {
                  if (!m) return [];
                  const uId = m.userId || '';
                  const uName = m.username || '';
                  if (viewingGroup.memberTasks) {
                    if (uId && viewingGroup.memberTasks[uId] !== undefined) return viewingGroup.memberTasks[uId];
                    if (uName && viewingGroup.memberTasks[uName] !== undefined) return viewingGroup.memberTasks[uName];
                  }
                  const isGroupAdmin = viewingGroup.adminId === uId || viewingGroup.adminId === uName || m.role === 'admin';
                  if (isGroupAdmin) return viewingGroup.tasks || [];
                  return [];
                };

                const getMemberCompletions = (m: any) => {
                  if (!m) return {};
                  const uId = m.userId || '';
                  const uName = m.username || '';
                  if (viewingGroup.completions) {
                    if (uId && viewingGroup.completions[uId]?.[dateStr]) return viewingGroup.completions[uId][dateStr];
                    if (uName && viewingGroup.completions[uName]?.[dateStr]) return viewingGroup.completions[uName][dateStr];
                  }
                  return {};
                };

                const getMemberTotalDoneByMember = (m: any) => {
                  const allGTasks = getMemberTasks(m);
                  const uComps = getMemberCompletions(m);
                  return allGTasks.reduce((sum: number, t: any) => {
                    const comp = uComps[t.id];
                    if (!comp) return sum;
                    if (comp.completed) return sum + Math.max(comp.timeSpent || 0, t.duration || 0);
                    return sum + (comp.timeSpent || 0);
                  }, 0);
                };

                const getMemberTotalLeftByMember = (m: any) => {
                  const allGTasks = getMemberTasks(m);
                  const uComps = getMemberCompletions(m);
                  return allGTasks.reduce((sum: number, t: any) => {
                    const comp = uComps[t.id];
                    if (comp?.completed) return sum;
                    const spent = comp?.timeSpent || 0;
                    return sum + Math.max(0, (t.duration || 0) - spent);
                  }, 0);
                };

                const getMemberTotalDone = (mUserId: string) => {
                  const m = members.find((mem: any) => mem.userId === mUserId);
                  return getMemberTotalDoneByMember(m);
                };

                const getMemberTotalLeft = (mUserId: string) => {
                  const m = members.find((mem: any) => mem.userId === mUserId);
                  return getMemberTotalLeftByMember(m);
                };

                const filteredMembers = members.filter((m: any) =>
                  !memberSearchQuery || m.username?.toLowerCase().includes(memberSearchQuery.toLowerCase().trim())
                );

                const sortedMembers = [...filteredMembers].sort((a: any, b: any) => {
                  const aDone = getMemberTotalDone(a.userId);
                  const bDone = getMemberTotalDone(b.userId);
                  return bDone - aDone;
                });

                if (sortedMembers.length === 0) {
                  return (
                    <div className="w-full text-center py-6 text-[11px] text-white/50 bg-black/20 rounded-xl border border-white/5">
                      No members matching &quot;{memberSearchQuery}&quot;
                    </div>
                  );
                }

                const renderMemberCard = (member: any, rankIdx: number) => {
                  const isMe = member.isMe || member.username === myUsername;
                  const memberTab = memberActiveTabs[member.userId] !== undefined ? memberActiveTabs[member.userId] : activeGroupTab;

                  const allTasks = viewingGroup.memberTasks?.[member.userId] || viewingGroup.tasks || [];
                  const tasksInMemberTab = allTasks.filter((t: any) => (t.groupId || 0) === memberTab);
                  const completions = viewingGroup.completions?.[member.userId]?.[dateStr] || {};

                  const totalMemberDone = getMemberTotalDone(member.userId);
                  const totalMemberLeft = getMemberTotalLeft(member.userId);
                  const isGroupAdmin = member.role === 'admin';
                  const isCoAdmin = member.role === 'co-admin' || (!isGroupAdmin && Boolean(member.canEdit));
                  const viewerIsAdmin = isAdmin;

                  return (
                    <div
                      key={member.userId}
                      className={`relative bg-black/40 border p-1.5 pt-2.5 rounded-xl flex flex-col gap-1 shadow-sm transition-all w-full h-fit ${
                        isGroupAdmin
                          ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-black/40 to-black/40 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                          : isCoAdmin
                          ? 'border-sky-500/40 bg-gradient-to-b from-sky-500/10 via-black/40 to-black/40 shadow-[0_0_10px_rgba(56,189,248,0.1)]'
                          : 'border-white/10'
                      }`}
                    >
                      {/* Top Border Role / Self Badge */}
                      {isGroupAdmin ? (
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-black/90 rounded-md text-[8px] font-black tracking-widest text-amber-400 uppercase z-20 shadow-sm border border-amber-500/40 backdrop-blur-md flex items-center gap-1">
                          <ShieldAlert size={8.5} /> {isMe ? 'ADMIN (YOU)' : 'ADMIN'}
                        </span>
                      ) : isCoAdmin ? (
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-black/90 rounded-md text-[8px] font-black tracking-widest text-sky-400 uppercase z-20 shadow-sm border border-sky-500/40 backdrop-blur-md flex items-center gap-1">
                          <ShieldAlert size={8.5} /> {isMe ? 'CO-ADMIN (YOU)' : 'CO-ADMIN'}
                        </span>
                      ) : isMe ? (
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-black/90 rounded-md text-[8px] font-black tracking-widest text-blue-400 uppercase z-20 shadow-sm border border-blue-500/50 backdrop-blur-md">
                          YOU
                        </span>
                      ) : (
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-black/90 rounded-md text-[8px] font-black tracking-widest text-white/60 uppercase z-20 shadow-sm border border-white/10 backdrop-blur-md">
                          MEMBER
                        </span>
                      )}

                      {/* Top Right Border Rank Badge */}
                      <span className={`absolute -top-2.5 right-2 px-2 py-0.5 bg-black/90 rounded-md text-[11px] font-black tracking-wider uppercase z-20 shadow-md border backdrop-blur-md ${
                        rankIdx === 0
                          ? 'text-amber-300 border-amber-500/60 shadow-amber-500/20'
                          : rankIdx === 1
                          ? 'text-slate-200 border-slate-300/60'
                          : rankIdx === 2
                          ? 'text-amber-400 border-amber-700/60'
                          : 'text-white/70 border-white/20'
                      }`}>
                        #{rankIdx + 1}
                      </span>

                      <div className="flex flex-col gap-1 border-b border-white/5 pb-1">
                        {/* Upper Row: Avatar, Username, You Tag & Admin Controls */}
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {(() => {
                              const memberAvatar = member.avatarUrl || member.profilePicture || (isMe ? (typeof window !== 'undefined' ? localStorage.getItem('dashboard_profile_picture') || '' : '') : '');
                              return (
                                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/20 bg-black/80 flex items-center justify-center shadow-md relative aspect-square">
                                  {memberAvatar ? (
                                    <img
                                      src={memberAvatar}
                                      alt={member.username}
                                      className="w-full h-full object-cover object-center aspect-square shrink-0 z-10 relative"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <span
                                    style={{ display: memberAvatar ? 'none' : 'flex' }}
                                    className="w-full h-full items-center justify-center text-white font-bold text-[10px] uppercase pointer-events-none"
                                  >
                                    {member.username?.[0] || 'U'}
                                  </span>
                                </div>
                              );
                            })()}

                            <div className="flex items-center gap-1 min-w-0 flex-wrap">
                              <span className="text-[10.5px] font-bold text-white/90 truncate max-w-[85px] sm:max-w-[110px]">
                                {member.username}
                              </span>
                              {isMe && (
                                <span className="text-[7px] bg-blue-500/30 text-blue-300 px-1 py-px rounded font-mono font-bold shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                          </div>

                          {viewerIsAdmin && !isMe && (
                            <div className="flex items-center gap-1 shrink-0">
                              <label className="text-[7.5px] text-amber-300/90 font-bold flex items-center gap-0.5 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-1 py-0.5 rounded transition-colors" title="Grant Co-Admin Rights">
                                <ShieldAlert size={7.5} className={isCoAdmin ? "text-amber-400" : "text-white/40"} />
                                <span>Co-Admin</span>
                                <input
                                  type="checkbox"
                                  checked={isCoAdmin || false}
                                  onChange={(e) => handleGrantEdit(viewingGroup._id, member.userId, e.target.checked)}
                                  className="accent-amber-500 scale-75 cursor-pointer"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(viewingGroup._id, member.userId, member.username)}
                                className="px-1 py-0.5 text-[8px] font-bold bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/30 flex items-center gap-0.5 transition-colors cursor-pointer"
                                title="Remove member from group"
                              >
                                <X size={8.5} />
                                <span>Remove</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dedicated Stats Row */}
                        <div className="flex items-center justify-between text-[7.5px] font-mono bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
                          <span className="text-white/60">Done: <strong className="text-emerald-300">{globalFormatTime(totalMemberDone)}</strong></span>
                          <span className="text-white/60">Left: <strong className="text-indigo-300">{globalFormatTime(totalMemberLeft)}</strong></span>
                        </div>
                      </div>

                      {/* Direct rendering of GroupTaskManager for each member */}
                      <div className="mt-0.5 relative min-h-[50px]">
                        <div className={!isMember ? "filter blur-sm select-none pointer-events-none opacity-20" : ""}>
                          <GroupTaskManager
                            groupId={viewingGroup._id}
                            targetUserId={member.userId}
                            activeTabProp={memberTab}
                            onTabChange={(idx) => setMemberActiveTabs(prev => ({ ...prev, [member.userId]: idx }))}
                            dateStrProp={dateStr}
                            hideHeader={true}
                          />
                        </div>

                        {!isMember && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-2 bg-black/65 backdrop-blur-[2px] rounded-lg border border-white/10 text-center shadow-lg my-auto">
                            <Lock size={14} className="text-sky-400 mb-0.5 animate-pulse" />
                            <span className="text-[9.5px] font-bold text-white/90 mb-0.5">Tasks Locked</span>
                            <span className="text-[8px] text-white/60 mb-1.5 max-w-[140px]">Join group to view live member tasks & progress</span>
                            {!sentRequests.some(r => String(r.groupId) === String(viewingGroup._id)) ? (
                              <button
                                type="button"
                                onClick={() => handleJoinRequest(viewingGroup._id)}
                                className="px-2 py-0.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-[9px] font-bold rounded shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                {viewingGroup.isPrivate ? 'Request to Join' : 'Join Group'}
                              </button>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[8.5px] font-bold rounded border border-amber-500/30">
                                Request Pending
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };

                const leftColMembers = sortedMembers.filter((_, idx) => idx % 2 === 0);
                const rightColMembers = sortedMembers.filter((_, idx) => idx % 2 === 1);

                return (
                  <>
                    {/* Desktop/Tablet Interleaved Snake Masonry (Left-to-Right #1, #2, #3, #4 Order with ZERO vertical gaps) */}
                    <div className="hidden sm:flex flex-row gap-2.5 items-start w-full">
                      {/* Left Column (#1, #3, #5...) */}
                      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                        {leftColMembers.map((member, colIdx) => renderMemberCard(member, colIdx * 2))}
                      </div>

                      {/* Right Column (#2, #4, #6...) */}
                      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                        {rightColMembers.map((member, colIdx) => renderMemberCard(member, colIdx * 2 + 1))}
                      </div>
                    </div>

                    {/* Mobile Single Column Layout */}
                    <div className="flex sm:hidden flex-col gap-2.5 w-full">
                      {sortedMembers.map((member, rankIdx) => renderMemberCard(member, rankIdx))}
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          isDestructive={confirmModal.isDestructive}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-2">

      {/* Sub Tabs */}
      <div className="flex justify-between items-center bg-white/5 rounded-xl p-1 mb-3 border border-white/10">
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeSubTab === 'groups' ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white/90'}`}
        >
          My & Joined Groups
        </button>
        <button
          onClick={() => setActiveSubTab('search')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeSubTab === 'search' ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white/90'}`}
        >
          Search
        </button>
      </div>

      <div className="flex flex-col gap-2 pb-6">
        {activeSubTab === 'groups' && (
          <>
            {requests.length > 0 && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Pending Join Requests ({requests.length})</h4>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {requests.map(req => (
                    <div key={req._id} className="bg-black/40 border border-white/10 p-2 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-white truncate">{req.username}</span>
                        <span className="text-[9px] text-white/50 truncate">wants to join <span className="text-emerald-300 font-medium">"{req.groupTitle}"</span></span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const g = groups.find((x: any) => String(x._id) === String(req.groupId));
                            if (g) setViewingGroup(g);
                            else {
                              fetch(`/api/groups/${req.groupId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('dashboard_sync_token')}` } })
                                .then(r => r.json())
                                .then(d => { if (d.group) setViewingGroup(d.group); });
                            }
                          }}
                          className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded text-[9px] font-bold transition-colors cursor-pointer border border-emerald-500/30"
                        >
                          Open Group
                        </button>
                        <button onClick={() => handleProcessRequest(req._id, 'accepted')} className="p-1 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded transition-colors cursor-pointer" type="button" title="Accept">
                          <Check size={13} />
                        </button>
                        <button onClick={() => handleProcessRequest(req._id, 'rejected')} className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors cursor-pointer" type="button" title="Reject">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div className="mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2 px-1">Pending Sent Requests</h4>
                <div className="flex flex-col gap-1.5">
                  {sentRequests.map(req => (
                    <div key={req._id} className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-xl flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white/90">{req.groupTitle}</span>
                        <span className="text-[9px] text-white/50">Request sent on {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Groups Section */}
            <div className="flex items-center justify-between mb-1 px-1 mt-2">
              <div className="flex items-center gap-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Your Groups</h4>
                <button onClick={() => setIsInfoOpen(true)} className="p-1 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <Info size={10} />
                </button>
              </div>
              <button
                onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
                className="text-[9px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1 font-bold"
              >
                {isCreateFormOpen ? <><X size={10} /> Cancel</> : <><Plus size={10} /> Create</>}
              </button>
            </div>

            {isCreateFormOpen && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl mb-3 shadow-sm">
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Group Title"
                    value={newGroupTitle}
                    onChange={e => setNewGroupTitle(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Short Description"
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-white"
                  />
                  <input
                    type="url"
                    placeholder="Group Profile Photo URL (Optional)"
                    value={newGroupAvatarUrl}
                    onChange={e => setNewGroupAvatarUrl(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-white placeholder:text-white/30 font-mono"
                  />
                  <div className="flex flex-col gap-2 p-2 bg-black/40 border border-white/10 rounded-lg my-1 w-full">
                    {/* Private vs Public Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-white/90">Group Visibility</span>
                        <span className="text-[8.5px] text-white/50">
                          {newGroupIsPrivate ? 'Private (Hidden from discovery)' : 'Public (Discoverable by everyone)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewGroupIsPrivate(!newGroupIsPrivate)}
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newGroupIsPrivate ? 'bg-purple-600' : 'bg-blue-600'}`}
                      >
                        <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newGroupIsPrivate ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="h-px bg-white/10 w-full" />

                    {/* Request Access / Instant Join Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-white/90">
                          {newGroupIsPrivate ? 'Allow Join Requests' : 'Require Admin Approval to Join'}
                        </span>
                        <span className="text-[8.5px] leading-tight">
                          {newGroupAllowRequests ? (
                            newGroupIsPrivate ? (
                              <span className="text-amber-300/90 font-medium">📩 Users can send join requests to admin</span>
                            ) : (
                              <span className="text-amber-300/90 font-medium">🔒 Approval Required: Members must request access to join</span>
                            )
                          ) : (
                            newGroupIsPrivate ? (
                              <span className="text-rose-300/90 font-medium">🚫 Invite Only: Join requests blocked</span>
                            ) : (
                              <span className="text-emerald-300 font-bold">⚡ Anyone can join instantly without request access</span>
                            )
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewGroupAllowRequests(!newGroupAllowRequests)}
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newGroupAllowRequests ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      >
                        <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newGroupAllowRequests ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {newGroupTasks.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2 bg-black/20 p-2 rounded-lg border border-white/5">
                      {newGroupTasks.map((t, idx) => (
                        <div key={t.id} className="flex items-center justify-between bg-white/5 p-1.5 rounded border border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-sky-300">{idx + 1}</span>
                            <span className="text-[10px] text-white/90">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {t.duration > 0 && <span className="text-[8px] bg-sky-500/20 text-sky-300 px-1 py-0.5 rounded">{t.duration}m</span>}
                            <button type="button" onClick={() => setNewGroupTasks(newGroupTasks.filter(x => x.id !== t.id))} className="text-white/30 hover:text-red-400 p-0.5"><Trash2 size={10} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2 border border-white/20 bg-black/20 flex gap-2 items-end mt-1 rounded-lg">
                    <div className="relative flex-1 group/task">
                      <span className="absolute -top-[9px] left-1 px-1 bg-[#1a1a1a] rounded text-[6.5px] font-bold tracking-widest text-white/40 uppercase pointer-events-none z-10 transition-colors group-hover/task:text-blue-300">
                        Task Name
                      </span>
                      <textarea
                        placeholder={`New task...`}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            handleAddGroupTask(e as any);
                          }
                        }}
                        rows={1}
                        className="w-full bg-white/5 border border-white/20 rounded-md px-2 py-1.5 text-[11px] outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder:text-white/30 shadow-inner resize-none overflow-hidden min-h-[28px] max-h-[80px]"
                      />
                    </div>
                    <div className="relative -top-[5px] flex-col items-center shrink-0 group/duration">
                      <span className="absolute -top-[9px] left-1 px-1 bg-[#1a1a1a] rounded text-[6.5px] font-bold tracking-widest text-white/40 uppercase pointer-events-none z-10 transition-colors group-hover/duration:text-blue-300 whitespace-nowrap">
                        duration(min)
                      </span>
                      <input
                        type="number"
                        placeholder="min"
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddGroupTask(e as any);
                          }
                        }}
                        className="w-[50px] bg-white/5 border border-white/20 rounded-md px-1.5 py-1.5 text-[11px] font-semibold text-center outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                      />
                    </div>
                    <button type="button" onClick={handleAddGroupTask} className="h-[28px] w-[28px] bg-white/10 hover:bg-white/20 hover:text-sky-300 rounded-md transition-all shrink-0 active:scale-95 shadow-sm border border-white/20 flex items-center justify-center mb-px">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button disabled={isCreating} onClick={handleCreateGroup as any} type="button" className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg text-[11px] font-bold transition-colors mt-2">
                    {isCreating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <GroupsLoadingSkeleton />
            ) : (
              <>
                {myGroupsList.length === 0 ? (
                  <EmptyCreatedGroupsState onOpenCreate={() => setIsCreateFormOpen(true)} />
                ) : (
                  myGroupsList.map(group => (
                    <div
                      key={group._id}
                      onClick={() => setViewingGroup(group)}
                      className="relative overflow-hidden bg-slate-900/90 border border-white/15 p-3 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-slate-900 transition-all flex flex-col gap-2 shadow-md group/card"
                    >

                      <div className="relative z-10 flex items-center justify-between gap-2.5 w-full">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-black/80 flex items-center justify-center shadow-md">
                            {group.avatarUrl ? (
                              <img src={group.avatarUrl} alt={group.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            ) : (
                              <span className="text-white font-black text-sm uppercase">{group.title?.[0] || 'G'}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-white flex items-center gap-1.5 truncate group-hover/card:text-blue-300 transition-colors">
                              <span className="truncate">{group.title}</span>
                              {group.isPrivate ? (
                                <span className="text-[8px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Private</span>
                              ) : (
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Public</span>
                              )}
                            </span>
                            {group.description && <span className="text-[10px] text-white/50 truncate mt-0.5">{group.description}</span>}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-white/40 group-hover/card:text-blue-400 group-hover/card:translate-x-1 transition-all shrink-0" />
                      </div>

                      {/* Clean 4-Item Grid Table for Stats */}
                      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full pt-0.5">
                        <div className="bg-black/60 border border-white/10 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-white/50 font-medium">Members</span>
                          <span className="text-white font-bold">{group.members?.length || 0}</span>
                        </div>
                        <div className="bg-sky-950/80 border border-sky-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-sky-300/70 font-medium truncate">Target Time</span>
                          <span className="text-sky-300 font-bold ml-1 shrink-0">{globalFormatTime(getGroupStats(group).totalDuration)}</span>
                        </div>
                        <div className="bg-emerald-950/80 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-emerald-300/70 font-medium">Done</span>
                          <span className="text-emerald-300 font-bold ml-1 shrink-0">{globalFormatTime(getGroupStats(group).myDone)}</span>
                        </div>
                        <div className="bg-indigo-950/80 border border-indigo-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-indigo-300/70 font-medium">Left</span>
                          <span className="text-indigo-300 font-bold ml-1 shrink-0">{globalFormatTime(getGroupStats(group).myTimeLeft)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div className="w-full h-px bg-white/10 my-3"></div>

                {/* Joined Groups Section */}
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1 px-1">Groups you joined</h4>
                {joinedGroupsList.length === 0 ? (
                  <EmptyJoinedGroupsState onSwitchToSearch={() => setActiveSubTab('search')} />
                ) : (
                  joinedGroupsList.map(group => (
                    <div
                      key={group._id}
                      onClick={() => setViewingGroup(group)}
                      className="relative overflow-hidden bg-slate-900/90 border border-white/15 p-3 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-slate-900 transition-all flex flex-col gap-2 shadow-md group/card"
                    >

                      <div className="relative z-10 flex items-center justify-between gap-2.5 w-full">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-black/80 flex items-center justify-center shadow-md">
                            {group.avatarUrl ? (
                              <img src={group.avatarUrl} alt={group.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            ) : (
                              <span className="text-white font-black text-sm uppercase">{group.title?.[0] || 'G'}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-white flex items-center gap-1.5 truncate group-hover/card:text-blue-300 transition-colors">
                              <span className="truncate">{group.title}</span>
                              {group.isPrivate ? (
                                <span className="text-[8px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Private</span>
                              ) : (
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Public</span>
                              )}
                            </span>
                            {group.description && <span className="text-[10px] text-white/50 truncate mt-0.5">{group.description}</span>}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-white/40 group-hover/card:text-blue-400 group-hover/card:translate-x-1 transition-all shrink-0" />
                      </div>

                      {/* Clean 4-Item Grid Table for Stats */}
                      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full pt-0.5">
                        <div className="bg-black/60 border border-white/10 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-white/50 font-medium">Members</span>
                          <span className="text-white font-bold">{group.members?.length || 0}</span>
                        </div>
                        <div className="bg-sky-950/80 border border-sky-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-sky-300/70 font-medium truncate">Target Time</span>
                          <span className="text-sky-300 font-bold ml-1 shrink-0">{globalFormatTime(getGroupStats(group).totalDuration)}</span>
                        </div>
                        <div className="bg-emerald-950/80 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-emerald-300/70 font-medium">Done</span>
                          <span className="text-emerald-300 font-bold ml-1 shrink-0">{globalFormatTime(getGroupStats(group).myDone)}</span>
                        </div>
                        <div className="bg-indigo-950/80 border border-indigo-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[8.5px] xs:text-[9.5px]">
                          <span className="text-indigo-300/70 font-medium">Left</span>
                          <span className="text-indigo-300 font-bold ml-1 shrink-0">{globalFormatTime(getGroupStats(group).myTimeLeft)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </>
        )}

        {activeSubTab === 'search' && (
          <>
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Search groups or leave empty for all..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 text-white"
              />
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 p-2 rounded-xl transition-colors shrink-0">
                <Search size={14} className="text-white" />
              </button>
            </form>

            {isSearchingGroups ? (
              <GroupSearchLoadingSkeleton />
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {searchResults.map(group => {
                  const isMember = groups.some(g => String(g._id) === String(group._id)) || group.members?.some((m: any) => m.isMe);
                  const hasSentReq = sentRequests.some(r => String(r.groupId) === String(group._id));

                  return (
                    <div
                      key={group._id}
                      onClick={() => setViewingGroup(groups.find(g => String(g._id) === String(group._id)) || group)}
                      className="relative overflow-hidden bg-slate-900/90 border border-white/15 p-2.5 sm:p-3 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-slate-900 transition-all flex flex-col gap-2 shadow-md group/card"
                    >

                      <div className="relative z-10 flex items-center justify-between gap-2.5 w-full">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-black/80 flex items-center justify-center shadow-md">
                            {group.avatarUrl ? (
                              <img src={group.avatarUrl} alt={group.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            ) : (
                              <span className="text-white font-black text-xs sm:text-sm uppercase">{group.title?.[0] || 'G'}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white group-hover/card:text-blue-300 transition-colors truncate">{group.title}</span>
                              <span className={`text-[7.5px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${group.isPrivate ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : (group.allowJoinRequests !== false ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')}`}>
                                {group.isPrivate ? '🔒 Private' : (group.allowJoinRequests !== false ? '🌐 Approval Required' : '🌐 Instant Join')}
                              </span>
                            </div>
                            {group.description && <span className="text-[9.5px] sm:text-[10px] text-white/50 truncate mt-0.5">{group.description}</span>}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center justify-end">
                          {isMember ? (
                            <span className="text-[8.5px] sm:text-[9.5px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-bold">Joined</span>
                          ) : hasSentReq ? (
                            <span className="text-[8.5px] sm:text-[9.5px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-bold">Pending</span>
                          ) : (group.isPrivate && group.allowJoinRequests === false) ? (
                            <span className="text-[8.5px] sm:text-[9.5px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-bold">Blocked</span>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); handleJoinRequest(group._id); }} className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-[9.5px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl transition-all font-bold flex items-center gap-1 shadow-md active:scale-95">
                              <Plus size={11} /> {group.isPrivate ? "Request" : (group.allowJoinRequests === false ? "Join" : "Request")}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-2 pt-0.5">
                        <span className="text-[8.5px] sm:text-[9.5px] font-bold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-400/25">
                          👥 {group.memberCount || group.members?.length || 0} Members
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : hasSearched ? (
              <EmptyGroupSearchState query={searchQuery} />
            ) : null}
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        confirmText={confirmModal.confirmText}
        hideCancel={confirmModal.hideCancel}
      />

      {isInfoOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in" onClick={() => setIsInfoOpen(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <Info className="w-4 h-4 text-blue-500" />
                About Groups
              </h3>
              <button onClick={() => setIsInfoOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-xs text-white/70 leading-relaxed custom-scrollbar">
              <p className="mb-3">
                <strong>Why join or create a Group?</strong> Working in a group is the ultimate way to stay accountable and push your focus limits! Whether you are preparing for competitive exams like GATE, studying for tech/IT jobs, or building projects, seeing how rivals and friends perform keeps you motivated.
              </p>
              <ul className="list-disc pl-4 space-y-2 mb-3">
                <li><strong>⚔️ Work Against Rivals (Public Groups):</strong> Join public goal groups instantly! Compare daily focus hours with rivals studying for the same goal (GATE, IT, UPSC, Coding) and push each other to rank #1.</li>
                <li><strong>🔒 Private Friend Circles (Private Groups):</strong> Create a private team for your close group of friends to coordinate study sessions and daily task completion.</li>
                <li><strong>📊 Live Leaderboard & Tab Focus:</strong> Member cards are ranked live by total focus time done across all tab sections. See tab-by-tab breakdown for each member!</li>
                <li><strong>✏️ Member Task Control:</strong> All members can add and refine tasks (up to 6 per tab section).</li>
                <li><strong>👑 Admin Succession:</strong> If an admin leaves, leadership automatically transfers to the next member. Abandoned groups have a 3-day grace period to be claimed before deletion.</li>
              </ul>
              <p>For more detailed information, please refer to the User Manual in settings.</p>
            </div>
            <div className="p-3 border-t border-white/5 bg-black/20 flex justify-end">
              <button onClick={() => setIsInfoOpen(false)} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Onboarding & Controls Guide Modal */}
      {showWelcomeModal && viewingGroup && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in"
          onClick={dismissWelcomeModal}
        >
          <div
            className="bg-[#121216] border border-blue-500/35 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.25)] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="relative p-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
                  <Sparkles className="w-5 h-5 animate-pulse text-blue-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-wide truncate">
                    Welcome to {viewingGroup.title}!
                  </h3>
                  <span className="text-[10px] text-blue-300/80 font-medium">
                    Member Quick Guide & Task Controls
                  </span>
                </div>
              </div>
              <button
                onClick={dismissWelcomeModal}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Guide Content */}
            <div className="p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
              <p className="text-[11px] text-white/70 leading-relaxed">
                Here is what you can do in <strong className="text-white">{viewingGroup.title}</strong> to track your focus & rank up on the leaderboard:
              </p>

              {/* Feature 1: Add & Edit Tasks */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                  <Plus size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-emerald-300">1. Add & Edit Your Tasks</span>
                  <span className="text-[10px] text-white/60 leading-normal mt-0.5">
                    Use the input box at the bottom of your member card to add tasks with custom target durations (minutes). Double-click task titles or duration tags anytime to edit them.
                  </span>
                </div>
              </div>

              {/* Feature 2: Run Timers & Track Time */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0 mt-0.5">
                  <Clock size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-sky-300">2. Run Timers & Track Time</span>
                  <span className="text-[10px] text-white/60 leading-normal mt-0.5">
                    Click the Play ▶ button on your tasks to start live timing. As you work, your logged time automatically updates your stats!
                  </span>
                </div>
              </div>

              {/* Feature 3: Delete & Manage */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                  <Trash2 size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-purple-300">3. Complete, Restart & Delete</span>
                  <span className="text-[10px] text-white/60 leading-normal mt-0.5">
                    Check off tasks as done, click restart ↺ to clear elapsed time, or click the trash 🗑 icon to delete a task.
                  </span>
                </div>
              </div>

              {/* Feature 4: Leaderboard Rank */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <Flame size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-amber-300">4. Leaderboard Ranking</span>
                  <span className="text-[10px] text-white/60 leading-normal mt-0.5">
                    Your member card rank badge (#1, #2, #3...) updates live based on your total completed focus time in this group!
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={dismissWelcomeModal}
                className="w-full py-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Got It! Let's Start Grinding</span> 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Users, Search, Plus, Trash, Trash2, Check, X, ShieldAlert, ArrowLeft, ArrowRight, Edit2, Settings, Info, Clock, Sparkles, Flame } from 'lucide-react';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';

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
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [newGroupAllowRequests, setNewGroupAllowRequests] = useState(true);
  const [newGroupTasks, setNewGroupTasks] = useState<{id: string, title: string, duration: number}[]>([]);
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
  const [editGroupIsPrivate, setEditGroupIsPrivate] = useState(false);
  const [editGroupAllowRequests, setEditGroupAllowRequests] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const userId = localStorage.getItem('dashboard_username'); // Need user ID or just use username to identify

  useEffect(() => {
    fetchData();
  }, []);

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
        body: JSON.stringify({ title: newGroupTitle, description: newGroupDesc, isPrivate: newGroupIsPrivate, allowJoinRequests: newGroupAllowRequests, tasks: newGroupTasks })
      });
      const data = await res.json();
      if (res.ok) {
        setNewGroupTitle('');
        setNewGroupDesc('');
        setNewGroupIsPrivate(false);
        setNewGroupAllowRequests(true);
        setNewGroupTasks([]);
        setNewTaskTitle('');
        setNewTaskDuration('');
        fetchData();
        setIsCreateFormOpen(false);
      } else {
        alert(data.error || 'Failed to create group');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while creating the group.');
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
        alert('Join request sent!');
        fetchData();
      } else {
        alert(data.error || 'Failed to send request');
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
    const dur = parseInt(newTaskDuration);
    setNewGroupTasks([...newGroupTasks, {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      duration: isNaN(dur) || dur < 0 ? 0 : dur
    }]);
    setNewTaskTitle('');
    setNewTaskDuration('');
  };

  const handleEditGroupTaskDuration = async (groupId: string, taskId: string, duration: number) => {
    const token = localStorage.getItem('dashboard_sync_token');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'edit_group_task_duration', taskId, duration })
      });
      if (res.ok) {
        fetchData();
        setViewingGroup((prev: any) => {
          if (!prev) return prev;
          const newTasks = prev.tasks?.map((t: any) => t.id === taskId ? { ...t, duration } : t);
          return { ...prev, tasks: newTasks };
        });
        
        // Sync the change to the global store so TaskManager updates instantly
        const store = useDashboardStore.getState();
        const updatedUserGroups = store.userGroups.map((g: any) => {
            if (String(g._id) === String(groupId)) {
                return {
                    ...g,
                    tasks: g.tasks?.map((t: any) => t.id === taskId ? { ...t, duration } : t)
                };
            }
            return g;
        });
        store.setUserGroups(updatedUserGroups);
      }
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
    } catch (e) {}
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
    } catch (e) {}
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
          setViewingGroup({...viewingGroup, members: viewingGroup.members.map((m: any) => m.userId === targetUserId ? {...m, canEdit} : m)});
      }
    } catch (e) {}
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
            fetchData();
            if (viewingGroup) {
              setViewingGroup({ ...viewingGroup, members: viewingGroup.members.filter((m: any) => m.userId !== targetUserId) });
            }
          }
        } catch (e) {}
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
        body: JSON.stringify({ action: 'update_info', title: editGroupTitle.trim(), description: editGroupDesc.trim(), isPrivate: editGroupIsPrivate, allowJoinRequests: editGroupAllowRequests })
      });
      if (res.ok) {
        if (viewingGroup) {
            setViewingGroup({ ...viewingGroup, title: editGroupTitle.trim(), description: editGroupDesc.trim(), isPrivate: editGroupIsPrivate, allowJoinRequests: editGroupAllowRequests });
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

  const myGroupsList = groups.filter(g => g.members.some((m: any) => m.isMe && m.role === 'admin'));
  const joinedGroupsList = groups.filter(g => g.members.some((m: any) => m.isMe && m.role !== 'admin'));

  const getGroupStats = (group: any) => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    let myDone = 0;
    const tasks = group.tasks || [];
    const totalDuration = tasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
    
    const myMemberInfo = group.members?.find((m: any) => m.isMe || m.username === myUsername);
    const myUserId = myMemberInfo ? myMemberInfo.userId : null;
    
    if (group.completions && myUserId) {
        const todayComps = group.completions[myUserId]?.[todayStr] || {};
        for (const t of tasks) {
            const comp = todayComps[t.id];
            if (comp) {
                if (comp.completed) {
                    myDone += Math.max(comp.timeSpent || 0, t.duration || 0);
                } else {
                    myDone += (comp.timeSpent || 0);
                }
            }
        }
    }
    
    const myTimeLeft = Math.max(0, totalDuration - myDone);
    return { totalDuration, myDone, myTimeLeft };
  };

  const globalFormatTime = (mins: number) => {
    if (mins === 0) return '0m';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (viewingGroup) {
      return (
        <div className="flex flex-col w-full animate-in fade-in slide-in-from-right-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/10 shadow-sm">
                <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                    <button 
                        onClick={() => setViewingGroup(null)} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0 text-white/70 hover:text-white mt-0.5 sm:mt-0"
                        title="Back to groups"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex flex-col min-w-0 flex-1">
                        {editingGroupId === viewingGroup._id ? (
                            <form onSubmit={handleUpdateGroupInfo} className="flex flex-col gap-1 w-full">
                                <input 
                                    autoFocus
                                    value={editGroupTitle}
                                    onChange={e => setEditGroupTitle(e.target.value)}
                                    className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-xs sm:text-sm font-bold text-white outline-none focus:border-blue-500 w-full"
                                />
                                <input 
                                    value={editGroupDesc}
                                    onChange={e => setEditGroupDesc(e.target.value)}
                                    className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] text-white outline-none focus:border-blue-500 w-full"
                                />
                                <label className="flex items-center gap-1.5 mt-1 cursor-pointer w-fit">
                                    <input 
                                        type="checkbox" 
                                        checked={editGroupIsPrivate}
                                        onChange={e => setEditGroupIsPrivate(e.target.checked)}
                                        className="accent-blue-500"
                                    />
                                    <span className="text-[9px] sm:text-[10px] text-white/70">Private Group (Hide tasks from non-members)</span>
                                </label>
                                <label className="flex items-center gap-1.5 mt-1 cursor-pointer w-fit">
                                    <input 
                                        type="checkbox" 
                                        checked={editGroupAllowRequests}
                                        onChange={e => setEditGroupAllowRequests(e.target.checked)}
                                        className="accent-blue-500"
                                    />
                                    <span className="text-[9px] sm:text-[10px] text-white/70">Allow Join Requests</span>
                                </label>
                                <div className="flex gap-1 mt-1">
                                    <button type="submit" className="px-2 py-0.5 bg-blue-500 text-white text-[9px] rounded font-bold">Save</button>
                                    <button type="button" onClick={() => setEditingGroupId(null)} className="px-2 py-0.5 bg-white/10 text-white text-[9px] rounded font-bold">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div 
                                onDoubleClick={() => {
                                    if (viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin') {
                                        setEditGroupTitle(viewingGroup.title);
                                        setEditGroupDesc(viewingGroup.description || '');
                                        setEditGroupIsPrivate(viewingGroup.isPrivate || false);
                                        setEditGroupAllowRequests(viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true);
                                        setEditingGroupId(viewingGroup._id);
                                    }
                                }}
                                className={`flex flex-col min-w-0 gap-1 ${viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' ? "cursor-text" : ""}`}
                                title={viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' ? "Double click to edit title & description" : ""}
                            >
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <h3 className="font-bold truncate text-white/90 text-xs sm:text-sm md:text-base">{viewingGroup.title}</h3>
                                    <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin') {
                                                    handleToggleGroupPrivacy(viewingGroup._id, viewingGroup.isPrivate);
                                                }
                                            }}
                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shadow-sm transition-colors ${viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${viewingGroup.isPrivate ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}
                                            title={viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' ? "Click to toggle privacy" : "Privacy status"}
                                        >
                                            {viewingGroup.isPrivate ? <><ShieldAlert size={8} /> Private</> : <><Check size={8} /> Public</>}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin') {
                                                    const currentStatus = viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true;
                                                    handleToggleGroupRequests(viewingGroup._id, currentStatus);
                                                }
                                            }}
                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shadow-sm transition-colors ${viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${(viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}
                                            title={viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' ? "Click to toggle join requests" : "Join requests status"}
                                        >
                                            {(viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true) ? <><Check size={8} /> Requests Allowed</> : <><ShieldAlert size={8} /> Requests Blocked</>}
                                        </button>
                                    </div>
                                </div>
                                {viewingGroup.description && (
                                    <p className="text-[9.5px] sm:text-[10px] text-white/50 whitespace-normal leading-snug">
                                        {viewingGroup.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' && (
                        <button 
                            onClick={() => {
                                setEditGroupTitle(viewingGroup.title);
                                setEditGroupDesc(viewingGroup.description || '');
                                setEditGroupIsPrivate(viewingGroup.isPrivate || false);
                                setEditGroupAllowRequests(viewingGroup.allowJoinRequests !== undefined ? viewingGroup.allowJoinRequests : true);
                                setEditingGroupId(viewingGroup._id);
                            }}
                            className="px-2 py-1 flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm border border-white/10"
                            title="Group Settings"
                        >
                            <Settings size={12} />
                            <span>Settings</span>
                        </button>
                    )}
                    {!viewingGroup.members.find((m: any) => m.isMe) && (
                        (viewingGroup.isPrivate && viewingGroup.allowJoinRequests === false) ? (
                            <span className="p-1.5 px-2.5 bg-red-500/20 text-red-400 text-[9px] sm:text-[10px] font-bold rounded-lg border border-red-500/30 whitespace-nowrap">
                                Requests Not Allowed
                            </span>
                        ) : (
                            <button 
                                onClick={() => handleJoinRequest(viewingGroup._id)}
                                disabled={sentRequests.some(r => String(r.groupId) === String(viewingGroup._id))}
                                className="p-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white text-[9px] sm:text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                                {sentRequests.some(r => String(r.groupId) === String(viewingGroup._id)) ? 'Pending' : viewingGroup.isPrivate ? 'Request' : 'Join'}
                            </button>
                        )
                    )}
                    {viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' && (
                        <button 
                            type="button"
                            onClick={() => handleDeleteGroup(viewingGroup._id, viewingGroup.title)} 
                            className="px-2 py-1 text-[9px] sm:text-[10px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer border border-red-500/20"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {requests.filter(r => String(r.groupId) === String(viewingGroup._id)).length > 0 && viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin' && (
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

            {(!viewingGroup.members.find((m: any) => m.isMe) && !groups.some(g => String(g._id) === String(viewingGroup._id))) && viewingGroup.isPrivate ? (
                <div className="flex flex-col items-center justify-center p-8 bg-black/20 border border-white/5 rounded-xl my-4">
                    <ShieldAlert size={32} className="text-white/20 mb-3" />
                    <h4 className="text-sm font-bold text-white/70 mb-1">Private Group</h4>
                    <p className="text-[10px] text-white/40 text-center max-w-[250px]">
                        The tasks and progress of this group are hidden from non-members.
                        {(viewingGroup.allowJoinRequests !== false) ? ' You can request to join to gain access.' : ' The admin has blocked join requests.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col items-center gap-2 mb-3 w-full">
                    {(() => {
                        const myMemberInfo = viewingGroup.members?.find((m: any) => m.isMe || m.username === myUsername);
                        const myCompletionsForDay = myMemberInfo ? (viewingGroup.completions?.[myMemberInfo.userId]?.[dateStr] || {}) : {};
                        const groupTasks = viewingGroup.tasks || [];
                        const groupReferenceDuration = groupTasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
                        const myDoneForDay = groupTasks.reduce((sum: number, t: any) => {
                            const comp = myCompletionsForDay[t.id];
                            if (!comp) return sum;
                            if (comp.completed) {
                                return sum + Math.max(comp.timeSpent || 0, t.duration || 0);
                            }
                            return sum + (comp.timeSpent || 0);
                        }, 0);

                        const myTimeLeftForDay = Math.max(0, groupReferenceDuration - myDoneForDay);

                        return (
                            <div className="flex items-center justify-center flex-wrap gap-2 mb-3 w-full">
                                <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-950/70 via-blue-900/40 to-sky-950/70 px-3 py-1.5 rounded-xl border border-sky-400/35 shadow-md hover:border-sky-400/50 transition-all">
                                    <Clock size={13} className="text-sky-300 animate-pulse" />
                                    <span className="text-[10px] font-bold text-sky-200/80 tracking-wider">Group Ref:</span>
                                    <span className="text-[11px] font-black text-sky-300 font-mono tracking-tight">{globalFormatTime(groupReferenceDuration)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-950/70 via-teal-900/40 to-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-400/35 shadow-md hover:border-emerald-400/50 transition-all">
                                    <Check size={13} className="text-emerald-300" />
                                    <span className="text-[10px] font-bold text-emerald-200/80 tracking-wider">My Done:</span>
                                    <span className="text-[11px] font-black text-emerald-300 font-mono tracking-tight">{globalFormatTime(myDoneForDay)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-950/70 via-purple-900/40 to-indigo-950/70 px-3 py-1.5 rounded-xl border border-indigo-400/35 shadow-md hover:border-indigo-400/50 transition-all">
                                    <Flame size={13} className="text-indigo-300 animate-pulse" />
                                    <span className="text-[10px] font-bold text-indigo-200/80 tracking-wider">Time Left:</span>
                                    <span className="text-[11px] font-black text-indigo-300 font-mono tracking-tight">{globalFormatTime(myTimeLeftForDay)}</span>
                                </div>
                            </div>
                        );
                    })()}
                        <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10 w-fit">
                            <button
                                onClick={() => setViewingDay('yesterday')}
                                className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors ${viewingDay === 'yesterday' ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                Yesterday
                            </button>
                            <button
                                onClick={() => setViewingDay('today')}
                                className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors ${viewingDay === 'today' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                Today
                            </button>
                        </div>
                        <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10 w-full max-w-sm">
                            {(viewingGroup.tabNames || ['Tab 1', 'Tab 2', 'Tab 3']).map((tabName: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveGroupTab(idx)}
                                    className={`flex-1 px-2 py-1.5 text-[9px] font-bold uppercase transition-colors truncate ${activeGroupTab === idx ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500' : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'}`}
                                >
                                    {tabName}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {viewingGroup.members.map((member: any) => {
                            // Calculate completions for this member for the specific day
                            const allTasks = viewingGroup.tasks || [];
                            const tasks = allTasks.filter((t: any) => (t.groupId || 0) === activeGroupTab);
                            const completions = viewingGroup.completions?.[member.userId]?.[dateStr] || {};
                            const totalTasks = allTasks.length;
                            const completedTasks = allTasks.filter((t: any) => completions[t.id]?.completed).length;
                            
                            const totalTimeSpent = allTasks.reduce((sum: number, t: any) => sum + (completions[t.id]?.timeSpent || 0), 0);
                            const totalDuration = allTasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
                            const timeRemaining = Math.max(0, totalDuration - totalTimeSpent);
                            
                            const formatTime = (mins: number) => {
                                if (mins === 0) return '0m';
                                if (mins < 60) return `${mins}m`;
                                return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                            };
                            const isGroupAdmin = viewingGroup.members.find((m: any) => m.isMe)?.role === 'admin';

                            return (
                                <div key={member.userId} className="bg-black/40 border border-white/10 p-2 sm:p-3 rounded-xl flex flex-col gap-1.5 sm:gap-2 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5 sm:pb-2">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[10px] sm:text-xs font-bold text-white/90 flex items-center gap-1.5 truncate">
                                                {member.username} {member.role === 'admin' && <ShieldAlert size={10} className="text-yellow-400 shrink-0" />}
                                            </span>
                                            <div className="flex flex-col mt-0.5">
                                                <div className="text-[8px] sm:text-[10px] text-white/60">
                                                    Tasks: <span className="font-mono text-blue-300">{completedTasks}/{totalTasks}</span>
                                                </div>
                                                <div className="text-[8px] sm:text-[10px] text-white/60">
                                                    Time left: <span className="font-mono text-sky-300">{formatTime(timeRemaining)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {isGroupAdmin && !member.isMe && (
                                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                                <label className="text-[8px] sm:text-[9px] text-white/50 flex items-center gap-1 cursor-pointer">
                                                    Edit Rights
                                                    <input 
                                                        type="checkbox" 
                                                        checked={member.canEdit || false}
                                                        onChange={(e) => handleGrantEdit(viewingGroup._id, member.userId, e.target.checked)}
                                                        className="accent-blue-500 scale-90 sm:scale-100"
                                                    />
                                                </label>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveMember(viewingGroup._id, member.userId, member.username)}
                                                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[9px] font-bold bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded transition-colors cursor-pointer shadow-sm"
                                                    title="Remove member"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Render Tasks as Cards */}
                                    {tasks.length > 0 ? (
                                        <div className="flex flex-col gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                                            {tasks.map((task: any, index: number) => {
                                                const isTaskDone = completions[task.id]?.completed || false;
                                                const timeSpent = completions[task.id]?.timeSpent || 0;
                                                return (
                                                    <div
                                                        key={task.id}
                                                        className={`group flex items-start justify-between p-1 sm:p-1.5 rounded-lg border bg-white/[0.02] transition-all shadow-sm ${isTaskDone ? 'opacity-75 grayscale-[30%]' : ''} border-white/30`}
                                                    >
                                                        <div className="flex items-start gap-1 sm:gap-1.5 flex-1 min-w-0 pl-0.5 sm:pl-1">
                                                            <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5 shrink-0 px-0.5">
                                                                <div className="flex items-center justify-center">
                                                                    {isTaskDone ? (
                                                                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] sm:rounded-[4px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex items-center justify-center">
                                                                            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] sm:rounded-[4px] border-[1.5px] border-white/40 transition-colors" />
                                                                    )}
                                                                </div>
                                                                <span className="text-[9px] sm:text-[11px] font-black text-sky-300/90 tabular-nums select-none leading-none mt-0.5">{index + 1}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0 w-full ml-0.5">
                                                                <div className={`w-full text-[9.5px] sm:text-[11px] leading-snug px-0.5 cursor-default whitespace-pre-wrap ${isTaskDone ? 'line-through text-white/60' : 'text-white/90'}`}>
                                                                    {task.title}
                                                                </div>
                                                                <div className="flex items-center gap-1 mt-0.5 overflow-hidden w-full">
                                                                    {task.duration > 0 && !isTaskDone && (
                                                                        (() => {
                                                                            const timeLeft = Math.max(0, task.duration - timeSpent);
                                                                            return editingGroupTaskDurationId === task.id && isGroupAdmin ? (
                                                                                <div className="shrink-0 flex items-center bg-sky-500/30 rounded-full border border-sky-400/30 px-1 py-px sm:px-1.5 shadow-sm">
                                                                                    <input
                                                                                        autoFocus
                                                                                        type="number"
                                                                                        defaultValue={timeLeft}
                                                                                        min="0"
                                                                                        max="999"
                                                                                        className="w-7 sm:w-8 bg-transparent text-[8px] sm:text-[9px] font-bold text-white outline-none placeholder:text-white/50 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                        onBlur={(e) => {
                                                                                            const dur = parseInt(e.target.value);
                                                                                            if (!isNaN(dur) && dur >= 0) handleEditGroupTaskDuration(viewingGroup._id, task.id, dur + timeSpent);
                                                                                            setEditingGroupTaskDurationId(null);
                                                                                        }}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter') {
                                                                                                const dur = parseInt(e.currentTarget.value);
                                                                                                if (!isNaN(dur) && dur >= 0) handleEditGroupTaskDuration(viewingGroup._id, task.id, dur + timeSpent);
                                                                                                setEditingGroupTaskDurationId(null);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                    <span className="text-[8px] sm:text-[9px] font-semibold text-white/80 ml-0.5">m</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span
                                                                                    onDoubleClick={(e) => {
                                                                                        if (isGroupAdmin) {
                                                                                            e.stopPropagation();
                                                                                            setEditingGroupTaskDurationId(task.id);
                                                                                        }
                                                                                    }}
                                                                                    className={`shrink-0 text-[8px] sm:text-[9px] font-semibold tracking-wide text-white/90 bg-sky-500/20 px-1 sm:px-1.5 py-0.5 rounded-full border border-sky-400/20 transition-colors shadow-sm ${isGroupAdmin ? 'cursor-pointer hover:bg-sky-500/40' : 'cursor-default'}`}
                                                                                    title={isGroupAdmin ? "Double click to edit duration" : "Duration"}
                                                                                >
                                                                                    {timeLeft >= 60 ? Math.floor(timeLeft / 60) + "h " + (timeLeft % 60) + "m" : timeLeft + "m"} left
                                                                                </span>
                                                                            );
                                                                        })()
                                                                    )}
                                                                    {(!isTaskDone && timeSpent > 0) ? (
                                                                        <span className={`shrink-0 text-[8px] sm:text-[9px] font-semibold tracking-wide px-1 sm:px-1.5 py-0.5 rounded-full border transition-colors shadow-sm text-emerald-200 bg-emerald-500/20 cursor-default border-emerald-400/20`}>
                                                                            {timeSpent >= 60 ? Math.floor(timeSpent / 60) + "h " + (timeSpent % 60) + "m" : timeSpent + "m"} done
                                                                        </span>
                                                                    ) : isTaskDone ? (
                                                                        <span className={`shrink-0 text-[8px] sm:text-[9px] font-semibold tracking-wide px-1 sm:px-1.5 py-0.5 rounded-full border transition-colors shadow-sm text-emerald-300/80 bg-emerald-500/10 border-emerald-500/20 cursor-default`}>
                                                                            {(() => {
                                                                                const doneMins = Math.max(timeSpent || 0, task.duration || 0);
                                                                                return doneMins >= 60 ? Math.floor(doneMins / 60) + "h " + (doneMins % 60) + "m" : doneMins + "m";
                                                                            })()} done
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-[9px] text-white/30 italic mt-1">No tasks in this group.</div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
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
                          <label className="flex items-center gap-1.5 mt-1 cursor-pointer w-fit">
                              <input 
                                  type="checkbox" 
                                  checked={newGroupIsPrivate}
                                  onChange={e => setNewGroupIsPrivate(e.target.checked)}
                                  className="accent-blue-500"
                              />
                              <span className="text-[10px] text-white/70">Private Group (Block join requests)</span>
                          </label>

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
                                              <button type="button" onClick={() => setNewGroupTasks(newGroupTasks.filter(x => x.id !== t.id))} className="text-white/30 hover:text-red-400 p-0.5"><Trash2 size={10}/></button>
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
                          <div key={group._id} onClick={() => setViewingGroup(group)} className="bg-black/40 border border-white/10 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between gap-2 shadow-sm">
                              <div className="flex flex-col min-w-0 flex-1 pr-1 pointer-events-none">
                                  <span className="text-sm font-bold text-white/90 flex items-center gap-1.5 truncate">
                                      <span className="truncate">{group.title}</span> <ShieldAlert size={12} className="text-yellow-400 shrink-0" />
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                      <span className="text-[9.5px] font-medium text-white/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap">
                                          {group.members.length} members
                                      </span>
                                      <span className="text-[9.5px] font-bold text-sky-300 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-400/25 whitespace-nowrap">
                                          Ref: {globalFormatTime(getGroupStats(group).totalDuration)}
                                      </span>
                                      <span className="text-[9.5px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-400/25 whitespace-nowrap">
                                          Done: {globalFormatTime(getGroupStats(group).myDone)}
                                      </span>
                                      <span className="text-[9.5px] font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-400/25 whitespace-nowrap">
                                          Left: {globalFormatTime(getGroupStats(group).myTimeLeft)}
                                      </span>
                                  </div>
                              </div>
                              <ArrowRight size={14} className="text-white/30 shrink-0 pointer-events-none" />
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
                          <div key={group._id} onClick={() => setViewingGroup(group)} className="bg-black/40 border border-white/10 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between gap-2 group-item shadow-sm">
                              <div className="flex flex-col min-w-0 flex-1 pr-1 pointer-events-none">
                                  <span className="text-sm font-bold text-white/90 truncate">{group.title}</span>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                      <span className="text-[9.5px] font-medium text-white/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap">
                                          {group.members.length} members
                                      </span>
                                      <span className="text-[9.5px] font-bold text-sky-300 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-400/25 whitespace-nowrap">
                                          Ref: {globalFormatTime(getGroupStats(group).totalDuration)}
                                      </span>
                                      <span className="text-[9.5px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-400/25 whitespace-nowrap">
                                          Done: {globalFormatTime(getGroupStats(group).myDone)}
                                      </span>
                                      <span className="text-[9.5px] font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-400/25 whitespace-nowrap">
                                          Left: {globalFormatTime(getGroupStats(group).myTimeLeft)}
                                      </span>
                                  </div>
                              </div>
                              <ArrowRight size={14} className="text-white/30 group-hover:text-white/70 shrink-0 pointer-events-none" />
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
                              <div key={group._id} onClick={() => setViewingGroup(groups.find(g => String(g._id) === String(group._id)) || group)} className="bg-black/40 border border-white/10 p-2.5 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-white/5 transition-colors">
                                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                                      <span className="text-xs font-bold text-white/90 truncate">{group.title}</span>
                                      <span className="text-[9px] text-white/50 truncate">{group.description}</span>
                                      <span className="text-[9px] text-blue-300 mt-0.5">{group.memberCount} members</span>
                                  </div>
                                    <div className="shrink-0 flex items-center justify-end">
                                        {isMember ? (
                                            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-bold">Joined</span>
                                        ) : hasSentReq ? (
                                            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-md font-bold">Pending</span>
                                        ) : (group.isPrivate && group.allowJoinRequests === false) ? (
                                            <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-bold">Requests Not Allowed</span>
                                        ) : (
                                            <button onClick={(e) => { e.stopPropagation(); handleJoinRequest(group._id); }} className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1">
                                                <Plus size={12} /> {group.isPrivate ? "Request" : "Join"}
                                            </button>
                                        )}
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
              <p className="mb-3">Groups allow you to collaborate and share focus tasks with up to 3 cloud-synced groups. When a group is selected in your Task Manager, any tasks completed or time spent is synced live.</p>
              <ul className="list-disc pl-4 space-y-2 mb-3">
                <li><strong>Public vs Private:</strong> Public groups can be joined instantly. Private groups require the admin to accept Join Requests (unless requests are disabled).</li>
                <li><strong>Shared Task Manager:</strong> Everyone sees the group's tasks and the total time left automatically updates.</li>
                <li><strong>Roles:</strong> Only Admins can delete the group or remove members. Members with Edit Rights can modify tasks.</li>
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
    </div>
  );
}

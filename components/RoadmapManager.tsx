"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDashboardStore, RoadmapItem, Roadmap } from '@/store/dashboardStore';
import ConfirmationModal from './ConfirmationModal';
import { ChevronUp, ChevronDown, Plus, Target, Sparkles, CheckCircle2, X, Circle, ArrowRightCircle, MoreVertical, Trash2, Edit3, Link as LinkIcon, FoldVertical, UnfoldVertical, Search, ListTodo, FileText } from 'lucide-react';
import AIAssistantModal from '@/components/modals/roadmap/AIAssistantModal';
import ScrollableWithArrows from '@/components/ScrollableWithArrows';

// --- Helper Functions ---
const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);

const getFormattedTimeLeft = (targetDate?: string) => {
  if (!targetDate) return null;
  const diffTime = new Date(targetDate).getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '0d';
  if (diffDays > 30) return `${Math.floor(diffDays / 30)}m ${diffDays % 30}d`;
  return `${diffDays}d`;
};

// --- Sub-Component: Timeline Node ---
interface TreeNodeProps {
  item: RoadmapItem;
  depth: number;
  index: number;
  expandedNodes: Set<string>;
  toggleExpand: (id: string, e: React.MouseEvent) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  handleAdd: (parentId: string | null) => void;
  handleDeleteNode: (node: RoadmapItem) => void;
  setEditingNode: (node: RoadmapItem | null) => void;
  setFullScreenNote: (node: RoadmapItem | null) => void;
  toggleStatus: (item: RoadmapItem, e: React.MouseEvent) => void;
  isLight?: boolean;
  isLast?: boolean;
}

const TreeNode = ({
  item, depth = 0, index = 0, expandedNodes, toggleExpand, activeMenuId,
  setActiveMenuId, handleAdd, handleDeleteNode, setEditingNode, setFullScreenNote, toggleStatus, isLight, isLast
}: TreeNodeProps) => {
  const isExpanded = expandedNodes.has(item.id);
  const hasChildren = item.subItems && item.subItems.length > 0;
  const isRoot = depth === 0;

  const completedCount = item.subItems?.filter(c => c.status === 'completed').length || 0;
  const totalCount = item.subItems?.length || 0;
  const progressPercent = totalCount === 0 
    ? (item.status === 'completed' ? 100 : 0) 
    : Math.round((completedCount / totalCount) * 100);

  const isMenuPath = (node: RoadmapItem): boolean => {
    if (node.id === activeMenuId) return true;
    if (node.subItems) return node.subItems.some(isMenuPath);
    return false;
  };
  const activePath = isMenuPath(item);

  return (
    <div id={`node-${item.id}`} className="relative w-full group/node">
      {!isLast && (
        <div className={`absolute w-[2px] z-0 transition-colors duration-500
          ${isRoot ? 'left-[11px] top-[26px] bottom-[-10px]' : 'left-[9px] top-[20px] bottom-[-8px]'}
          ${item.status === 'completed' ? 'bg-green-500/80' : isLight ? 'bg-slate-300 border-dashed border-l-2 border-slate-300 bg-transparent' : 'bg-slate-700/50 border-dashed border-l-2 border-slate-600 bg-transparent'}
        `} />
      )}

      <div className={`relative flex items-start ${isRoot ? 'mb-2.5' : 'mb-2'} ${activePath ? 'z-50' : 'z-10'}`}>
        <button 
          onClick={(e) => toggleStatus(item, e)}
          className={`relative shrink-0 flex items-center justify-center z-10 rounded-full transition-all duration-300 cursor-pointer
          ${isRoot ? 'w-6 h-6 mt-0.5 border-2' : 'w-5 h-5 mt-0.5 border-[1.5px]'}
          ${item.status === 'completed'
              ? (isLight ? 'bg-green-500 border-green-200 text-white' : 'bg-green-500 border-green-800 text-white')
              : item.status === 'in-progress'
              ? (isLight ? 'bg-blue-500 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.6)] ring-2 ring-blue-100 text-white animate-pulse' : 'bg-blue-500 border-blue-900 shadow-[0_0_10px_rgba(59,130,246,0.6)] ring-2 ring-blue-500/30 text-white animate-pulse')
              : (isLight ? 'bg-white border-slate-300 text-slate-300 hover:border-slate-400' : 'bg-slate-800 border-slate-600 text-slate-500 hover:border-slate-400')
          }
        `}>
            {item.status === 'completed' ? <CheckCircle2 className={isRoot ? "w-3.5 h-3.5" : "w-3 h-3"} /> :
             item.status === 'in-progress' ? <ArrowRightCircle className={isRoot ? "w-3.5 h-3.5" : "w-3 h-3"} /> :
             <Circle className={isRoot ? "w-2 h-2" : "w-1.5 h-1.5"} />}
        </button>

        <div className={`flex-1 ml-2 sm:ml-3 rounded-xl border p-2 sm:p-3 transition-all duration-300
           ${item.status === 'completed' ? (isLight ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-slate-800/30 border-white/5 opacity-60') :
             item.status === 'in-progress' ? (isLight ? 'bg-white border-blue-400 shadow-sm' : 'bg-slate-800 border-blue-500/50 shadow-[0_2px_10px_rgba(59,130,246,0.1)]') :
             (isLight ? 'bg-white border-slate-200' : 'bg-slate-800/60 border-white/10')
           }
        `}>
           <div className="flex justify-between items-start gap-1.5">
               <div className="flex-1 min-w-0" onClick={(e) => { if (hasChildren) toggleExpand(item.id, e); else setEditingNode(item); }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      item.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                      item.status === 'in-progress' ? 'bg-blue-500/20 text-blue-500' :
                      isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {item.status === 'completed' ? 'Done' : item.status === 'in-progress' ? 'Focus' : 'Pending'}
                    </span>
                  </div>
                  <h3 className={`font-bold text-xs sm:text-sm leading-tight break-words cursor-pointer ${item.status === 'completed' ? 'line-through' : ''} ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      {item.title}
                  </h3>
                  {item.description && <p className={`mt-1 text-[10px] sm:text-xs leading-snug break-words font-medium line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.description}</p>}
               </div>

               <div className="shrink-0 flex items-center gap-1 relative z-20">
                  <button onClick={(e) => { e.stopPropagation(); setFullScreenNote(item); }} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-blue-50 text-blue-500' : 'hover:bg-blue-500/20 text-blue-400'}`}>
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'}`}>
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === item.id && (
                     <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 top-8 w-36 border rounded-xl shadow-xl z-[9999] flex flex-col overflow-hidden backdrop-blur-xl ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700'}`}>
                        {depth < 3 && (
                           <button onClick={() => handleAdd(item.id)} className={`px-3 py-2.5 text-left text-[11px] font-bold flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800 text-white'}`}>
                              <Plus className="w-3.5 h-3.5" /> Add sub topic
                           </button>
                        )}
                        <button onClick={() => { setEditingNode(item); setActiveMenuId(null); }} className={`px-3 py-2.5 text-left text-[11px] font-bold flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800 text-white'}`}>
                           <Edit3 className="w-3.5 h-3.5" /> Edit Title
                        </button>
                        <button onClick={() => handleDeleteNode(item)} className={`px-3 py-2.5 text-left text-[11px] font-bold flex items-center gap-2 transition-colors border-t ${isLight ? 'hover:bg-red-50 text-red-600 border-slate-100' : 'hover:bg-red-900/30 text-red-400 border-slate-700'}`}>
                           <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                     </div>
                  )}
               </div>
           </div>

           {item.links && item.links.length > 0 && (
             <div className="mt-1.5 flex flex-wrap gap-1">
               {item.links.map(link => (
                 <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-transform active:scale-95 flex items-center gap-1 ${isLight ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'}`}>
                   <LinkIcon className="w-2 h-2" /> {link.label}
                 </a>
               ))}
             </div>
           )}

           {hasChildren && (
               <div className="mt-2.5">
                   <div className="flex justify-between items-center text-[8px] mb-1 font-black uppercase tracking-widest">
                       <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>Progress</span>
                       <span className={progressPercent === 100 ? 'text-green-500' : isLight ? 'text-blue-600' : 'text-blue-400'}>{progressPercent}%</span>
                   </div>
                   <div className={`w-full h-1.5 rounded-full overflow-hidden shadow-inner ${isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                       <div className={`h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)] ${progressPercent === 100 ? 'bg-green-500 shadow-green-500/50' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }} />
                   </div>
               </div>
           )}

           {hasChildren && (
               <div className={`mt-2 pt-2 border-t flex justify-center ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                  <button onClick={(e) => toggleExpand(item.id, e)} className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                     {isExpanded ? <><ChevronUp className="w-3 h-3" /> Hide Steps</> : <><ChevronDown className="w-3 h-3" /> Show {item.subItems!.length} Steps</>}
                  </button>
               </div>
           )}
        </div>
      </div>

      {isExpanded && hasChildren && (
         <div className="ml-2.5 sm:ml-3 pl-2 sm:pl-2.5 pt-0.5 pb-0.5">
            {item.subItems!.map((child, i) => (
               <TreeNode
                  key={child.id} item={child} depth={depth + 1} index={i} expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
                  handleAdd={handleAdd} handleDeleteNode={handleDeleteNode} setEditingNode={setEditingNode}
                  setFullScreenNote={setFullScreenNote}
                  toggleStatus={toggleStatus} isLight={isLight} isLast={i === item.subItems!.length - 1}
               />
            ))}
         </div>
      )}
    </div>
  );
};

// --- Main Layout Export ---
export default function RoadmapManager() {
  const { roadmaps, setRoadmaps, syntheticDeadlines, setSyntheticDeadline, isPlansOpen, togglePlans, theme } = useDashboardStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  useEffect(() => {
    if (theme === 'auto') {
      setResolvedTheme(new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'light' : 'dark');
    } else setResolvedTheme(theme as 'light' | 'dark');
  }, [theme]);
  const isLight = resolvedTheme === 'light';

  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(roadmaps && roadmaps.length > 0 ? roadmaps[0].id : '');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<RoadmapItem | null>(null);
  const [fullScreenNote, setFullScreenNote] = useState<RoadmapItem | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isRoadmapSwitcherOpen, setIsRoadmapSwitcherOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'in-progress' | 'completed' | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: React.ReactNode; requireText?: string;
    isDestructive?: boolean; isPrompt?: boolean; promptPlaceholder?: string;
    confirmText?: string; hideCancel?: boolean; onConfirm: (val?: string) => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showAlertModal = (title: string, message: React.ReactNode) => {
    setConfirmModal({ isOpen: true, title, message, hideCancel: true, confirmText: 'Got it', onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })) });
  };

  const handleMouseDown = (e: React.MouseEvent) => { if (!scrollRef.current) return; setIsDragging(true); setStartY(e.pageY - scrollRef.current.offsetTop); setScrollTop(scrollRef.current.scrollTop); };
  const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging || !scrollRef.current) return; e.preventDefault(); scrollRef.current.scrollTop = scrollTop - ((e.pageY - scrollRef.current.offsetTop) * 1.5); };

  useEffect(() => {
    if (!roadmaps || roadmaps.length === 0) {
      const defaultRoadmap: Roadmap = { id: 'default', name: 'Master Plan', nodes: [] };
      setRoadmaps([defaultRoadmap]); setActiveRoadmapId(defaultRoadmap.id);
    } else if (!roadmaps.find(r => r.id === activeRoadmapId)) setActiveRoadmapId(roadmaps[0].id);
  }, [roadmaps, activeRoadmapId, setRoadmaps]);

  const activeRoadmapRaw = roadmaps?.find(r => r.id === activeRoadmapId) || roadmaps?.[0];

  const displayedRoadmap = React.useMemo(() => {
    if (statusFilter) {
      const filterNodeByStatus = (node: RoadmapItem, forceKeep = false): RoadmapItem | null => {
        let newSubItems: RoadmapItem[] = [];
        const matchesFilter = node.status === statusFilter;
        if (node.subItems) {
          for (const child of node.subItems) {
            const fc = filterNodeByStatus(child, matchesFilter || forceKeep);
            if (fc) newSubItems.push(fc);
          }
        }
        if (matchesFilter || forceKeep || newSubItems.length > 0) return { ...node, subItems: newSubItems.length > 0 ? newSubItems : undefined };
        return null;
      };
      const syntheticNodes: RoadmapItem[] = [];
      roadmaps.forEach(r => { r.nodes.forEach(n => { const f = filterNodeByStatus(n); if (f) syntheticNodes.push(f); }); });
      return { id: `synthetic-${statusFilter}`, name: `${statusFilter.toUpperCase()} TASKS`, targetDate: syntheticDeadlines?.[statusFilter] || undefined, nodes: syntheticNodes } as Roadmap;
    }

    if (searchQuery && activeRoadmapRaw) {
      const query = searchQuery.toLowerCase();
      const filterBySearch = (node: RoadmapItem): RoadmapItem | null => {
        let newSubItems: RoadmapItem[] = [];
        const matches = node.title.toLowerCase().includes(query) || (node.description || '').toLowerCase().includes(query);
        if (node.subItems) {
          for (const child of node.subItems) {
            const fc = filterBySearch(child);
            if (fc) newSubItems.push(fc);
          }
        }
        if (matches || newSubItems.length > 0) return { ...node, subItems: newSubItems.length > 0 ? newSubItems : undefined };
        return null;
      };
      const filteredNodes = activeRoadmapRaw.nodes.map(filterBySearch).filter(Boolean) as RoadmapItem[];
      return { ...activeRoadmapRaw, nodes: filteredNodes };
    }
    return activeRoadmapRaw;
  }, [statusFilter, roadmaps, syntheticDeadlines, searchQuery, activeRoadmapRaw]);

  const daysLeft = displayedRoadmap ? getFormattedTimeLeft(displayedRoadmap.targetDate) : null;

  const calculateOverallProgress = () => {
    if (!activeRoadmapRaw || activeRoadmapRaw.nodes.length === 0) return 0;
    let total = 0, completed = 0;
    const traverse = (n: RoadmapItem) => { total++; if (n.status === 'completed') completed++; if (n.subItems) n.subItems.forEach(traverse); }
    activeRoadmapRaw.nodes.forEach(traverse);
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };
  const overallProgress = calculateOverallProgress();

  // --- Auto-Scroll & Expand Engine ---
  useEffect(() => {
    if (!isPlansOpen || !displayedRoadmap || displayedRoadmap.nodes.length === 0) return;

    let targetId: string | null = null;
    const expandPath = new Set<string>();

    const findActiveNode = (nodes: RoadmapItem[]) => {
      for (const node of nodes) {
        if (node.status === 'in-progress' || node.status === 'pending') {
          targetId = node.id;
          expandPath.add(node.id);
          if (node.subItems && node.subItems.length > 0) {
            findActiveNode(node.subItems); 
          }
          return true;
        }
      }
      return false;
    };

    findActiveNode(displayedRoadmap.nodes);
    setExpandedNodes(expandPath);

    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(`node-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [isPlansOpen, activeRoadmapId]);

  const toggleExpandAll = () => {
    if (expandedNodes.size > 0) setExpandedNodes(new Set());
    else {
      const allIds = new Set<string>();
      const traverse = (nodes: RoadmapItem[]) => { nodes.forEach(n => { if (n.subItems?.length) { allIds.add(n.id); traverse(n.subItems); } }); };
      traverse(displayedRoadmap?.nodes || []); setExpandedNodes(allIds);
    }
  };

  if (!isPlansOpen || !displayedRoadmap) return null;

  const createNewRoadmap = () => setConfirmModal({ isOpen: true, title: 'New Plan', message: 'What is the goal of this plan?', isPrompt: true, promptPlaceholder: 'e.g. Master React, Fitness Goals...', onConfirm: (name?: string) => { if (!name?.trim()) return; const nr: Roadmap = { id: generateId(), name: name.trim(), nodes: [] }; setRoadmaps([...roadmaps, nr]); setActiveRoadmapId(nr.id); setConfirmModal(prev => ({...prev, isOpen: false})); } });

  const deleteActiveRoadmap = () => {
    if (roadmaps.length === 1) return showAlertModal("Cannot Delete", "You must have at least one active plan.");
    setConfirmModal({ 
      isOpen: true, 
      title: 'Delete Plan?', 
      message: `Permanently delete "${activeRoadmapRaw?.name}"?`, 
      requireText: 'DELETE', 
      isDestructive: true, 
      onConfirm: () => { 
        const f = roadmaps.filter(r => r.id !== activeRoadmapId); 
        setRoadmaps(f); 
        setActiveRoadmapId(f[0].id); 
        setConfirmModal(prev => ({...prev, isOpen: false}));
      } 
    });
  };

  const updateTargetDate = (e: React.ChangeEvent<HTMLInputElement>) => { if (statusFilter) setSyntheticDeadline(statusFilter, e.target.value); else setRoadmaps(roadmaps.map(r => r.id === activeRoadmapId ? { ...r, targetDate: e.target.value } : r)); };
  const toggleExpand = (id: string, e: React.MouseEvent) => { e.stopPropagation(); const n = new Set(expandedNodes); if (n.has(id)) n.delete(id); else n.add(id); setExpandedNodes(n); };

  const handleAdd = (parentId: string | null) => {
    if ((statusFilter || searchQuery) && !parentId) return;
    const newNode: RoadmapItem = { id: generateId(), title: 'New Step', status: 'pending', subItems: [] };
    if (!parentId) return setRoadmaps(roadmaps.map(r => r.id === activeRoadmapId ? { ...r, nodes: [...(activeRoadmapRaw?.nodes||[]), newNode] } : r));
    const addGlobalNode = (nodes: RoadmapItem[]): RoadmapItem[] => nodes.map(n => { if (n.id === parentId) return { ...n, subItems: [...(n.subItems || []), newNode] }; if (n.subItems) return { ...n, subItems: addGlobalNode(n.subItems) }; return n; });
    setRoadmaps(roadmaps.map(r => ({ ...r, nodes: addGlobalNode(r.nodes) }))); setExpandedNodes(new Set([...expandedNodes, parentId])); setActiveMenuId(null);
  };

  const handleDeleteNode = (node: RoadmapItem) => {
    const isRootNode = activeRoadmapRaw?.nodes.some(n => n.id === node.id);
    const performDelete = () => { const del = (nodes: RoadmapItem[]): RoadmapItem[] => nodes.filter(n => n.id !== node.id).map(n => { if (n.subItems) return { ...n, subItems: del(n.subItems) }; return n; }); setRoadmaps(roadmaps.map(r => ({ ...r, nodes: del(r.nodes) }))); setActiveMenuId(null); setConfirmModal(prev => ({...prev, isOpen: false})); };
    setConfirmModal({ isOpen: true, title: isRootNode ? 'Delete Step' : 'Remove Step', message: `Remove "${node.title}"?`, isDestructive: true, onConfirm: performDelete });
  };

  const handleSaveNode = (updatedItem: RoadmapItem) => {
    const updateGlobalTree = (nodes: RoadmapItem[]): RoadmapItem[] => nodes.map(n => { if (n.id === updatedItem.id) return { ...n, ...updatedItem, subItems: n.subItems }; if (n.subItems) return { ...n, subItems: updateGlobalTree(n.subItems) }; return n; });
    setRoadmaps(roadmaps.map(r => ({ ...r, nodes: updateGlobalTree(r.nodes) }))); 
    setEditingNode(null);
    setFullScreenNote(null);
  };

  const toggleStatus = (item: RoadmapItem, e: React.MouseEvent) => { e.stopPropagation(); handleSaveNode({ ...item, status: item.status === 'pending' ? 'in-progress' : item.status === 'in-progress' ? 'completed' : 'pending' }); };

  return (
    <div className={`fixed w-[98vw] h-[90vh] md:w-[60vw] left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-[1000] flex items-center justify-center p-0 sm:p-2 animate-in fade-in duration-200 pointer-events-auto ${isLight ? 'text-slate-800' : 'text-white'}`}>
      <div className={`relative w-full h-full sm:h-[95vh] max-w-4xl flex flex-col rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans ${isLight ? 'bg-slate-50' : 'bg-[#090e17] sm:border sm:border-slate-800'}`}>

        {/* --- HEADER --- */}
        <div className={`px-3 sm:px-5 py-2.5 sm:py-3 border-b shrink-0 flex justify-between items-center gap-2 relative z-50 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0f172a]'}`}>
          
          {/* Left: Title & Delete */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => setIsRoadmapSwitcherOpen(true)} className={`group flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-lg transition-colors -ml-2 ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}>
              <h1 className="text-sm sm:text-lg font-black tracking-tight line-clamp-1 max-w-[150px] sm:max-w-[300px]">{displayedRoadmap.name}</h1>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>
            
            {/* Delete Active Roadmap */}
            {roadmaps.length > 1 && !statusFilter && !searchQuery && (
              <button onClick={deleteActiveRoadmap} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400/80 hover:text-red-400 hover:bg-red-500/10'}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Search, AI, Close */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Top Right Search */}
            {isSearchExpanded ? (
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full border shadow-inner animate-in slide-in-from-right-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  autoFocus 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="w-24 sm:w-40 bg-transparent text-[10px] sm:text-xs outline-none" 
                />
                <button onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }} className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0">
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchExpanded(true)} 
                className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            )}

            {/* AI Build with Info Button */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button 
                onClick={() => showAlertModal("Auto-Build via AI ✨", "Don't know where to start? Paste your syllabus, subject, or exam topics into the AI generator, and it will automatically build a structured, step-by-step study plan for you.")} 
                className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors ${isLight ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`}
              >
                <span className="text-[9px] sm:text-[10px] font-black italic">i</span>
              </button>
              <button onClick={() => setShowAIModal(true)} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded-lg transition-colors shadow-md shadow-indigo-500/20 active:scale-95 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">AI Build</span><span className="sm:hidden">AI</span>
              </button>
            </div>
            
            <button onClick={togglePlans} className={`p-1.5 rounded-lg transition-colors ml-1 ${isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>



        {/* --- MAIN SCROLLABLE AREA --- */}
        <div className="relative flex-1 flex overflow-hidden">
          <ScrollableWithArrows>


            <div ref={scrollRef} className={`relative flex-1 overflow-y-auto overflow-x-hidden px-1 md:px-3 py-2 flex flex-col items-center ${isDragging ? 'cursor-grabbing select-none' : ''}`} onClick={() => setActiveMenuId(null)} onMouseDown={handleMouseDown} onMouseLeave={() => setIsDragging(false)} onMouseUp={() => setIsDragging(false)} onMouseMove={handleMouseMove}>

              {/* Top Controls (Filters / Expand) */}
              <div className="w-full max-w-3xl flex flex-wrap justify-center items-center gap-2 mb-6 relative z-50">
                <div className={`text-[9px] sm:text-[10px] flex gap-3 px-3 py-1.5 rounded-full border shadow-sm ${isLight ? 'border-slate-200 text-slate-500 bg-white' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}>
                  <span onClick={() => {setStatusFilter(statusFilter === 'pending' ? null : 'pending'); setSearchQuery('');}} className={`cursor-pointer transition-all ${statusFilter === 'pending' ? (isLight ? 'text-slate-800 font-bold' : 'text-white font-bold') : 'hover:opacity-80'}`}>⚪ Pending</span>
                  <span onClick={() => {setStatusFilter(statusFilter === 'in-progress' ? null : 'in-progress'); setSearchQuery('');}} className={`cursor-pointer transition-all ${statusFilter === 'in-progress' ? 'text-blue-500 font-bold' : 'hover:opacity-80'}`}>🔵 Active</span>
                  <span onClick={() => {setStatusFilter(statusFilter === 'completed' ? null : 'completed'); setSearchQuery('');}} className={`cursor-pointer transition-all ${statusFilter === 'completed' ? 'text-green-500 font-bold' : 'hover:opacity-80'}`}>✅ Done</span>
                </div>
                <button onClick={toggleExpandAll} className={`text-[9px] sm:text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${isLight ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                  {expandedNodes.size > 0 ? <><FoldVertical className="w-3.5 h-3.5"/> Collapse</> : <><UnfoldVertical className="w-3.5 h-3.5"/> Expand</>}
                </button>
              </div>
          {/* --- OVERALL PROGRESS BAR (Below Header) --- */}
          <div className="mb-2 flex flex-col justify-center w-full px-10 shrink-0 z-[60]">
            {/* Track (Outer Container) */}
             <p> overallProgress : {overallProgress>0 ? overallProgress + '%' : ''}</p> 
            <div className="w-full max-w-[100%] h-5 sm:h-6 bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden">
              {/* Progress Fill */}
              <div 
                className={`h-full rounded-full flex font-bold justify-center transition-all duration-700 ${
                  overallProgress === 100 
                    ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                    : 'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                }`} 
                style={{ width: `${overallProgress}%` }} 
              ></div>
            </div>
          </div>

              {/* Timeline Root & Target Date Bubble */}
              <div className="w-full max-w-3xl relative px-1 pb-24">
                
                {!statusFilter && !searchQuery && (
                  <div className="flex flex-col items-start -ml-3 ">
                    <div className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm border cursor-pointer transition-transform hover:scale-105 active:scale-95 z-20 ${isLight ? 'bg-white border-blue-200 text-blue-600' : 'bg-slate-900 border-blue-500/30 text-blue-400'}`}>
                      <Target className="w-4 h-4 sm:w-4 sm:h-4 text-blue-500" />
                      <span>{daysLeft !== null ? `${daysLeft} Left` : 'Set Deadline'}</span>
                      <input type="date" value={displayedRoadmap.targetDate || ''} onChange={updateTargetDate} onClick={(e) => { try { if ('showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); } catch (err) { } }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                    </div>
                    <div className={`w-[2px] h-6 ml-6 -mt-1 z-10 ${isLight ? 'bg-slate-300 border-dashed border-l-2 border-slate-300 bg-transparent' : 'bg-slate-700/50 border-dashed border-l-2 border-slate-600 bg-transparent'}`} />
                  </div>
                )}

                {displayedRoadmap.nodes.length === 0 && (
                    <div className={`text-center py-10 text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                        {searchQuery ? 'No tasks match your search.' : 'Empty roadmap. Add a step below to begin!'}
                    </div>
                )}

                <div className="relative w-full">
                  {displayedRoadmap.nodes.map((node, index) => (
                    <TreeNode 
                      key={node.id} 
                      item={node} 
                      index={index} 
                      depth={0} 
                      expandedNodes={expandedNodes} 
                      toggleExpand={toggleExpand} 
                      activeMenuId={activeMenuId} 
                      setActiveMenuId={setActiveMenuId} 
                      handleAdd={handleAdd} 
                      handleDeleteNode={handleDeleteNode} 
                      setEditingNode={setEditingNode} 
                      setFullScreenNote={setFullScreenNote}
                      toggleStatus={toggleStatus} 
                      isLight={isLight} 
                      isLast={index === displayedRoadmap.nodes.length - 1} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollableWithArrows>

          {/* --- FLOATING "ADD TOPIC" BUBBLE (Bottom Right) --- */}
          {!statusFilter && !searchQuery && (
            <div className="absolute bottom-5 right-4 sm:bottom-6 sm:right-6 z-[150] pointer-events-auto">
              <button 
                onClick={() => handleAdd(null)} 
                className={`flex items-center justify-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase shadow-2xl transition-all hover:scale-105 active:scale-95 border ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 border-blue-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40 border-blue-500/50'}`}
              >
                <Plus className="w-5 h-5" /> Add main topic
              </button>
            </div>
          )}
        </div>

      </div>

      {/* --- POLISHED SWITCHER MODAL --- */}
      {isRoadmapSwitcherOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3" onClick={() => setIsRoadmapSwitcherOpen(false)}>
          <div className={`rounded-2xl p-4 sm:p-5 w-full max-w-md shadow-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white'}`}>Your Plans</h2>
              <button onClick={() => setIsRoadmapSwitcherOpen(false)} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {roadmaps.map(r => (
                <button 
                  key={r.id} 
                  onClick={() => { setActiveRoadmapId(r.id); setIsRoadmapSwitcherOpen(false); setStatusFilter(null); setSearchQuery(''); }} 
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex justify-between items-center transition-all ${activeRoadmapId === r.id ? (isLight ? 'bg-blue-50 border-2 border-blue-200 text-blue-700 shadow-sm' : 'bg-blue-500/10 border-2 border-blue-500/40 text-blue-400 shadow-inner') : (isLight ? 'bg-slate-50 text-slate-600 border-2 border-transparent hover:border-slate-200' : 'bg-slate-800/40 text-slate-300 border-2 border-transparent hover:border-slate-700')}`}
                >
                  <span className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 opacity-50" />
                    {r.name}
                  </span>
                  {activeRoadmapId === r.id && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2 border-slate-200 dark:border-slate-800">
              <button onClick={() => { createNewRoadmap(); setIsRoadmapSwitcherOpen(false); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${isLight ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg' : 'bg-white hover:bg-slate-200 text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}>
                <Plus className="w-4 h-4" /> Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT TITLE MODAL --- */}
      {editingNode && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3">
          <div className={`rounded-2xl p-5 w-full max-w-sm shadow-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
            <h2 className={`text-base font-black mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>Edit Title</h2>
            <input 
              type="text" 
              value={editingNode.title} 
              autoFocus
              onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })} 
              className={`w-full rounded-xl p-3.5 text-sm font-bold outline-none border focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'}`} 
            />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditingNode(null)} className={`px-4 py-2 rounded-xl text-xs font-bold ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'}`}>Cancel</button>
              <button onClick={() => handleSaveNode(editingNode)} className="px-6 py-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500 text-xs font-black shadow-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULLSCREEN NOTE EDITOR --- */}
      {fullScreenNote && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className={`w-full h-full sm:h-[85vh] max-w-4xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden ${isLight ? 'bg-white' : 'bg-[#0f172a] sm:border sm:border-slate-700'}`}>
              
              <div className={`px-4 sm:px-6 py-4 border-b flex justify-between items-center bg-opacity-90 backdrop-blur-md ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0f172a]'}`}>
                 <div className="flex flex-col gap-0.5 max-w-[80%]">
                   <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Notes & Details</span>
                   <h2 className={`font-bold text-base sm:text-lg truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{fullScreenNote.title}</h2>
                 </div>
                 <button onClick={() => setFullScreenNote(null)} className={`p-2 rounded-xl transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
                   <X className="w-5 h-5"/>
                 </button>
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-hidden">
                 <textarea
                   value={fullScreenNote.description || ''}
                   onChange={(e) => setFullScreenNote({...fullScreenNote, description: e.target.value})}
                   placeholder="Start typing your notes, resources, or sub-tasks here..."
                   className={`w-full h-full resize-none outline-none bg-transparent text-sm sm:text-base font-medium leading-relaxed custom-scrollbar ${isLight ? 'text-slate-700 placeholder:text-slate-300' : 'text-slate-200 placeholder:text-slate-600'}`}
                 />
              </div>

              <div className={`px-4 sm:px-6 py-4 border-t flex justify-end gap-3 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50'}`}>
                 <button onClick={() => setFullScreenNote(null)} className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-800'}`}>
                   Cancel
                 </button>
                 <button onClick={() => handleSaveNode(fullScreenNote)} className="px-6 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-black rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> Save Notes
                 </button>
              </div>

           </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        requireText={confirmModal.requireText}
        isDestructive={confirmModal.isDestructive}
        isPrompt={confirmModal.isPrompt}
        promptPlaceholder={confirmModal.promptPlaceholder}
        confirmText={confirmModal.confirmText || 'Confirm'}
        hideCancel={confirmModal.hideCancel}
        onConfirm={confirmModal.onConfirm}
      />

      <AIAssistantModal 
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onImport={(importedRoadmap) => {
          setRoadmaps([...roadmaps, importedRoadmap]);
          setActiveRoadmapId(importedRoadmap.id);
        }}
      />
      
    </div>
  );
}
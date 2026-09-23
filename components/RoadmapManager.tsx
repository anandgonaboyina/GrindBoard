"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDashboardStore, RoadmapItem, Roadmap } from '@/store/dashboardStore';
import ConfirmationModal from './ConfirmationModal';
import { ChevronUp, ChevronDown, Plus, Target, CheckCircle2, Circle, ArrowRightCircle, MoreVertical, Trash2, Edit3, Link as LinkIcon, FoldVertical, UnfoldVertical } from 'lucide-react';

// --- Helper Functions ---
const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);

const getFormattedTimeLeft = (targetDate?: string) => {
  if (!targetDate) return null;
  const diffTime = new Date(targetDate).getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '0 Days';
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return `${months}M : ${days}D`;
  }
  return `${diffDays} Days`;
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
  toggleStatus: (item: RoadmapItem, e: React.MouseEvent) => void;
  isLight?: boolean;
  isLast?: boolean;
}

const TreeNode = ({
  item,
  depth = 0,
  index = 0,
  expandedNodes,
  toggleExpand,
  activeMenuId,
  setActiveMenuId,
  handleAdd,
  handleDeleteNode,
  setEditingNode,
  toggleStatus,
  isLight,
  isLast
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
    <div className="relative w-full group/node">
      {/* Main Vertical Track Line */}
      {!isLast && (
        <div className={`absolute w-[2px] z-0 transition-colors duration-500
          ${isRoot ? 'left-[15px] top-[32px] bottom-[-16px]' : 'left-[11px] top-[24px] bottom-[-12px]'}
          ${item.status === 'completed' 
              ? 'bg-green-500/70' 
              : isLight ? 'bg-slate-300 border-dashed border-l-2 border-slate-300 bg-transparent' : 'bg-slate-700/50 border-dashed border-l-2 border-slate-600 bg-transparent'}
        `} />
      )}

      <div className={`relative flex items-start ${isRoot ? 'mb-4' : 'mb-3'} ${activePath ? 'z-50' : 'z-10'}`}>
        
        {/* Timeline Indicator */}
        <button 
          onClick={(e) => toggleStatus(item, e)}
          className={`relative shrink-0 flex items-center justify-center z-10 rounded-full transition-all duration-300 cursor-pointer
          ${isRoot ? 'w-8 h-8 mt-0.5 border-[3px]' : 'w-6 h-6 mt-0.5 border-2'}
          ${item.status === 'completed'
              ? (isLight ? 'bg-green-500 border-green-200 text-white shadow-sm' : 'bg-green-500 border-green-800 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]')
              : item.status === 'in-progress'
              ? (isLight ? 'bg-blue-500 border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-4 ring-blue-100 text-white animate-pulse' : 'bg-blue-500 border-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.6)] ring-4 ring-blue-500/30 text-white animate-pulse')
              : (isLight ? 'bg-white border-slate-300 text-slate-300 hover:border-slate-400 hover:text-slate-400' : 'bg-slate-800 border-slate-600 text-slate-600 hover:border-slate-500 hover:text-slate-500')
          }
        `}>
           {item.status === 'completed' ? <CheckCircle2 className={isRoot ? "w-5 h-5" : "w-4 h-4"} /> :
            item.status === 'in-progress' ? <ArrowRightCircle className={isRoot ? "w-5 h-5" : "w-4 h-4"} /> :
            <Circle className={isRoot ? "w-3 h-3" : "w-2.5 h-2.5"} />}
        </button>

        {/* Node Content Card */}
        <div className={`flex-1 ml-3 sm:ml-4 rounded-xl border p-3 transition-all duration-300
           ${item.status === 'completed' ? (isLight ? 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100' : 'bg-slate-800/20 border-white/5 opacity-60 hover:opacity-100') :
             item.status === 'in-progress' ? (isLight ? 'bg-white border-blue-400 shadow-md scale-[1.01]' : 'bg-slate-800/95 border-blue-500/50 shadow-[0_4px_20px_rgba(59,130,246,0.15)] scale-[1.01]') :
             (isLight ? 'bg-white border-slate-200 hover:shadow-sm' : 'bg-slate-800/50 border-white/10 hover:bg-slate-800/80')
           }
        `}>
           <div className="flex justify-between items-start gap-2">
               {/* Text Area */}
               <div className="flex-1 min-w-0" onClick={(e) => { if (hasChildren) toggleExpand(item.id, e); else setEditingNode(item); }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      item.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                      item.status === 'in-progress' ? 'bg-blue-500/20 text-blue-500' :
                      isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {item.status === 'completed' ? 'Mastered' : item.status === 'in-progress' ? 'Focus' : 'Pending'}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm sm:text-base leading-tight break-words cursor-pointer transition-colors
                    ${item.status === 'completed' ? 'line-through' : ''}
                    ${isLight ? 'text-slate-800' : 'text-white'}
                  `}>
                      {item.title}
                  </h3>
                  {item.description && <p className={`mt-1.5 text-xs leading-relaxed break-words font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.description}</p>}
               </div>

               {/* Menu Trigger */}
               <div className="shrink-0 relative">
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }} className={`p-1.5 rounded-lg transition-colors
                    ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'}`}>
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === item.id && (
                     <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 top-8 w-36 border rounded-xl shadow-xl z-[9999] flex flex-col overflow-hidden backdrop-blur-xl
                        ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700'}`}>
                        {depth < 3 && (
                           <button onClick={() => handleAdd(item.id)} className={`px-3 py-2.5 text-left text-xs font-bold flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800 text-white'}`}>
                              <Plus className="w-3.5 h-3.5" /> Add Sub-Step
                           </button>
                        )}
                        <button onClick={() => { setEditingNode(item); setActiveMenuId(null); }} className={`px-3 py-2.5 text-left text-xs font-bold flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800 text-white'}`}>
                           <Edit3 className="w-3.5 h-3.5" /> Edit Details
                        </button>
                        <button onClick={() => handleDeleteNode(item)} className={`px-3 py-2.5 text-left text-xs font-bold flex items-center gap-2 transition-colors border-t ${isLight ? 'hover:bg-red-50 text-red-600 border-slate-100' : 'hover:bg-red-900/30 text-red-400 border-slate-700'}`}>
                           <Trash2 className="w-3.5 h-3.5" /> Delete Task
                        </button>
                     </div>
                  )}
               </div>
           </div>

           {/* Links */}
           {item.links && item.links.length > 0 && (
             <div className="mt-2.5 flex flex-wrap gap-1.5">
               {item.links.map(link => (
                 <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={`text-[10px] px-2 py-1 rounded-md font-bold transition-transform active:scale-95 flex items-center gap-1
                   ${isLight ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100' : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20'}`}>
                   <LinkIcon className="w-2.5 h-2.5" /> {link.label}
                 </a>
               ))}
             </div>
           )}

           {/* Nested Progress Bar */}
           {hasChildren && (
               <div className="mt-3">
                   <div className="flex justify-between items-center text-[9px] mb-1 font-black uppercase tracking-widest">
                       <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>Completion</span>
                       <span className={progressPercent === 100 ? 'text-green-500' : isLight ? 'text-blue-600' : 'text-blue-400'}>{progressPercent}%</span>
                   </div>
                   <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                       <div className={`h-full transition-all duration-700 ease-out ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }} />
                   </div>
               </div>
           )}

           {/* Expand/Collapse Toggle */}
           {hasChildren && (
               <div className={`mt-2.5 pt-2 border-t flex justify-center ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                  <button onClick={(e) => toggleExpand(item.id, e)} className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5
                    ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                     {isExpanded ? (
                       <><ChevronUp className="w-3 h-3" /> Hide</>
                     ) : (
                       <><ChevronDown className="w-3 h-3" /> Reveal {item.subItems!.length}</>
                     )}
                  </button>
               </div>
           )}
        </div>
      </div>

      {/* Children Node Rendering - Tighter Indentation */}
      {isExpanded && hasChildren && (
         <div className="ml-4 sm:ml-5 pl-3 sm:pl-4 pt-1 pb-1">
            {item.subItems!.map((child, i) => (
               <TreeNode
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  index={i}
                  expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  handleAdd={handleAdd}
                  handleDeleteNode={handleDeleteNode}
                  setEditingNode={setEditingNode}
                  toggleStatus={toggleStatus}
                  isLight={isLight}
                  isLast={i === item.subItems!.length - 1}
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
  useEffect(() => {
    if (theme === 'auto') {
      const hour = new Date().getHours();
      setResolvedTheme(hour >= 6 && hour < 18 ? 'light' : 'dark');
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);
  const isLight = resolvedTheme === 'light';

  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(roadmaps && roadmaps.length > 0 ? roadmaps[0].id : '');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<RoadmapItem | null>(null);

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
    setConfirmModal({
      isOpen: true, title, message, hideCancel: true, confirmText: 'Got it',
      onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Scroll logic (Drag & Arrows)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartY(e.pageY - scrollRef.current.offsetTop);
    setScrollTop(scrollRef.current.scrollTop);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const y = e.pageY - scrollRef.current.offsetTop;
    const walk = (y - startY) * 1.5;
    scrollRef.current.scrollTop = scrollTop - walk;
  };
  const scrollWithArrows = (direction: 'up' | 'down') => {
    if (!scrollRef.current) return;
    const scrollAmount = 350;
    scrollRef.current.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  // Initialization check
  useEffect(() => {
    if (!roadmaps || roadmaps.length === 0) {
      const defaultRoadmap: Roadmap = { id: 'default', name: 'Master Plan', nodes: [] };
      setRoadmaps([defaultRoadmap]);
      setActiveRoadmapId(defaultRoadmap.id);
    } else if (!roadmaps.find(r => r.id === activeRoadmapId)) {
      setActiveRoadmapId(roadmaps[0].id);
    }
  }, [roadmaps, activeRoadmapId, setRoadmaps]);

  // View filtering logic
  const syntheticRoadmap = React.useMemo(() => {
    if (!statusFilter) return null;
    const filterNodeByStatus = (node: RoadmapItem, forceKeep = false): RoadmapItem | null => {
      let newSubItems: RoadmapItem[] = [];
      const matchesFilter = node.status === statusFilter;
      const shouldKeep = matchesFilter || forceKeep;
      if (node.subItems) {
        for (const child of node.subItems) {
          const filteredChild = filterNodeByStatus(child, shouldKeep);
          if (filteredChild) newSubItems.push(filteredChild);
        }
      }
      if (shouldKeep || newSubItems.length > 0) return { ...node, subItems: newSubItems.length > 0 ? newSubItems : undefined };
      return null;
    };
    const syntheticNodes: RoadmapItem[] = [];
    roadmaps.forEach(r => { r.nodes.forEach(n => { const f = filterNodeByStatus(n); if (f) syntheticNodes.push(f); }); });
    return {
      id: `synthetic-${statusFilter}`, name: `${statusFilter.toUpperCase()} TASKS`,
      targetDate: syntheticDeadlines?.[statusFilter] || undefined, nodes: syntheticNodes
    } as Roadmap;
  }, [statusFilter, roadmaps, syntheticDeadlines]);

  const activeRoadmap = syntheticRoadmap || roadmaps?.find(r => r.id === activeRoadmapId) || roadmaps?.[0];
  const daysLeft = activeRoadmap ? getFormattedTimeLeft(activeRoadmap.targetDate) : null;

  // Progress and Expansion Logic
  const calculateOverallProgress = () => {
    if (!activeRoadmap || activeRoadmap.nodes.length === 0) return 0;
    let total = 0, completed = 0;
    const traverse = (n: RoadmapItem) => {
      total++;
      if (n.status === 'completed') completed++;
      if (n.subItems) n.subItems.forEach(traverse);
    }
    activeRoadmap.nodes.forEach(traverse);
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };
  const overallProgress = calculateOverallProgress();

  const toggleExpandAll = () => {
    if (expandedNodes.size > 0) {
      setExpandedNodes(new Set()); // Collapse
    } else {
      const allIds = new Set<string>();
      const traverse = (nodes: RoadmapItem[]) => {
        nodes.forEach(n => {
          if (n.subItems && n.subItems.length > 0) {
            allIds.add(n.id);
            traverse(n.subItems);
          }
        });
      };
      traverse(activeRoadmap?.nodes || []);
      setExpandedNodes(allIds); // Expand
    }
  };

  if (!isPlansOpen) return null;
  if (!activeRoadmap) return null;

  // Actions
  const createNewRoadmap = () => {
    setConfirmModal({
      isOpen: true, title: 'New Master Plan', message: 'What is the goal of this new journey?',
      isPrompt: true, promptPlaceholder: 'e.g. Learn System Design',
      onConfirm: (name?: string) => {
        if (!name || name.trim() === "") return;
        const newRoadmap: Roadmap = { id: generateId(), name: name.trim(), nodes: [] };
        setRoadmaps([...roadmaps, newRoadmap]);
        setActiveRoadmapId(newRoadmap.id);
      }
    });
  };

  const deleteActiveRoadmap = () => {
    if (roadmaps.length === 1) return showAlertModal("Cannot Delete", "You must have at least one active journey.");
    setConfirmModal({
      isOpen: true, title: 'Abandon Journey?', message: `Permanently delete "${activeRoadmap.name}" and all associated progress?`,
      requireText: 'DELETE', isDestructive: true,
      onConfirm: () => {
        const filtered = roadmaps.filter(r => r.id !== activeRoadmapId);
        setRoadmaps(filtered);
        setActiveRoadmapId(filtered[0].id);
      }
    });
  };

  const updateTargetDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (statusFilter) setSyntheticDeadline(statusFilter, e.target.value);
    else setRoadmaps(roadmaps.map(r => r.id === activeRoadmapId ? { ...r, targetDate: e.target.value } : r));
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) newExpanded.delete(id); else newExpanded.add(id);
    setExpandedNodes(newExpanded);
  };

  const handleAdd = (parentId: string | null) => {
    if (statusFilter && !parentId) return;
    const newNode: RoadmapItem = { id: generateId(), title: 'New Milestone', status: 'pending', subItems: [] };
    if (!parentId) {
      setRoadmaps(roadmaps.map(r => r.id === activeRoadmapId ? { ...r, nodes: [...activeRoadmap.nodes, newNode] } : r));
      return;
    }
    const addGlobalNode = (nodes: RoadmapItem[]): RoadmapItem[] => {
      return nodes.map(node => {
        if (node.id === parentId) return { ...node, subItems: [...(node.subItems || []), newNode] };
        if (node.subItems) return { ...node, subItems: addGlobalNode(node.subItems) };
        return node;
      });
    };
    setRoadmaps(roadmaps.map(r => ({ ...r, nodes: addGlobalNode(r.nodes) })));
    setExpandedNodes(new Set([...expandedNodes, parentId]));
    setActiveMenuId(null);
  };

  const handleDeleteNode = (node: RoadmapItem) => {
    const isRootNode = activeRoadmap.nodes.some(n => n.id === node.id);
    const performDelete = () => {
      const deleteGlobalNode = (nodes: RoadmapItem[]): RoadmapItem[] => {
        return nodes.filter(n => n.id !== node.id).map(n => { if (n.subItems) return { ...n, subItems: deleteGlobalNode(n.subItems) }; return n; });
      };
      setRoadmaps(roadmaps.map(r => ({ ...r, nodes: deleteGlobalNode(r.nodes) })));
      setActiveMenuId(null);
    };
    setConfirmModal({
      isOpen: true, title: isRootNode ? 'Delete Milestone' : 'Remove Sub-Step',
      message: `Are you sure you want to remove "${node.title}"?`, isDestructive: true, onConfirm: performDelete
    });
  };

  const handleSaveNode = (updatedItem: RoadmapItem) => {
    const updateGlobalTree = (nodes: RoadmapItem[]): RoadmapItem[] => {
      return nodes.map(node => {
        if (node.id === updatedItem.id) return { ...node, ...updatedItem, subItems: node.subItems };
        if (node.subItems) return { ...node, subItems: updateGlobalTree(node.subItems) };
        return node;
      });
    };
    setRoadmaps(roadmaps.map(r => ({ ...r, nodes: updateGlobalTree(r.nodes) })));
    setEditingNode(null);
  };

  const toggleStatus = (item: RoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = item.status === 'pending' ? 'in-progress' : item.status === 'in-progress' ? 'completed' : 'pending';
    handleSaveNode({ ...item, status: nextStatus });
  };

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto ${isLight ? 'text-slate-800' : 'text-white'}`}>
      <div className="absolute inset-0" onClick={togglePlans} />
      
      <div className={`relative w-full h-full sm:h-[90vh] max-w-4xl flex flex-col rounded-xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 font-sans ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#090e17] sm:border sm:border-slate-800'}`}>

        {/* Header Area */}
        <div className={`px-4 py-3 border-b shrink-0 flex flex-col gap-3 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0f172a]'}`}>
          <div className="flex justify-between items-center">
            <button onClick={() => setIsRoadmapSwitcherOpen(true)} className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}>
              <h1 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-1.5">
                {activeRoadmap.name}
              </h1>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>
            <button onClick={togglePlans} className={`p-1.5 rounded-xl transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>✕</button>
          </div>

          <div className="w-full">
            <div className="flex justify-between items-end mb-1.5">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Journey Progress</span>
              <span className={`text-xs font-black ${overallProgress === 100 ? 'text-green-500' : isLight ? 'text-blue-600' : 'text-blue-400'}`}>{overallProgress}%</span>
            </div>
            <div className={`w-full h-1.5 md:h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
              <div className={`h-full transition-all duration-1000 ease-out ${overallProgress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-teal-400'}`} style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>

        {/* SCROLL WITH ARROWS - Floating Controls */}
        <div className="absolute right-3 bottom-6 z-[100] flex flex-col gap-2">
          <button onClick={() => scrollWithArrows('up')} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 border opacity-80 hover:opacity-100 ${isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-800 text-white border-slate-600'}`}>
            <ChevronUp className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={() => scrollWithArrows('down')} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 border opacity-80 hover:opacity-100 ${isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-800 text-white border-slate-600'}`}>
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5 flex flex-col items-center ${isDragging ? 'cursor-grabbing select-none' : ''}`}
          onClick={() => setActiveMenuId(null)}
          onMouseDown={handleMouseDown}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
        >
          {/* Quick Filters & Expand/Collapse Toggle */}
          <div className="w-full max-w-3xl flex flex-wrap justify-center items-center gap-2 mb-6 relative z-50">
            <div className={`text-[10px] sm:text-xs flex gap-2 md:gap-4 px-3 py-1.5 rounded-full border shadow-sm ${isLight ? 'border-slate-200 text-slate-500 bg-white' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}>
              <span onClick={() => setStatusFilter(statusFilter === 'pending' ? null : 'pending')} className={`flex items-center gap-1 cursor-pointer transition-all ${statusFilter === 'pending' ? (isLight ? 'text-slate-800 font-bold scale-105' : 'text-white font-bold scale-105') : (isLight ? 'hover:text-slate-800' : 'hover:text-white')}`}>⚪ Pending</span>
              <span onClick={() => setStatusFilter(statusFilter === 'in-progress' ? null : 'in-progress')} className={`flex items-center gap-1 cursor-pointer transition-all ${statusFilter === 'in-progress' ? 'text-blue-500 font-bold scale-105' : 'hover:text-blue-500'}`}>🔵 Active</span>
              <span onClick={() => setStatusFilter(statusFilter === 'completed' ? null : 'completed')} className={`flex items-center gap-1 cursor-pointer transition-all ${statusFilter === 'completed' ? 'text-green-500 font-bold scale-105' : 'hover:text-green-500'}`}>✅ Mastered</span>
            </div>
            
            <button 
              onClick={toggleExpandAll}
              className={`text-[10px] sm:text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-colors ${isLight ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
            >
              {expandedNodes.size > 0 ? <><FoldVertical className="w-3.5 h-3.5"/> Collapse All</> : <><UnfoldVertical className="w-3.5 h-3.5"/> Expand All</>}
            </button>
          </div>

          <div className="w-full max-w-3xl relative px-1 md:px-4">
            {/* Target Deadline Banner */}
            {statusFilter !== 'pending' && statusFilter !== 'completed' && (
              <div className="relative mb-8 flex items-center justify-center">
                 <div className={`rounded-xl px-4 py-3 shadow-md flex items-center gap-3 relative z-10 border transition-all ${isLight ? 'bg-white border-blue-200' : 'bg-slate-900 border-teal-500/50'}`}>
                    <Target className={`w-6 h-6 ${isLight ? 'text-blue-500' : 'text-teal-400'}`} />
                    <div className="flex flex-col">
                      <span className={`font-black text-[9px] uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ultimate Goal</span>
                      <span className={`font-black text-sm md:text-base ${isLight ? 'text-slate-800' : 'text-white'}`}>{daysLeft !== null ? `${daysLeft} Left` : 'Set Deadline'}</span>
                    </div>
                    <input type="date" value={activeRoadmap.targetDate || ''} onChange={updateTargetDate} onClick={(e) => { try { if ('showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); } catch (err) { } }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                 </div>
              </div>
            )}

            {/* Empty State */}
            {activeRoadmap.nodes.length === 0 && (
                <div className={`text-center py-16 text-sm font-medium flex flex-col items-center gap-3 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Target className="w-12 h-12 opacity-20" />
                    Every grand ambition begins with a single step. <br/>Add your first milestone below.
                </div>
            )}

            {/* Timeline Mapping */}
            <div className="relative w-full">
              {activeRoadmap.nodes.map((node, index) => (
                <TreeNode
                  key={node.id} item={node} index={index} depth={0} expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
                  handleAdd={handleAdd} handleDeleteNode={handleDeleteNode} setEditingNode={setEditingNode}
                  toggleStatus={toggleStatus} isLight={isLight} isLast={index === activeRoadmap.nodes.length - 1}
                />
              ))}
            </div>

            {!statusFilter && (
              <div className="flex flex-col items-start ml-2 sm:ml-3 mt-4 border-l-2 border-dashed border-transparent">
                <button onClick={() => handleAdd(null)} className={`ml-[9px] md:ml-[9px] px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-transform active:scale-95 border ${isLight ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800' : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white'}`}>
                  <Plus className="w-4 h-4" /> Next Milestone
                </button>

                <div className="mt-16 mb-6 w-full flex justify-center">
                  <button onClick={deleteActiveRoadmap} className={`px-4 py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'}`}>
                    <Trash2 className="w-3.5 h-3.5" /> Abandon Journey
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Switcher Overlay Modal */}
      {isRoadmapSwitcherOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsRoadmapSwitcherOpen(false)}>
          <div className={`rounded-2xl p-5 w-full max-w-sm shadow-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Select Journey</h2>
              <button onClick={() => setIsRoadmapSwitcherOpen(false)} className={`p-1.5 rounded-lg ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'}`}>✕</button>
            </div>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1.5">
              {roadmaps.map(r => (
                <button
                  key={r.id} onClick={() => { setActiveRoadmapId(r.id); setIsRoadmapSwitcherOpen(false); setStatusFilter(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors flex justify-between items-center ${activeRoadmapId === r.id ? (isLight ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400') : (isLight ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-transparent')}`}
                >
                  {r.name}
                  {activeRoadmapId === r.id && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
            <button onClick={() => { createNewRoadmap(); setIsRoadmapSwitcherOpen(false); }} className={`mt-4 w-full px-4 py-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 ${isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-200'}`}>
              <Plus className="w-4 h-4" /> Start New Journey
            </button>
          </div>
        </div>
      )}

      {/* Node Editor Modal */}
      {editingNode && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`rounded-2xl p-5 md:p-6 w-full max-w-sm shadow-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
            <h2 className={`text-lg font-black mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>Edit Milestone</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Objective Title</label>
                <input
                  type="text" value={editingNode.title} onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                  className={`w-full rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tactical Notes (Optional)</label>
                <textarea
                  value={editingNode.description || ''} onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                  className={`w-full rounded-xl p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'}`}
                  placeholder="Strategy, links, insights..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditingNode(null)} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'}`}>Cancel</button>
              <button onClick={() => handleSaveNode(editingNode)} className="px-5 py-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 text-xs font-black transition-transform active:scale-95 shadow-md">Save Directives</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message}
        requireText={confirmModal.requireText} isDestructive={confirmModal.isDestructive}
        isPrompt={confirmModal.isPrompt} promptPlaceholder={confirmModal.promptPlaceholder}
        confirmText={confirmModal.confirmText} hideCancel={confirmModal.hideCancel}
      />
    </div>
  );
}
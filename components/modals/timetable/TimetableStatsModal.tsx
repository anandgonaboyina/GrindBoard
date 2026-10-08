"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Settings, Plus, Trash2, Calendar, ChevronDown, CheckCircle2, Flame, ChevronLeft, ChevronRight, BarChart2, Lock, Clock, TrendingUp, TrendingDown, Eye, EyeOff, Target, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, Line, LabelList } from 'recharts';
import { useTimetableStore } from '@/store/timetableStore';
import { useDashboardStore } from '@/store/dashboardStore';
import ScrollableWithArrows from '@/components/ScrollableWithArrows';
import ConfirmationModal from '@/components/ConfirmationModal';


// Types and Interfaces
interface Category {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  exceptions?: string[]; // New field for exclusion keywords
  isIgnored?: boolean;
}

interface TaskLog {
  taskName: string;
  minutes: number;
  categoryId: string;
}

interface DailyLog {
  dateStr: string;
  dayIndex: number;
  items: TaskLog[];
}

interface TimetableStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

// Temporary type bypass for Recharts strict typings in Nextjs
const TypedXAxis = XAxis as any;
const TypedYAxis = YAxis as any;
const TypedLine = Line as any;
const TypedBar = Bar as any;
const TypedBarChart = BarChart as any;
const TypedLineChart = LineChart as any;
const TypedLabelList = LabelList as any;

// Global state to persist day selection across unmounts
let savedDayIndex: number | null = null;

// Helper Functions
const formatDuration = (minutes: number) => {
  if (!minutes || minutes == 0) return '0m';
  if(minutes < 0) minutes *= -1;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Maps durations to exact keys from your Timetable
const formatTimeKey = (totalMins: number) => {
  let h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const getLocalStr = (d: Date) => {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
};

const COLORS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate', hex: '#475569' },
];

const UNCATEGORIZED_COLOR = '#64748b';

// Keyword Input Component updated to Textarea
const KeywordInput = ({ keywords, onUpdate, isDark, placeholder }: { keywords: string[], onUpdate: (kw: string[]) => void, isDark: boolean, placeholder: string }) => {
  const [inputValue, setInputValue] = useState(keywords.join(', '));

  useEffect(() => {
    setInputValue(keywords.join(', '));
  }, [keywords]);

  const handleBlurOrEnter = () => {
    // Filter out empty strings so it doesnt accidentally map everything
    const parsed = inputValue.split(',').map(k => k.trim()).filter(k => k.length > 0);
    onUpdate(parsed);
    setInputValue(parsed.join(', '));
  };

  return (
    <textarea
      rows={2}
      placeholder={placeholder}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlurOrEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={`w-full text-xs px-3 py-2 rounded-lg outline-none border transition-all shadow-inner resize-none custom-scrollbar ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-violet-500/60 focus:bg-black/60' : 'bg-slate-100 border-black/10 text-slate-900 focus:border-violet-400 focus:bg-white'}`}
    />
  );
};

// Custom Click Based Dropdown
const CustomDropdown = ({ value, onChange, options, isDark }: { value: number, onChange: (v: number) => void, options: { label: string, value: number }[], isDark: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-0 md:px-2 md:py-1.5 text-[9px] md:text-xs font-bold rounded-lg outline-none border transition-all active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'}`}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 opacity-70 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full right-0 mt-1.5 w-40 rounded-xl shadow-xl border overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-black/10'}`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between ${value === opt.value ? (isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-50 text-violet-700') : (isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}`}
            >
              {opt.label}
              {value === opt.value && <CheckCircle2 size={12} className={isDark ? 'text-violet-400' : 'text-violet-600'} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function TimetableStatsModal({ isOpen, onClose, isDark = true }: TimetableStatsModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAvailableTitles, setShowAvailableTitles] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  
  // Fetch Actual History
  const { history: myHistory, viewingFriend } = useDashboardStore();
  const actualHistory = viewingFriend ? (viewingFriend.stats.history || {}) : (myHistory || {});

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    if (savedDayIndex !== null) return savedDayIndex;
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });

  // Strict Reset to Current Day and Current Week exactly on Open
  useEffect(() => {
    if (isOpen) {
      const d = new Date().getDay();
      setSelectedDayIndex(d === 0 ? 6 : d - 1);
      setWeekOffset(0);
      setActiveTab(0);
    }
  }, [isOpen]);
  
  // Persist day selection
  useEffect(() => {
    savedDayIndex = selectedDayIndex;
  }, [selectedDayIndex]);
  
  const { timetableCategories, setTimetableCategories, timetableGrid, weekdayTimes, weekendTimes, timetableStartTime, timetableWeekendStartTime } = useTimetableStore();
  
  // Inject the undeletable Ignored default category and format
  const categories = useMemo(() => {
    const baseCats = timetableCategories || [];
    if (!baseCats.find(c => c.id === 'ignored')) {
      return [{ id: 'ignored', name: 'Sleep / Breaks', color: '#475569', keywords: ['sleep'], exceptions: [], isIgnored: true }, ...baseCats];
    }
    // Ensure all cats have exceptions array to avoid crashes
    return baseCats.map(c => ({ ...c, exceptions: c.exceptions || [] }));
  }, [timetableCategories]);

  const hasUserCategories = useMemo(() => {
    return categories.some(c => c.id !== 'ignored' && c.id !== 'uncategorized');
  }, [categories]);

  // Logic to determine if a category acts as Ignored
  const isCatIgnored = (catId: string) => {
    if (catId === 'ignored') return true;
    const cat = categories.find(c => c.id === catId);
    return cat?.isIgnored === true;
  };

  const handleUpdateCategories = (newCats: Category[]) => {
    setTimetableCategories(newCats);
  };

  // Extracts all unique subjects rigorously deduplicating case variations
  const uniqueSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    if (!timetableGrid) return [];
    
    let gridToParse = timetableGrid;
    if (typeof timetableGrid === 'string') {
      try { gridToParse = JSON.parse(timetableGrid); } catch(e) { gridToParse = {}; }
    }

    Object.values(gridToParse).forEach((dayGrid: any) => {
      Object.values(dayGrid).forEach((subject: any) => {
        if (subject && typeof subject === 'string' && subject.trim().toLowerCase() !== 'free') {
          const cleanSubj = subject.trim();
          const lowerSubj = cleanSubj.toLowerCase();
          if (lowerSubj !== '' && !subjectMap.has(lowerSubj)) {
            subjectMap.set(lowerSubj, cleanSubj);
          }
        }
      });
    });
    return Array.from(subjectMap.values()).sort((a, b) => a.localeCompare(b));
  }, [timetableGrid]);

  // Real Timetable Data Parser Scheduled Goals
  const currentWeekData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const parsedWeek: DailyLog[] = [];
    
    const getDurs = (arr: any[]) => arr && arr.length > 0 ? arr.map(t => typeof t === 'number' ? t : (!isNaN(Number(t)) && t.trim() !== '' ? Number(t) : 60)) : Array(9).fill(60);
    const wdDurs = getDurs(weekdayTimes);
    const weDurs = getDurs(weekendTimes);

    // Smart Matcher Exact matching and Word Boundaries and Exceptions
    const getCategoryId = (subjName: string) => {
      const nameL = subjName.trim().toLowerCase();
      let bestMatchCatId = 'uncategorized';
      let longestMatchLength = 0;

      for (const cat of categories) {
        // Check Exceptions first
        const isExcepted = (cat.exceptions || []).some((exc:string) => {
          const cleanedExc:string = exc.trim().toLowerCase();
          if (cleanedExc.length === 0) return false;
          const escapedExc = cleanedExc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?:^|\\W)${escapedExc}(?:\\W|$)`, 'i');
          return regex.test(nameL) || nameL === cleanedExc;
        });

        if (isExcepted) continue; // Skip this category if it matches an exception

        for (const kw of cat.keywords) {
          const cleanedKw = kw.trim().toLowerCase();
          if (cleanedKw.length > 0) {
            const escapedKw = cleanedKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?:^|\\W)${escapedKw}(?:\\W|$)`, 'i');

            if (regex.test(nameL) || nameL === cleanedKw) {
              if (cleanedKw.length > longestMatchLength) {
                longestMatchLength = cleanedKw.length;
                bestMatchCatId = cat.id;
              }
            }
          }
        }
      }
      return bestMatchCatId;
    };

    days.forEach((day, dIdx) => {
      const isWeekend = dIdx >= 5;
      const durs = isWeekend ? weDurs : wdDurs;
      const startTime = isWeekend ? (timetableWeekendStartTime ?? 540) : (timetableStartTime ?? 540);
      
      let gridForDay: Record<string, string> = {};
      if (typeof timetableGrid === 'string') {
        try { gridForDay = JSON.parse(timetableGrid)[day] || {}; } catch(e) {}
      } else {
        gridForDay = timetableGrid?.[day] || {};
      }

      const tasksMap: Record<string, { minutes: number, catId: string }> = {};
      let currentMins = startTime;

      durs.forEach((dur) => {
        const timeKey = formatTimeKey(currentMins);
        const subject = gridForDay[timeKey];
        
        if (subject && subject.trim().toLowerCase() !== "free") {
          const s = subject.trim();
          if (!tasksMap[s]) tasksMap[s] = { minutes: 0, catId: getCategoryId(s) };
          tasksMap[s].minutes += dur;
        }
        currentMins += dur;
      });

      const dayItems: TaskLog[] = Object.keys(tasksMap).map(taskName => ({
        taskName,
        minutes: tasksMap[taskName].minutes,
        categoryId: tasksMap[taskName].catId
      }));

      parsedWeek.push({ dateStr: day, dayIndex: dIdx, items: dayItems });
    });

    return parsedWeek;
  }, [timetableGrid, weekdayTimes, weekendTimes, timetableStartTime, timetableWeekendStartTime, categories]);

  const currentDayData = currentWeekData[selectedDayIndex] || { items: [] };

  // Derived Data Processing

  const targetDateStr = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; 
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - dayOfWeek);

    const targetDate = new Date(currentMonday);
    targetDate.setDate(currentMonday.getDate() - (weekOffset * 7) + selectedDayIndex);
    return getLocalStr(targetDate);
  }, [weekOffset, selectedDayIndex]);

  const actualTodayMins = actualHistory[targetDateStr] || 0;

  const todayDonutData = useMemo(() => {
    const map: Record<string, number> = {};
    currentDayData.items.forEach(item => {
      map[item.categoryId] = (map[item.categoryId] || 0) + item.minutes;
    });
    return Object.keys(map).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat ? cat.name : 'Uncategorized',
        value: map[catId],
        color: cat ? cat.color : UNCATEGORIZED_COLOR,
        id: catId
      };
    }).sort((a, b) => b.value - a.value);
  }, [currentDayData, categories]);

  const todayScheduledMins = currentDayData.items
    .filter(item => !isCatIgnored(item.categoryId))
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const diffTodayMins = actualTodayMins - todayScheduledMins;
  const isTodayPositive = diffTodayMins > 0;

  // Weekly Aggregation
  const weeklyAggregates = useMemo(() => {
    const catMap: Record<string, number> = {};
    const barData = currentWeekData.map(day => {
      const dayData: any = { day: day.dateStr };
      day.items.forEach(item => {
        if (isCatIgnored(item.categoryId)) return; 
        const cat = categories.find(c => c.id === item.categoryId);
        const name = cat ? cat.name : 'Uncategorized';
        dayData[name] = ((dayData[name] || 0) + item.minutes / 60);
        catMap[item.categoryId] = (catMap[item.categoryId] || 0) + item.minutes;
      });
      return dayData;
    });

    const donutData = Object.keys(catMap).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat ? cat.name : 'Uncategorized',
        value: catMap[catId],
        color: cat ? cat.color : UNCATEGORIZED_COLOR,
        id: catId
      };
    }).sort((a, b) => b.value - a.value);

    const totalWeeklyScheduledMins = currentWeekData.reduce((weekTotal, day) => {
      return weekTotal + day.items
        .filter(item => !isCatIgnored(item.categoryId))
        .reduce((acc, curr) => acc + curr.minutes, 0);
    }, 0);

    const validDonut = donutData.filter(d => !isCatIgnored(d.id));
    const topCategory = validDonut.length > 0 ? validDonut[0].name : 'N/A';

    return { barData, donutData: validDonut, totalWeeklyScheduledMins, topCategory };
  }, [currentWeekData, categories]);

  // Trends Data Real Actuals mapped per week against Scheduled Targets
  const trendsData = useMemo(() => {
    const targetWeeklyHours = weeklyAggregates.totalWeeklyScheduledMins / 60;
    const data = [];
    
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; 
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - dayOfWeek);

    for (let w = 3; w >= 0; w--) {
      const weekName = w === 0 ? 'Current' : `Wk -${w}`;
      
      let actualWeekMins = 0;
      for(let d=0; d<7; d++) {
        const targetDate = new Date(currentMonday);
        targetDate.setDate(currentMonday.getDate() - (w * 7) + d);
        actualWeekMins += actualHistory[getLocalStr(targetDate)] || 0;
      }

      const actualHrs = actualWeekMins / 60;
      data.push({
        week: weekName,
        Actual: parseFloat(actualHrs.toFixed(1)),
        Target: parseFloat(targetWeeklyHours.toFixed(1)),
        diff: actualHrs - targetWeeklyHours
      });
    }
    return data;
  }, [weeklyAggregates.totalWeeklyScheduledMins, actualHistory]);

  if (!isOpen) return null;

  // Renderers
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-xl ${isDark ? 'bg-gray-900/95 border-white/10 text-white' : 'bg-white/95 border-black/10 text-slate-800'}`}>
          <p className="mb-2 opacity-60 uppercase tracking-wider text-[10px]">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                </div>
                <span className={isDark ? 'text-white/70' : 'text-slate-500'}>
                  {entry.value && entry.name !== 'Target' ? formatDuration(Math.round(entry.value * 60)) : `${entry.value}h`}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const TrendLabel = (props: any) => {
    const { x, y, width, index } = props;
    const diff = trendsData[index]?.diff || 0;
    if (Math.abs(diff) < 0.1) return null; 
    const isPositive = diff > 0;
    const diffMins = Math.abs(Math.round(diff * 60));
    
    return (
      <foreignObject x={x + width / 2 - 40} y={y - 24} width={80} height={20}>
        <div className={`flex items-center justify-center gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
          <span>{isPositive ? '+' : '-'}{formatDuration(diffMins)}</span>
        </div>
      </foreignObject>
    );
  };

  const TABS = ["Today's Schedule", "Weekly Overview", "Target vs Time Done"];

  return (
    <div className="fixed inset-x-0.5 inset-y-4 md:inset-y-0 md:inset-0 h-[90dvh] md:h-[100dvh] rounded-xl overflow-hidden z-[99999] flex items-center justify-center p-0 sm:p-4 bg-transparent backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl h-[90dvh] sm:h-[90vh] md:h-[85vh] flex flex-col sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-0 sm:border ${isDark ? 'bg-[#0f0f13] sm:border-white/10' : 'bg-slate-50 sm:border-black/10'}`} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b shrink-0 ${isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-white/50'}`}>
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`p-1.5 md:p-2 rounded-xl shadow-inner ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
              <BarChart2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={`font-bold text-[13px] md:text-base tracking-wide leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Timetable Analytics</h2>
              <p className={`text-[9px] md:text-xs font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Visualize your scheduled and actual effort</p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <CustomDropdown 
              value={weekOffset}
              onChange={setWeekOffset}
              options={[
                { label: 'Current Week', value: 0 },
                { label: '1 Week Ago', value: 1 },
                { label: '2 Weeks Ago', value: 2 },
                { label: '3 Weeks Ago', value: 3 }
              ]}
              isDark={isDark}
            />

            <button onClick={() => setShowSettings(true)} className={`p-1.5 md:p-2 rounded-xl transition-all border active:scale-95 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-white border-black/10 hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-sm'}`}>
              <Settings size={16} />
            </button>
            <button onClick={onClose} className={`p-1.5 md:p-2 rounded-xl transition-all border active:scale-95 ${isDark ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600 shadow-sm'}`}>
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          {/* Settings Slide Over */}
          <div className={`absolute inset-0 z-50 transition-transform duration-300 flex flex-col  ${showSettings ? 'translate-x-0' : 'translate-x-full'} ${isDark ? 'bg-[#0f0f13]' : 'bg-slate-50'}`}>
          
            <div className={`flex items-center gap-2.5 md:gap-3 px-3 md:px-6 py-3 md:py-4 border-b shrink-0 ${isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-white/50'}`}>
              <button onClick={() => setShowSettings(false)} className={`p-1.5 md:p-2 rounded-xl transition-all active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-white shadow-sm border border-black/5 hover:bg-slate-50 text-slate-600'}`}>
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <div>
                <h3 className={`font-bold text-[13px] md:text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>Category Rules & Auto-Tagging</h3>
                <p className={`text-[9px] md:text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Map timetable subjects to overarching categories</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar">
              <ScrollableWithArrows>
              <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                
                <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border text-[11px] md:text-sm leading-relaxed flex flex-col gap-3 shadow-sm ${isDark ? 'bg-sky-500/5 border-sky-500/20 text-sky-200' : 'bg-sky-50/50 border-sky-200 text-sky-800'}`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="shrink-0" />
                    <strong className="text-sm">How auto-tagging works:</strong>
                  </div>
                  <ul className="list-disc pl-5 space-y-2 opacity-90">
                    <li>Create categories and assign comma-separated keywords.</li>
                    <li>If a timetable block contains a keyword (e.g. "DSA"), its time is mapped to that category.</li>
                    <li><strong>Exceptions:</strong> Add words to prevent false matching (e.g., Exception "PE" stops it from matching if you meant to catch "PE Study").</li>
                    <li><strong>Specifics Win:</strong> If multiple categories match, the <em>longest keyword</em> wins (e.g., "PE Study" beats "PE").</li>
                    <li><strong>Exclusions:</strong> Click the <EyeOff size={14} className="inline mx-1 align-sub" /> icon to mark a category as ignored. Ignored categories won't count towards your <em>Planned</em> or <em>Time Done</em> tracking targets.</li>
                  </ul>
                </div>

                {/* DISTINCT SUBJECTS DROPDOWN GRID */}
                {uniqueSubjects.length > 0 && (
                  <div className={`rounded-2xl md:rounded-3xl border overflow-hidden transition-all shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-black/10'}`}>
                    <button 
                      onClick={() => setShowAvailableTitles(!showAvailableTitles)}
                      className={`w-full flex items-center justify-between p-4 focus:outline-none transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                    >
                      <h4 className={`text-[10px] md:text-xs uppercase tracking-widest font-bold ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Available Timetable Subjects</h4>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${showAvailableTitles ? 'rotate-180' : ''} ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    </button>
                    
                    {showAvailableTitles && (
                      <div className="p-4 pt-0 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                        {uniqueSubjects.map(sub => {
                          const isMapped = categories.some((c: Category) => c.keywords.some((kw: string) => kw.trim().length > 0 && sub.toLowerCase().includes(kw.trim().toLowerCase())));
                          return (
                            <span key={sub} className={`text-[10px] md:text-xs px-2.5 py-1.5 rounded-lg font-semibold border shadow-sm ${isMapped ? (isDark ? 'bg-violet-500/20 border-violet-500/30 text-violet-300' : 'bg-violet-100 border-violet-200 text-violet-700') : (isDark ? 'bg-black/40 border-white/10 text-white/60' : 'bg-white border-black/10 text-slate-600')}`}>
                              {sub}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {categories.map((cat, idx) => {
                    const isIgnoredCat = cat.id === 'ignored';

                    return (
                      <div key={cat.id} className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border flex flex-col gap-4 transition-all hover:shadow-md ${isDark ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]' : 'bg-white border-black/10 shadow-sm hover:border-black/20'}`}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {!isIgnoredCat && (
                                <select 
                                  value={cat.color}
                                  onChange={(e) => {
                                    const newCats = [...categories];
                                    newCats[idx].color = e.target.value;
                                    handleUpdateCategories(newCats);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                >
                                  {COLORS.map(c => <option key={c.hex} value={c.hex}>{c.name}</option>)}
                                </select>
                              )}
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20 shadow-md ${!isIgnoredCat ? 'transition-transform hover:scale-110 cursor-pointer' : 'opacity-80'}`} style={{ backgroundColor: cat.color }} />
                            </div>
                            <input 
                              type="text" 
                              value={cat.name}
                              placeholder="e.g. Academics"
                              disabled={isIgnoredCat}
                              onChange={(e) => {
                                if (isIgnoredCat) return;
                                const newCats = [...categories];
                                newCats[idx].name = e.target.value;
                                handleUpdateCategories(newCats);
                              }}
                              className={`font-bold text-sm md:text-lg outline-none bg-transparent w-full md:w-48 border-b-2 transition-colors pb-1 ${isDark ? 'border-white/20 text-white focus:border-violet-400' : 'border-black/10 text-slate-800 focus:border-violet-500'} ${isIgnoredCat ? 'opacity-80 border-transparent focus:border-transparent' : ''}`}
                            />
                          </div>
                          
                          {/* Ignore Toggle and Delete Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                              disabled={isIgnoredCat}
                              onClick={() => {
                                if (isIgnoredCat) return; 
                                const newCats = [...categories];
                                newCats[idx].isIgnored = !newCats[idx].isIgnored;
                                handleUpdateCategories(newCats);
                              }} 
                              className={`p-2 rounded-xl transition-all ${isIgnoredCat ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'} ${cat.isIgnored ? (isDark ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-amber-600 bg-amber-100 hover:bg-amber-200') : (isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-black/5')}`}
                              title={isIgnoredCat ? "This default category is permanently ignored" : (cat.isIgnored ? "Currently excluded from tracking targets" : "Include in tracking targets")}
                            >
                              {cat.isIgnored ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>

                            {isIgnoredCat ? (
                              <div className={`p-2 opacity-40 ${isDark ? 'text-white' : 'text-slate-500'}`} title="This default category cannot be deleted.">
                                <Lock size={16} />
                              </div>
                            ) : (
                              <button onClick={() => setCategoryToDelete(cat.id)} className={`p-2 rounded-xl transition-all shrink-0 active:scale-95 ${isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100 bg-rose-50'}`}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
                          <div className="flex flex-col gap-1 w-full relative">
                            <span className={`text-[10px] uppercase font-bold tracking-wider ml-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Keywords to Match</span>
                            <KeywordInput 
                              keywords={cat.keywords} 
                              isDark={isDark}
                              placeholder="e.g. Math, DSA, Code..."
                              onUpdate={(newKeywords) => {
                                const newCats = [...categories];
                                newCats[idx].keywords = newKeywords;
                                // Remove duplicates from other categories to prevent clashes
                                newCats.forEach((c, i) => {
                                  if (i !== idx) {
                                    c.keywords = c.keywords.filter((k:any) => !newKeywords.some((nk:string) => nk.toLowerCase() === k.toLowerCase()));
                                  }
                                });
                                handleUpdateCategories(newCats);
                              }} 
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1 w-full relative">
                            <span className={`text-[10px] uppercase font-bold tracking-wider ml-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Exceptions to Ignore</span>
                            <KeywordInput 
                              keywords={cat.exceptions || []} 
                              isDark={isDark} 
                              placeholder="e.g. Free, Break..."
                              onUpdate={(newExceptions) => {
                                const newCats = [...categories];
                                newCats[idx].exceptions = newExceptions;
                                handleUpdateCategories(newCats);
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => handleUpdateCategories([...categories, { id: Date.now().toString(), name: '', color: COLORS[0].hex, keywords: [], exceptions: [] }])}
                  className={`w-full py-4 rounded-2xl md:rounded-3xl border-2 border-dashed bg-blue-600 text-white flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95 mt-4 ${isDark ? 'border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5' : 'border-black/10 text-slate-500 hover:text-slate-800 hover:border-black/30 hover:bg-black/5'}`}
                >
                  <Plus size={18} strokeWidth={2.5} /> Add Category
                </button>
              </div>
              </ScrollableWithArrows>
            </div>
          </div>

          {/* Floating Fixed Pill Navigation */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[95%] sm:w-[85%] md:w-[70%] max-w-2xl pointer-events-none">
            <div className={`pointer-events-auto relative flex h-12 md:h-14 p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] border backdrop-blur-xl ${isDark ? 'bg-[#0f0f13]/80 border-blue-500' : 'bg-white/80 border-blue-600/80'}`}>
              
              {/* Animated Background Pill */}
              <div 
                className="absolute top-1.5 bottom-1.5 w-[33.33%] transition-transform duration-300 ease-out" 
                style={{ transform: `translateX(${activeTab * 100}%)`, padding: '0 4px' }}
              >
                <div className={`w-full h-full rounded-full shadow-md ${isDark ? 'bg-violet-600' : 'bg-white border border-blue-600'}`} />
              </div>
              
              {TABS.map((tab, idx) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(idx)}
                  className={`relative z-10 w-1/3 h-full px-2 flex items-center justify-center text-center text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider font-bold leading-tight transition-colors duration-300 ${activeTab === idx ? (isDark ? 'text-white drop-shadow-md' : 'text-violet-800') : (isDark ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800')}`}
                >
                  <span className="w-full no-truncate sm:whitespace-normal sm:break-words">{tab}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Scroll Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6">
            
            {/* If no custom categories exist, display the helpful hint box everywhere */}
            {!hasUserCategories ? (
              <div className="max-w-2xl mx-auto flex flex-col items-center justify-center p-8 mt-10 md:mt-20 rounded-3xl border bg-blue-500/10 border-blue-500/20 text-center gap-4 animate-in zoom-in-95">
                <div className="p-4 bg-blue-500/20 rounded-full">
                  <Info size={36} className="text-blue-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-blue-300">Set Up Your Categories</h3>
                <p className="text-xs md:text-sm text-blue-200/80 max-w-md">
                  To view your analytics, click the Settings gear icon in the top right corner. Map your timetable subjects to specific categories (e.g. Study, Dev, Chores) to begin tracking your focused time automatically!
                </p>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="mt-4 px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                >
                  Configure Now
                </button>
              </div>
            ) : (
              <>
                {/* --- TAB 1: TODAY --- */}
              <ScrollableWithArrows >
                {activeTab === 0 && (
                  <div className="max-w-6xl mx-auto flex flex-col gap-4 md:gap-6 animate-in fade-in">
                    
                    {/* Day Switcher */}
                    <div className={`flex justify-between p-1 rounded-xl md:rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-black/10 shadow-inner'}`}>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                        <button
                          key={day}
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-xs font-bold rounded-lg md:rounded-xl transition-all ${selectedDayIndex === idx ? (isDark ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white text-violet-800 shadow-md border border-black/5') : (isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5')}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1 md:gap-6">
                      {/* Planned Metric Box */}
                      <div className={`p-2 rounded-2xl md:rounded-3xl border flex flex-col items-center justify-center gap-1 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-white/5 to-white/[0.01] border-white/10' : 'bg-gradient-to-br from-white to-slate-50 border-black/10 shadow-sm'}`}>
                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                          <Calendar size={14} /> Planned Hours
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-auto">
                          <span className={`text-2xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDuration(todayScheduledMins)}</span>
                        </div>
                      </div>

                      {/* Time Done Metric Box */}
                      <div className={`p-2 rounded-2xl md:rounded-3xl border flex flex-col items-center gap-2 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-white/5 to-white/[0.01] border-white/10' : 'bg-gradient-to-br from-white to-slate-50 border-black/10 shadow-sm'}`}>
                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                          <Flame size={14} className={isDark ? "text-orange-400" : "text-orange-500"} /> Time Done
                        </span>
                        
                        <div className="flex items-center justify-center gap-3 mt-auto flex-wrap">
                          <span className={`text-2xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDuration(actualTodayMins)}</span>
                          
                          {diffTodayMins === 0 ? (
                            <span className="text-[10px] opacity-50 font-bold px-2 py-1 border border-transparent whitespace-nowrap">On Target</span>
                          ) : (
                            <div className={`px-2 py-1 rounded-full flex items-center gap-1 font-bold text-[10px] md:text-[11px] border shadow-sm whitespace-nowrap ${isTodayPositive ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200') : (isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-700 border-rose-200')}`}>
                              {isTodayPositive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                              {isTodayPositive ? '+' : '-'}{formatDuration(Math.abs(diffTodayMins))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Itemized Row Cards */}
                    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border flex flex-col w-full min-h-[300px] md:min-h-[400px] ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                      <h3 className={`font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-violet-500" /> Category Breakdown
                      </h3>
                      
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-2">
                          {/* Render Active Cards first, then Ignored card at the end */}
                          {[...todayDonutData.filter(c => !isCatIgnored(c.id)), ...todayDonutData.filter(c => isCatIgnored(c.id))].map(cat => {
                            const items = currentDayData.items.filter(i => (i.categoryId === cat.id) || (cat.id === 'uncategorized' && i.categoryId === 'uncategorized'));
                            const isIgnoredCard = isCatIgnored(cat.id);

                            return (
                              <div key={cat.id} className={`p-1 md:p-2 rounded-xl md:rounded-2xl border border-blue-300 transition-all hover:scale-[1.02] flex flex-col ${isIgnoredCard ? (isDark ? 'bg-black/40 border-white/5 opacity-70' : 'bg-slate-100 border-black/5 opacity-80') : (isDark ? 'bg-black/20 border-white/5 hover:border-white/10' : 'bg-slate-50 border-black/5 hover:border-black/10 hover:shadow-md')}`}>
                                <div className="flex justify-between items-center mb-2 md:mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                    <span className={`text-xs md:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{cat.name}</span>
                                  </div>
                                  <span className={`text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded-md font-black ${isDark ? 'bg-white/10 text-white' : 'bg-white shadow-sm border border-black/5 text-slate-700'}`}>{formatDuration(cat.value)}</span>
                                </div>
                                <ul className="flex flex-col gap-1.5 md:gap-2 pl-4 md:pl-5 border-l-2 border-dashed ml-1 md:ml-1.5 flex-1" style={{ borderColor: `${cat.color}40` }}>
                                  {items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-[10px] md:text-xs font-semibold relative before:content-[''] before:absolute before:-left-[19px] md:before:-left-[23px] before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full" style={{ '--tw-before-bg': cat.color } as any}>
                                      <span className={isDark ? 'text-white/70' : 'text-slate-600'}>{item.taskName}</span>
                                      <span className={isDark ? 'text-white/40' : 'text-slate-400'}>{formatDuration(item.minutes)}</span>
                                    </li>
                                  ))}
                                  {items.length === 0 && <span className="text-[9px] md:text-[10px] opacity-40 italic">No tasks mapped.</span>}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                        
                        {todayDonutData.length === 0 && (
                          <div className="w-full flex flex-col items-center justify-center opacity-50 gap-2 py-8 md:py-10">
                            <Calendar size={20} className="opacity-50" />
                            <span className="text-[10px] md:text-xs font-semibold">Your schedule is empty for this day.</span>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* --- TAB 2: WEEKLY --- */}
                {activeTab === 1 && (
                  <div className="max-w-6xl mx-auto flex flex-col gap-4 md:gap-6 animate-in fade-in">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 order-1 ">
                      <div className={`p-2 rounded-2xl md:rounded-3xl border flex flex-col items-center gap-1.5 md:gap-2 ${isDark ? 'bg-gradient-to-br from-white/5 to-white/[0.01] border-white/10' : 'bg-gradient-to-br from-white to-slate-50 border-black/10 shadow-sm'}`}>
                        <span className={`text-[9px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                          <Calendar size={14} /> Weekly Planned
                        </span>
                        <span className={`text-2xl md:text-4xl font-black mt-auto ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDuration(weeklyAggregates.totalWeeklyScheduledMins)}</span>
                      </div>
                      <div className={`p-2 rounded-2xl md:rounded-3xl border flex flex-col items-center gap-1.5 md:gap-2 ${isDark ? 'bg-gradient-to-br from-white/5 to-white/[0.01] border-white/10' : 'bg-gradient-to-br from-white to-slate-50 border-black/10 shadow-sm'}`}>
                        <span className={`text-[9px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                          <Target size={14} /> Top Category
                        </span>
                        <span className={`text-xl md:text-3xl font-black truncate mt-auto ${isDark ? 'text-white' : 'text-slate-800'}`}>{weeklyAggregates.topCategory}</span>
                      </div>
                    </div>

                    <div className={`p-2 rounded-2xl md:rounded-3xl border order-3 flex flex-col h-[300px] md:h-[400px] ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                      <h3 className={`font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-4 md:mb-6 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Daily Volume (Hours)</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <TypedBarChart data={weeklyAggregates.barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <TypedXAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} dy={10} />
                          <TypedYAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                          <RechartsTooltip cursor={{ fill: isDark ? '#ffffff10' : '#00000005' }} content={<CustomTooltip />} />
                          {categories.filter(c => !isCatIgnored(c.id)).map(cat => (
                            <TypedBar key={cat.id} dataKey={cat.name} stackId="a" fill={cat.color} radius={[0, 0, 0, 0]} maxBarSize={60} />
                          ))}
                          <TypedBar dataKey="Uncategorized" stackId="a" fill={UNCATEGORIZED_COLOR} radius={[6, 6, 0, 0]} maxBarSize={60} />
                        </TypedBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category Totals List*/}
                    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border order-2 flex flex-col max-h-[300px] md:max-h-[340px] relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                      <h3 className={`font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-3 md:mb-4 shrink-0 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Weekly Hours by Category</h3>
                      
                      {weeklyAggregates.donutData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[10px] md:text-xs opacity-50 font-semibold">No data mapped.</span>
                        </div>
                      ) : (
                        <ScrollableWithArrows>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 items-start content-start">
                          {weeklyAggregates.donutData.map((cat, idx) => (
                            <div key={idx} className={`flex items-center justify-between py-0.5 px-1  rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-black/20 border-white/5 hover:border-white/10' : 'bg-slate-50 border-black/5 hover:border-black/10 hover:shadow-sm'}`}>
                              <div className="flex items-center gap-0.5 md:gap-1 no-truncate pr-2">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: cat.color }} />
                                <span className={`text-xs md:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{cat.name}</span>
                              </div>
                              <span className={`text-[10px] md:text-xs px-2 py-1 rounded-md font-black shrink-0 ${isDark ? 'bg-white/10 text-white' : 'bg-white shadow-sm border border-black/5 text-slate-700'}`}>
                                {formatDuration(cat.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollableWithArrows>
                      )}
                    </div>
                  </div>
                )}

                {/* --- TAB 3: TRENDS (Scheduled vs Actual) --- */}
                {activeTab === 2 && (
                  <div className="max-w-6xl mx-auto flex flex-col gap-4 md:gap-6 animate-in fade-in">
                    
                    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border flex flex-col h-[350px] md:h-[450px] ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                      <h3 className={`font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-2 flex flex-col sm:flex-row sm:justify-between ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        <span>Target vs Time Done (Hours)</span>
                      </h3>
                      <p className={`text-[9px] md:text-[10px] mb-4 md:mb-6 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Tracks actual history against scheduled goals. Excludes ignored categories.</p>
                      
                      <ResponsiveContainer width="100%" height="100%">
                        <TypedBarChart data={trendsData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                          <TypedXAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold' }} dy={10} />
                          <TypedYAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                          <RechartsTooltip 
                            cursor={{ fill: isDark ? '#ffffff10' : '#00000005' }} 
                            content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className={`px-3 md:px-4 py-2 md:py-3 rounded-xl shadow-xl border text-[10px] md:text-xs font-semibold backdrop-blur-xl ${isDark ? 'bg-gray-900/95 border-white/10 text-white' : 'bg-white/95 border-black/10 text-slate-800'}`}>
                                    <p className="mb-2 opacity-60 uppercase tracking-wider text-[9px] md:text-[10px]">{label}</p>
                                    {payload.map((entry: any, index: number) => (
                                      <div key={index} className="flex justify-between gap-3 md:gap-4 py-0.5">
                                        <span style={{ color: entry.color }}>{entry.name === 'Actual' ? 'Time Done' : entry.name}</span>
                                        <span>{formatDuration(Math.round(entry.value * 60))}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                          
                          {/* Actual Output Bar */}
                          <TypedBar dataKey="Actual" name="Time Done" fill={isDark ? '#8b5cf6' : '#6366f1'} radius={[4, 4, 0, 0]} barSize={60}>
                            <TypedLabelList content={<TrendLabel />} />
                          </TypedBar>
                          
                          {/* Target Reference Line */}
                          <TypedLine type="step" dataKey="Target" name="Scheduled Target" stroke={isDark ? '#cbd5e1' : '#475569'} strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false} />
                        </TypedBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Explicit Data Table below chart for clarity */}
                    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border flex flex-col gap-3 md:gap-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                      <h4 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Weekly Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {trendsData.map((d, i) => (
                          <div key={i} className={`flex flex-col p-3 md:p-4 rounded-xl items-center text-center shadow-inner border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-black/5'}`}>
                            <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/60' : 'text-slate-400'}`}>{d.week}</span>
                            <span className={`text-sm md:text-lg font-black mt-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {formatDuration(Math.round(d.Actual * 60))} <span className="opacity-30 text-[10px] mx-1">/</span> {formatDuration(Math.round(d.Target * 60))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </ScrollableWithArrows>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Global Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            handleUpdateCategories(categories.filter(c => c.id !== categoryToDelete));
            setCategoryToDelete(null);
          }
        }}
        title="Delete Category"
        message="Are you sure you want to delete this category? Any subjects mapped to it will revert to 'Uncategorized'."
        isDestructive={true}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
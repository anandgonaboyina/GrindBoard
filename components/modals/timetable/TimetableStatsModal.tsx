"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Settings, Plus, Trash2, Calendar, ChevronDown, CheckCircle2, Flame, ChevronLeft, ChevronRight, BarChart2, Lock, Clock, TrendingUp, TrendingDown, Eye, EyeOff, Target, Info, ListPlus, ListChecks } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, Line, LabelList } from 'recharts';
import { useTimetableStore } from '@/store/timetableStore';
import { useDashboardStore } from '@/store/dashboardStore';
import ScrollableWithArrows from '@/components/ScrollableWithArrows';
import ConfirmationModal from '@/components/ConfirmationModal';
import TimetableMatchesModal, { PlanTabPickerModal } from './TimetableMatchesModal';
import SettingsModal from './SettingsModal';
import { usePlanYourDay, PlanDay } from './usePlanYourDay';
import { Slot, formatDuration, formatTimeKey, formatClock, getLocalStr, getTodayIndex, getNowMinutes, makeCategoryMatcher } from './timetableStatsUtils';


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
  slots: Slot[];
}

interface BreakdownRow extends TaskLog {
  remainingSlots: Slot[];
  remainingMins: number;
  isPassed: boolean; // every slot of this subject already ended
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

const BREAKDOWN_VIEWS = [
  { label: 'All', title: 'Full schedule (default)' },
  { label: 'Left', title: 'Not done yet: slots that already ended are ghosted and not counted' },
  { label: 'Slots', title: 'Upcoming slots only, with each slot time and duration' },
];

// Keyword Input Component updated to Textarea
export const KeywordInput = ({ keywords, onUpdate, isDark, placeholder }: { keywords: string[], onUpdate: (kw: string[]) => void, isDark: boolean, placeholder: string }) => {
  const [inputValue, setInputValue] = useState(keywords.join(', '));

  useEffect(() => {
    setInputValue(keywords.join(', '));
  }, [keywords]);

  const handleBlurOrEnter = () => {
    // Filter out empty strings so it doesnt accidentally map everything
    const parsed = inputValue.split(',').map((k:any) => k.trim()).filter((k:any) => k.length > 0);
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
        className={`flex items-center gap-1 px-1 md:px-2 md:py-1.5 text-[12px] md:text-xs font-bold rounded-lg outline-none border transition-all active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-blue-600/90' : 'bg-blue-600/80 border-black/90 text-white hover:bg-blue-600/90'}`}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 opacity-70 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full right-0 mt-1.5 w-40 rounded-xl shadow-xl border overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-black/10'}`}>
          {options.map((opt:any) => (
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
  const [showDropDown, setshowDropDown] = useState<null | 1>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [showUncategorized, setShowUncategorized] = useState(false);
  const [matchedCatId, setMatchedCatId] = useState<string | null>(null);
  const [ignoreRequest, setIgnoreRequest] = useState<{ catId: string; subject: string } | null>(null);
  const [breakdownView, setBreakdownView] = useState<0 | 1 | 2>(0);
  const [planMode, setPlanMode] = useState(false);
  const [nowMins, setNowMins] = useState(() => getNowMinutes());
  const plan = usePlanYourDay();
  
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
      setBreakdownView(0);
      setPlanMode(false);
      setNowMins(getNowMinutes());
    }
  }, [isOpen]);
  
  // Persist day selection
  useEffect(() => {
    savedDayIndex = selectedDayIndex;
  }, [selectedDayIndex]);

  // Keep "current time" fresh while the modal is open (drives the Left / Slots views)
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setNowMins(getNowMinutes()), 30000);
    return () => clearInterval(id);
  }, [isOpen]);
  
  const { timetableCategories, setTimetableCategories, timetableGrid, weekdayTimes, weekendTimes, timetableStartTime, timetableWeekendStartTime } = useTimetableStore();
  
  // Inject the undeletable Ignored default category and format
  const categories = useMemo(() => {
    const baseCats = timetableCategories || [];
    if (!baseCats.find(c => c.id === 'ignored')) {
      return [{ id: 'ignored', name: 'Sleep / Breaks', color: '#475569', keywords: ['sleep'], exceptions: [], isIgnored: true }, ...baseCats];
    }
    // Ensure all cats have exceptions array to avoid crashes
    return baseCats.map((c:any) => ({ ...c, exceptions: c.exceptions || [] }));
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

  // Shared smart matcher (used by the schedule parser and the matched / uncategorized modals)
  const getCategoryId = useMemo(() => makeCategoryMatcher(categories), [categories]);

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

  // Subjects bucketed by the category they actually match (same matcher as the charts)
  const subjectsByCategory = useMemo(() => {
    const map: Record<string, string[]> = {};
    uniqueSubjects.forEach(sub => {
      const id = getCategoryId(sub);
      (map[id] = map[id] || []).push(sub);
    });
    return map;
  }, [uniqueSubjects, getCategoryId]);
  const uncategorizedSubjects = subjectsByCategory['uncategorized'] || [];

  // Real Timetable Data Parser Scheduled Goals
  const currentWeekData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const parsedWeek: DailyLog[] = [];
    
    const getDurs = (arr: any[]) => arr && arr.length > 0 ? arr.map((t:any) => typeof t === 'number' ? t : (!isNaN(Number(t)) && t.trim() !== '' ? Number(t) : 60)) : Array(9).fill(60);
    const wdDurs = getDurs(weekdayTimes);
    const weDurs = getDurs(weekendTimes);

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

      const tasksMap: Record<string, { minutes: number, catId: string, slots: Slot[] }> = {};
      let currentMins = startTime;

      durs.forEach((dur) => {
        const timeKey = formatTimeKey(currentMins);
        const subject = gridForDay[timeKey];
        
        if (subject && subject.trim().toLowerCase() !== "free") {
          const s = subject.trim();
          if (!tasksMap[s]) tasksMap[s] = { minutes: 0, catId: getCategoryId(s), slots: [] };
          tasksMap[s].minutes += dur;
          tasksMap[s].slots.push({ start: currentMins, end: currentMins + dur });
        }
        currentMins += dur;
      });

      const dayItems: TaskLog[] = Object.keys(tasksMap).map((taskName:any) => ({
        taskName,
        minutes: tasksMap[taskName].minutes,
        categoryId: tasksMap[taskName].catId,
        slots: tasksMap[taskName].slots
      }));

      parsedWeek.push({ dateStr: day, dayIndex: dIdx, items: dayItems });
    });

    return parsedWeek;
  }, [timetableGrid, weekdayTimes, weekendTimes, timetableStartTime, timetableWeekendStartTime, categories, getCategoryId]);

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
    return Object.keys(map).map((catId:any) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat ? cat.name : 'Uncategorized',
        value: map[catId],
        color: cat ? cat.color : UNCATEGORIZED_COLOR,
        id: catId
      };
    }).sort((a, b) => b.value - a.value);
  }, [currentDayData, categories]);

  // ---- Category Breakdown views (0 = All, 1 = Left, 2 = Slots)
  const todayIdx = getTodayIndex();
  const isLiveDay = weekOffset === 0 && selectedDayIndex === todayIdx;
  // Slots ending at/before this minute are "done". Ongoing slots (start < now < end) still count in full.
  const passedCutoff = weekOffset > 0 || selectedDayIndex < todayIdx
    ? Infinity
    : selectedDayIndex === todayIdx ? nowMins : -Infinity;

  const breakdownCards = useMemo(() => {
    const byCat: Record<string, BreakdownRow[]> = {};
    currentDayData.items.forEach(item => {
      const remainingSlots = item.slots.filter((sl:any) => sl.end > passedCutoff);
      const remainingMins = remainingSlots.reduce((a, sl) => a + (sl.end - sl.start), 0);
      (byCat[item.categoryId] = byCat[item.categoryId] || []).push({ ...item, remainingSlots, remainingMins, isPassed: remainingMins === 0 });
    });

    const cards = Object.keys(byCat).map((catId:any) => {
      const cat = categories.find(c => c.id === catId);
      const allRows = byCat[catId];
      const rows = breakdownView === 2 ? allRows.filter((r:any) => !r.isPassed) : allRows;
      const value = rows.reduce((a, r) => a + (breakdownView === 0 ? r.minutes : r.remainingMins), 0);
      return {
        id: catId,
        name: cat ? cat.name : 'Uncategorized',
        color: cat ? cat.color : UNCATEGORIZED_COLOR,
        rows,
        value,
        allPassed: allRows.length > 0 && allRows.every(r => r.isPassed),
      };
    }).filter((c:any) => breakdownView !== 2 || c.rows.length > 0);

    return cards.sort((a, b) => b.value - a.value);
  }, [currentDayData, categories, breakdownView, passedCutoff]);

  // Add to "Plan your Day": selected weekday == tomorrow's weekday (current week) goes to Tomorrow, everything else to Today
  const planDay: PlanDay = weekOffset === 0 && selectedDayIndex === (todayIdx + 1) % 7 ? 'tomorrow' : 'today';
  const planMinsOf = (r: BreakdownRow) => (breakdownView === 0 ? r.minutes : r.remainingMins);
  // Matched modal -> "Ignore": adds the subject to that category's "Exceptions to Ignore" list
  const confirmIgnoreSubject = () => {
    if (!ignoreRequest) return;
    const { catId, subject } = ignoreRequest;
    setIgnoreRequest(null);
    const newCats = categories.map((c:any) => {
      if (c.id !== catId) return c;
      const exc = c.exceptions || [];
      if (exc.some((e:string) => e.trim().toLowerCase() === subject.trim().toLowerCase())) return c;
      return { ...c, exceptions: [...exc, subject] };
    });
    handleUpdateCategories(newCats);
  };

  const addRowsToPlan = (rows: BreakdownRow[]) =>
    plan.requestAdd(rows.map((r:any) => ({ title: r.taskName, duration: planMinsOf(r) })).filter(x => x.duration > 0), planDay);

  const todayScheduledMins = currentDayData.items
    .filter(item => !isCatIgnored(item.categoryId))
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const diffTodayMins = actualTodayMins - todayScheduledMins;
  const isTodayPositive = diffTodayMins > 0;

  // Planned box: whole day in "All", only the hours still left in "Left" / "Slots"
  const todayLeftMins = currentDayData.items
    .filter(item => !isCatIgnored(item.categoryId))
    .reduce((acc, item) => acc + item.slots.filter(sl => sl.end > passedCutoff).reduce((x, sl) => x + (sl.end - sl.start), 0), 0);
  const plannedShownMins = breakdownView === 0 ? todayScheduledMins : todayLeftMins;

  // Weekly Aggregation
  const weeklyAggregates = useMemo(() => {
    const catMap: Record<string, number> = {};
    const barData = currentWeekData.map((day:any) => {
      const dayData: any = { day: day.dateStr };
      day.items.forEach((item:any) => {
        if (isCatIgnored(item.categoryId)) return; 
        const cat = categories.find(c => c.id === item.categoryId);
        const name = cat ? cat.name : 'Uncategorized';
        dayData[name] = ((dayData[name] || 0) + item.minutes / 60);
        catMap[item.categoryId] = (catMap[item.categoryId] || 0) + item.minutes;
      });
      return dayData;
    });

    const donutData = Object.keys(catMap).map((catId:any) => {
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
    <div className="fixed mt-1 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[90dvh] w-[98vw] md:w-[60vw] md:h-[90dvh] rounded-xl overflow-hidden z-[99999] flex items-center justify-center p-0 sm:p-4 bg-transparent animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl h-[90dvh] sm:h-[90vh] md:h-[85vh] flex flex-col sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-0 sm:border ${isDark ? 'bg-[#0f0f13] sm:border-white/10' : 'bg-slate-50 sm:border-black/10'}`} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b shrink-0 ${isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-white/50'}`}>
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`p-1.5 md:p-2 rounded-xl shadow-inner ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
              <BarChart2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={`font-bold text-[13px] md:text-base tracking-wide leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>MASTER SCHEDULE Analytics</h2>
              <p className={`text-[9px] md:text-xs font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Visualize your scheduled and actual effort</p>
            </div>
          </div>

          <div className="flex flex-col items-end md:flex-row items-center gap-1 md:gap-3 whitespace-nowrap">
            <div className='order-1 md:order-2 flex gap-1'>
            <button onClick={() => setShowSettings(true)} className={`p-1.5 md:p-2 rounded-xl transition-all border active:scale-95 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-white border-black/10 hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-sm'}`}>
              <Settings size={16} />
            </button>
            <button onClick={onClose} className={`p-1.5 md:p-2 rounded-xl transition-all border active:scale-95 ${isDark ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600 shadow-sm'}`}>
              <X size={16} strokeWidth={2.5} />
            </button>
            </div>
            <div className='order-2 md:order-1'>
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
              </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          {/* Settings Modal */}
          <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            isDark={isDark}
            uniqueSubjects={uniqueSubjects}
            uncategorizedSubjects={uncategorizedSubjects}
            setShowUncategorized={setShowUncategorized}
            categories={categories}
            handleUpdateCategories={handleUpdateCategories}
            COLORS={COLORS}
            setMatchedCatId={setMatchedCatId}
            subjectsByCategory={subjectsByCategory}
            setCategoryToDelete={setCategoryToDelete}
          />

          {/* Floating Fixed Pill Navigation */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[60] w-[95%] sm:w-[85%] md:w-[70%] max-w-2xl pointer-events-none">
            <div className={`pointer-events-auto relative flex h-12 md:h-14 p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] border backdrop-blur-xl ${isDark ? 'bg-[#0f0f13]/80 border-blue-500' : 'bg-white/80 border-blue-600/80'}`}>
              <div 
                className="absolute top-1.5 bottom-1.5 w-[33.33%] transition-transform duration-300 ease-out" 
                style={{ transform: `translateX(${activeTab * 100}%)`, padding: '0 4px' }}
              >
                <div className={`w-full h-full rounded-full shadow-md ${isDark ? 'bg-violet-600' : 'bg-white border border-blue-600'}`} />
              </div>
              
              {TABS.map((tab:string, idx:number) => (
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
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-5 mt-[50px] mb-[10px]">
            
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
                  <div className="max-w-full  flex flex-col gap-4 md:gap-6 animate-in fade-in">
                    
                    {/* Day Switcher */}
                    <div className={`flex justify-between p-1 rounded-xl md:rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-black/10 shadow-inner'}`}>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day:any, idx:number) => (
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
                          <Calendar size={14} /> {breakdownView === 0 ? 'Planned Hours' : 'Hours Left'}
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-auto">
                          <span className={`text-2xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDuration(plannedShownMins)}</span>
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
                      <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-2 mb-3 md:mb-4">
                        <h3 className={`font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-violet-500" /> Category Breakdown
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* 3-way view switch */}
                          <div className={`flex p-0.5 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-black/10 shadow-inner'}`}>
                            {BREAKDOWN_VIEWS.map((v:any, i:number) => (
                              <button
                                key={v.label}
                                title={v.title}
                                onClick={() => setBreakdownView(i as 0 | 1 | 2)}
                                className={`px-2 py-1 md:px-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${breakdownView === i ? (isDark ? 'bg-violet-500 text-white shadow' : 'bg-white text-violet-800 shadow border border-black/5') : (isDark ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>
                          {/* Show / hide the add-to-plan buttons */}
                          <button
                            onClick={() => setPlanMode(p => !p)}
                            className={`flex items-center gap-1 px-2 py-1.5 whitespace-nowrap text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all active:scale-95 ${planMode ? (isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-700') : (isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white' : 'bg-white border-black/10 text-slate-500 hover:text-slate-800')}`}
                          >
                            <ListPlus size={14} /> <span>{planMode ? 'Hide add' : 'Add to tasks'}</span>
                          </button>
                        </div>
                      </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-2">
                          {/* Render Active Cards first, then Ignored card at the end */}
                          {[...breakdownCards.filter((c:any) => !isCatIgnored(c.id)), ...breakdownCards.filter((c:any) => isCatIgnored(c.id))].map((cat:any) => {
                            const isIgnoredCard = isCatIgnored(cat.id);
                            const canPlan = planMode && !isIgnoredCard;
                            const ghostCard = breakdownView === 1 && cat.allPassed;
                            const ghostText = isDark ? 'text-white/25' : 'text-slate-300';

                            return (
                              <div key={cat.id} className={`p-1 md:p-2 rounded-xl md:rounded-2xl border border-blue-300 transition-all hover:scale-[1.02] flex flex-col ${isIgnoredCard ? (isDark ? 'bg-black/40 border-white/5 opacity-70' : 'bg-slate-100 border-black/5 opacity-80') : (isDark ? 'bg-black/20 border-white/5 hover:border-white/10' : 'bg-slate-50 border-black/5 hover:border-black/10 hover:shadow-md')}`}>
                                <div className="flex justify-between items-center mb-2 md:mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color, opacity: ghostCard ? 0.35 : 1 }} />
                                    <span className={`text-xs md:text-sm font-bold ${ghostCard ? ghostText : (isDark ? 'text-white' : 'text-slate-800')}`}>{cat.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {canPlan && (
                                      <button
                                        onClick={() => addRowsToPlan(cat.rows)}
                                        disabled={cat.value === 0}
                                        className={`flex items-center gap-1 px-1.5 py-1 rounded-md border text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30' : 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'}`}
                                      >
                                        <Plus size={12} strokeWidth={3} /> <span>Add all</span>
                                      </button>
                                    )}
                                    <span className={`text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded-md font-black ${ghostCard ? (isDark ? 'bg-white/5 text-white/25' : 'bg-white text-slate-300 border border-black/5') : (isDark ? 'bg-white/10 text-white' : 'bg-white shadow-sm border border-black/5 text-slate-700')}`}>{formatDuration(cat.value)}</span>
                                  </div>
                                </div>
                                <ul className="flex flex-col gap-1.5 md:gap-2 pl-4 md:pl-5 border-l-2 border-dashed ml-1 md:ml-1.5 flex-1" style={{ borderColor: `${cat.color}40` }}>
                                  {cat.rows.map((item:any, idx:any) => {
                                    const ghost = breakdownView === 1 && item.isPassed;
                                    const partial = breakdownView === 1 && !item.isPassed && item.remainingMins < item.minutes;
                                    const shownMins = breakdownView === 0 || ghost ? item.minutes : item.remainingMins;
                                    return (
                                      <li key={idx} className="flex justify-between text-[10px] md:text-xs font-semibold relative before:content-[''] before:absolute before:-left-[19px] md:before:-left-[23px] before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full" style={{ '--tw-before-bg': cat.color } as any}>
                                        <span className={ghost ? ghostText : (isDark ? 'text-white/70' : 'text-slate-600')}>{item.taskName}</span>
                                        <span className="flex items-center justify-end flex-wrap gap-1 pl-2">
                                          {breakdownView === 2 ? (
                                            item.remainingSlots.map((sl:any, si:any) => {
                                              const live = isLiveDay && sl.start <= nowMins && nowMins < sl.end;
                                              return (
                                                <span key={si} className={`px-1.5 py-0.5 rounded-md border text-[9px] md:text-[10px] font-bold whitespace-nowrap ${live ? (isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-700') : (isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-black/10 text-slate-500')}`}>
                                                  {formatClock(sl.start)}–{formatClock(sl.end)} · {formatDuration(sl.end - sl.start)}
                                                </span>
                                              );
                                            })
                                          ) : (
                                            <span className={ghost ? ghostText : (isDark ? 'text-white/40' : 'text-slate-400')}>
                                              {formatDuration(shownMins)}
                                              {partial && <span className="opacity-60"> / {formatDuration(item.minutes)}</span>}
                                            </span>
                                          )}
                                          {canPlan && (
                                            <button
                                              onClick={() => addRowsToPlan([item])}
                                              disabled={planMinsOf(item) === 0}
                                              className={`flex items-center gap-0.5 px-1 py-0.5 rounded border text-[9px] font-bold uppercase whitespace-nowrap transition-all active:scale-95 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30' : 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'}`}
                                            >
                                              <Plus size={11} strokeWidth={3} /> <span>Add</span>
                                            </button>
                                          )}
                                        </span>
                                      </li>
                                    );
                                  })}
                                  {cat.rows.length === 0 && <span className="text-[9px] md:text-[10px] opacity-40 italic">No tasks mapped.</span>}
                                </ul>
                              </div>
                            );
                          })}
                        </div>

                        {breakdownView === 2 && todayDonutData.length > 0 && breakdownCards.length === 0 && (
                          <div className="w-full flex flex-col items-center justify-center opacity-50 gap-2 py-8 md:py-10">
                            <CheckCircle2 size={20} className="opacity-50" />
                            <span className="text-[10px] md:text-xs font-semibold">Nothing left in the timetable for this day.</span>
                          </div>
                        )}

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
                          {categories.filter(c => !isCatIgnored(c.id)).map((cat:any) => (
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
                          {weeklyAggregates.donutData.map((cat:any, idx:number) => (
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
                  <div className="max-w-full mx-auto flex flex-col gap-4 md:gap-6 animate-in fade-in">
                    
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
                        {trendsData.map((d:any, i:number) => (
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

      {/* Uncategorized subjects */}
      <TimetableMatchesModal
        isOpen={showUncategorized}
        onClose={() => setShowUncategorized(false)}
        title="Uncategorized Subjects"
        subtitle={`${uncategorizedSubjects.length} timetable subject${uncategorizedSubjects.length === 1 ? '' : 's'} not matching any category`}
        color={UNCATEGORIZED_COLOR}
        subjects={uncategorizedSubjects}
        isDark={isDark}
        emptyText="Every timetable subject is matched to a category."
        showCopy
      />

      {/* Matched subjects of one category */}
      <TimetableMatchesModal
        isOpen={!!matchedCatId}
        onClose={() => setMatchedCatId(null)}
        title={`${categories.find(c => c.id === matchedCatId)?.name || 'Category'} · Matched`}
        color={categories.find(c => c.id === matchedCatId)?.color}
        subjects={matchedCatId ? (subjectsByCategory[matchedCatId] || []) : []}
        isDark={isDark}
        emptyText="No timetable subjects match this category yet."
        actionLabel="Ignore"
        onAction={(sub) => matchedCatId && setIgnoreRequest({ catId: matchedCatId, subject: sub })}
      />

      {/* Move a matched subject to the category's ignore list */}
      <ConfirmationModal
        isOpen={!!ignoreRequest}
        onClose={() => setIgnoreRequest(null)}
        onCancel={() => setIgnoreRequest(null)}
        onConfirm={confirmIgnoreSubject}
        title="Move to ignore list"
        message={`Add “${ignoreRequest?.subject ?? ''}” to the ignore list (Exceptions) of “${categories.find(c => c.id === ignoreRequest?.catId)?.name || 'this category'}”? It will stop matching this category and may show up under Uncategorized.`}
        confirmText="Move to ignore list"
        cancelText="Cancel"
      />

      {/* Add to Plan your Day: which tab? */}
      <PlanTabPickerModal
        isOpen={!!plan.tabPick}
        isDark={isDark}
        tabNames={plan.tabNames}
        count={plan.tabPick?.items.length || 0}
        dayLabel={plan.tabPick?.day === 'tomorrow' ? 'Tomorrow' : 'Today'}
        onPick={plan.chooseTab}
        onClose={plan.cancelPick}
      />

      {/* Add to Plan your Day: duplicate confirmation (Replace or Skip) */}
      <ConfirmationModal
        isOpen={!!plan.pending}
        onClose={() => plan.resolve('skip')}
        onCancel={() => plan.resolve('skip')}
        onConfirm={() => plan.resolve('replace')}
        title="Already in Plan your Day"
        message={
          <div className="flex flex-col gap-2 text-sm">
            <p>These tasks already exist{plan.pending && plan.pending.fresh.length > 0 ? ` (${plan.pending.fresh.length} new one${plan.pending.fresh.length > 1 ? 's' : ''} will still be added to “${plan.pending.tabName}”)` : ''}:</p>
            <ul className="list-disc list-inside text-[12px] opacity-90 max-h-40 overflow-y-auto">
              {plan.pending?.conflicts.map((c:any, i:number) => (
                <li key={i}><strong>{c.item.title}</strong> ({c.existingTabName}): {formatDuration((c.existing.duration || 0) + (c.existing.timeSpent || 0))} → {formatDuration(c.item.duration)}</li>
              ))}
            </ul>
            <p className="text-[12px] opacity-70"><strong>Replace</strong> makes them fresh: full duration back, done time reset to zero, moved to “{plan.pending?.tabName}”. <strong>Skip</strong> leaves them untouched.</p>
          </div>
        }
        confirmText="Replace"
        cancelText="Skip"
      />

      {/* Add-to-plan result notice */}
      {plan.notice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100001] px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-2 max-w-[92vw] text-center">
          {plan.notice}
        </div>
      )}

      {/* Global Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            handleUpdateCategories(categories.filter((c:any) => c.id !== categoryToDelete));
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
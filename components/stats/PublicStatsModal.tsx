'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, BarChart2 } from 'lucide-react';
import { getLocalDateString } from '@/utils/date';

import WeekdayBlueprint from './WeekdayBlueprint';
import SmoothnessGauge from './SmoothnessGauge';
import PerformanceSidebar from './PerformanceSidebar';
import FocusHeatmap from './FocusHeatmap';
import ScrollableWithArrows from '../ScrollableWithArrows';
import {useIsMobile} from '@/hooks'


interface PublicStatsModalProps {
  user: {
    displayName: string;
    history: Record<string, number>;
  };
  isLight: boolean;
  onClose: () => void;
}

export default function PublicStatsModal({ user, isLight, onClose }: PublicStatsModalProps) {
  const [deepThresholdHrs, setDeepThresholdHrs] = useState(3);
  const history = user.history || {};
  
  const stats = useMemo(() => {
    const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const todayStr = getLocalDateString();
    const todayObj = new Date();
    
    const getLocalStr = (d: Date) => {
      const offset = d.getTimezoneOffset();
      return new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    };

    const yesterdayObj = new Date(todayObj); yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = getLocalStr(yesterdayObj);
    
    const todayMins = history[todayStr] as number || 0;
    const yesterdayMins = history[yesterdayStr] as number || 0;

    const currentDayOfMonth = todayObj.getDate(); 
    let thisMonthSoFar = 0; let lastMonthToSameDay = 0;
    const prevMonthObj = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1);
    const daysInLastMonth = new Date(prevMonthObj.getFullYear(), prevMonthObj.getMonth() + 1, 0).getDate();
    const targetLastMonthDay = Math.min(currentDayOfMonth, daysInLastMonth);

    for (let day = 1; day <= currentDayOfMonth; day++) thisMonthSoFar += (history[getLocalStr(new Date(todayObj.getFullYear(), todayObj.getMonth(), day))] as number) || 0;
    for (let day = 1; day <= targetLastMonthDay; day++) lastMonthToSameDay += (history[getLocalStr(new Date(prevMonthObj.getFullYear(), prevMonthObj.getMonth(), day))] as number) || 0;

    let thisWeekSoFar = 0; let lastWeekToSameDay = 0;
    const currentDayOfWeek = todayObj.getDay() === 0 ? 7 : todayObj.getDay();
    for (let i = 0; i < currentDayOfWeek; i++) {
      const d1 = new Date(todayObj); d1.setDate(todayObj.getDate() - i);
      const d2 = new Date(todayObj); d2.setDate(todayObj.getDate() - i - 7);
      thisWeekSoFar += (history[getLocalStr(d1)] as number || 0);
      lastWeekToSameDay += (history[getLocalStr(d2)] as number || 0);
    }

    let bestDayMins = 0; let bestDayDate = '';
    let best7DaySum = 0; let best7DayEnd = '';
    let maxStreak = 0; let tempStreak = 0;
    let daysOver1h = 0; let daysOverDeep = 0;

    const datesAsc = [...dates].reverse(); 
    for (let i = 0; i < datesAsc.length; i++) {
      const dStr = datesAsc[i];
      const mins = history[dStr] as number;
      if (mins > bestDayMins) { bestDayMins = mins; bestDayDate = dStr; }
      if (mins >= 60) {
        if (i > 0 && Math.round((new Date(dStr).getTime() - new Date(datesAsc[i - 1]).getTime()) / 86400000) === 1) tempStreak++; 
        else tempStreak = 1;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else tempStreak = 0;
    }

    if (datesAsc.length > 0) {
      const firstDate = new Date(datesAsc[0]);
      for (let d = new Date(firstDate); d <= todayObj; d.setDate(d.getDate() + 1)) {
        let windowSum = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(d); checkDate.setDate(d.getDate() - i);
          windowSum += (history[getLocalStr(checkDate)] as number || 0);
        }
        if (windowSum > best7DaySum) { best7DaySum = windowSum; best7DayEnd = getLocalStr(d); }
      }
    }

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(todayObj); checkDate.setDate(todayObj.getDate() - i);
      const mins = history[getLocalStr(checkDate)] as number || 0;
      if (mins >= 60) daysOver1h++;
      if (mins >= deepThresholdHrs * 60) daysOverDeep++;
    }

    const heatmapMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(todayObj.getFullYear(), todayObj.getMonth() - i, 1);
      const year = d.getFullYear(); const month = d.getMonth();
      const monthName = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      
      const gridDays = [];
      for (let pad = 0; pad < firstDayOfWeek; pad++) gridDays.push(null);
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        if (currentDate > todayObj) gridDays.push(null);
        else {
          const dateStr = getLocalStr(currentDate);
          gridDays.push({ dateStr, mins: (history[dateStr] as number) || 0 });
        }
      }
      heatmapMonths.push({ monthName, gridDays });
    }

    let currentStreak = 0;
    const streakCheckDate = new Date(todayObj); streakCheckDate.setHours(0, 0, 0, 0);
    let activeDate = streakCheckDate;
    if (!history[getLocalStr(streakCheckDate)] || history[getLocalStr(streakCheckDate)] < 60) {
      activeDate = new Date(streakCheckDate); activeDate.setDate(activeDate.getDate() - 1);
    }
    while (history[getLocalStr(activeDate)] && history[getLocalStr(activeDate)] >= 60) {
      currentStreak++; activeDate.setDate(activeDate.getDate() - 1);
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    return {
      todayMins, yesterdayMins, thisWeekSoFar, lastWeekToSameDay, thisMonthSoFar, lastMonthToSameDay,
      bestDayMins, bestDayDate, best7DaySum, best7DayEnd, currentStreak,
      consistency1h: Math.round((daysOver1h / 30) * 100),
      consistencyDeep: Math.round((daysOverDeep / 30) * 100),
      heatmapMonths
    };
  }, [history, deepThresholdHrs]);

  const formatMins = (mins: number) => {
    const isNegative = mins < 0;
    const absMins = Math.abs(mins);
    if (absMins < 60) return `${isNegative ? '-' : ''}${absMins}m`;
    const h = Math.floor(absMins / 60); const m = absMins % 60;
    const formattedTime = m > 0 ? `${h}h ${m}m` : `${h}h`;
    return isNegative ? `-${formattedTime}` : formattedTime;
  };
  
  const formatDate = (dateStr: string) => !dateStr ? '' : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  const formatDisplayDate = (dateStr: string) => !dateStr ? '' : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (typeof document === 'undefined') return null;

  const SidebarElements = (
          <>
              <PerformanceSidebar 
              stats={stats} 
              isLight={isLight} 
              formatMins={formatMins} 
              formatDate={formatDate}
              deepThresholdHrs={deepThresholdHrs}
              setDeepThresholdHrs={setDeepThresholdHrs}
              viewingFriend={{ username: user.displayName }} 
              setShowFriendTimetable={() => {}} 
              handleClose={onClose}
              isPublicView={true} 
            />
            <SmoothnessGauge history={history} isLight={isLight} formatMins={formatMins} />
          </>
  );
const MainAreaElements = (
      <div className="flex flex-col gap-2.5 p-2.5 md:p-3">
        <div className="flex justify-center w-full">
          <WeekdayBlueprint history={history} isLight={isLight} formatMins={formatMins} />
        </div>
          <FocusHeatmap 
                  heatmapMonths={stats.heatmapMonths} 
                  history={history}
                  isLight={isLight} 
                  formatMins={formatMins}  
                  formatDisplayDate={formatDisplayDate}
                />               
      </div>
);


  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
     <div className={`relative w-full h-[98vh] md:h-[85vh] max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border transition-colors ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-700/60'}`} onClick={(e) => e.stopPropagation()}>
        
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isLight ? 'from-blue-400 via-indigo-500 to-purple-500' : 'from-cyan-400 via-blue-500 to-purple-500'} opacity-100 z-50`} />


        <div className={`flex-none p-2 flex gap-2 items-center border-b shrink-0 z-40 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
          <div className="w-full flex items-center justify-between">
            <h2 className={`text-sm md:text-lg font-black tracking-tight flex items-center ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              <BarChart2 className="text-amber-500 w-4 h-4 md:w-5 md:h-5" /> 
              {user.displayName}'s Analytics
            </h2>
            {stats.currentStreak >= 0 && (
              <div className={`p-0.5 rounded-md flex items-center gap-1 shadow-sm border ${isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <Flame className="w-3 h-3 md:w-3.5 md:h-3.5 animate-pulse drop-shadow-md" />
                <span className="text-[10px] font-bold shrink-0">streak : {stats.currentStreak} D</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className={`p-1.5 ml-2 rounded-lg transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'}`}>
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
            useIsMobile?
        (
          {/* --- MOBILE LAYOUT: Full Scroll --- */}
          <div className="flex md:hidden flex-1 relative z-10 min-h-0 flex-col overflow-hidden">
            <ScrollableWithArrows className="h-full w-full pb-10 custom-scrollbar overflow-y-auto">
              <div className={`flex flex-col border-b ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/20 border-slate-800'}`}>
                {SidebarElements}
              </div>
              {MainAreaElements}
            </ScrollableWithArrows>
          </div>
        ) : (
        {/* Desktop View */}
                {/* --- DESKTOP LAYOUT: Split Pane Layout --- */}
          <div className="hidden md:flex flex-1 relative z-10 min-h-0 flex-row overflow-hidden">
            {/* Left Sidebar Fixed Scroll */}
            <div className={`w-[35%] lg:w-[32%] border-r flex flex-col shrink-0 overflow-y-auto custom-scrollbar ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/20 border-slate-800'}`}>
              {SidebarElements}
            </div>
            
            {/* Right Main Area with Arrows */}
            <div className="flex-1 relative flex flex-col overflow-hidden min-h-0">
              <ScrollableWithArrows className="h-full w-full pb-10">
                {MainAreaElements}
              </ScrollableWithArrows>
            </div>
          </div>
        )
      </div>
    </div>,
    document.body
  );
}
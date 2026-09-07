'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, Calendar, ListTodo, Trophy, Paintbrush, CloudRain, Sparkles, ShieldAlert, Map, BellRing, LayoutTemplate, Swords, CalendarDays, Users } from 'lucide-react';

// Define the divisions with rich metadata for colored, icon-based tabs
const DIVISIONS = [
  { id: 'Workspace', label: 'Workspace', icon: LayoutTemplate, color: 'text-blue-400', activeBg: 'bg-blue-500/20', border: 'border-blue-500/50', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
  { id: 'Planning', label: 'Planning', icon: CalendarDays, color: 'text-purple-400', activeBg: 'bg-purple-500/20', border: 'border-purple-500/50', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
  { id: 'Social', label: 'Social', icon: Users, color: 'text-yellow-400', activeBg: 'bg-yellow-500/20', border: 'border-yellow-500/50', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]' },
  { id: 'Lifestyle', label: 'Lifestyle', icon: Sparkles, color: 'text-pink-400', activeBg: 'bg-pink-500/20', border: 'border-pink-500/50', shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.3)]' },
];
type Division = typeof DIVISIONS[number]['id'];

const features = [
  // WORKSPACE
  { id: 1, category: 'Workspace', title: 'Deep Focus Hub', desc: 'Eliminate distractions with a unified workspace. Utilize Pomodoro timers, stopwatches, and manifestation overlays to stay locked in.', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  { id: 11, category: 'Workspace', title: 'Free-form Workspace', desc: 'Your dashboard, your rules. Drag, drop, scale, and layer floating widgets, clocks, and docks exactly where you need them across multiple screens.', icon: LayoutTemplate, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', glow: 'shadow-teal-500/20' },
  { id: 8, category: 'Workspace', title: 'Privacy Shield & Panic Mode', desc: 'Instantly conceal your workspace with custom shortcut keys. Trigger Peek Mode or hide specific widgets to protect your workflow from prying eyes.', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-red-500/20' },

  // PLANNING
  { id: 2, category: 'Planning', title: 'Interactive Timetable', desc: 'Take absolute control of your schedule. Map out your week hour-by-hour with our precision interactive, draggable color-coded timetable.', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  { id: 3, category: 'Planning', title: 'Smart Task Manager', desc: 'Never miss a beat. Stay on top of your workflow with intuitive daily task tracking, tomorrow planning, and automated deadline alerts.', icon: ListTodo, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  { id: 9, category: 'Planning', title: 'Roadmaps & Milestones', desc: 'Break down massive goals into actionable steps. Track long-term progress with nested sub-tasks, resource links, and synthetic deadlines.', icon: Map, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },

  // SOCIAL
  { id: 4, category: 'Social', title: 'Connect & Compete', desc: 'Turn productivity into a game! Climb the global leaderboard, add friends, and compare focus stats in real-time to stay motivated.', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' },
  { id: 12, category: 'Social', title: 'Squads & Rivalries', desc: 'Form elite study groups or challenge rivals head-to-head. Track their live compute hours and outwork the competition to dominate the ranks.', icon: Swords, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' },

  // LIFESTYLE
  { id: 7, category: 'Lifestyle', title: 'Vision & Manifestation', desc: 'Keep your goals front and center. Upload desktop and mobile vision boards, and display custom motivational quotes to fuel your daily grind.', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  { id: 5, category: 'Lifestyle', title: 'Deep Customization', desc: 'Personalize your space. Set live PC & mobile wallpapers, upload custom ringtones, tweak UI scaling, and utilize privacy Peek Mode.', icon: Paintbrush, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', glow: 'shadow-pink-500/20' },
  { id: 10, category: 'Lifestyle', title: 'Alerts & Sleep Logs', desc: 'Maintain peak discipline. Track your wake-up and sleep routines while utilizing custom interval alarms to stay anchored in deep work sessions.', icon: BellRing, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/20' },
  { id: 6, category: 'Lifestyle', title: 'Offline & Cloud Sync', desc: 'Your data, everywhere. Work seamlessly offline and instantly sync to the cloud via AES-256 encryption the moment you reconnect.', icon: CloudRain, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' },
];

export default function FeatureCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDivision, setActiveDivision] = useState<Division>('Workspace');
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Filter features based on the selected division tab
  const filteredFeatures = features.filter(f => f.category === activeDivision);

  // Reset carousel position when swapping divisions
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeDivision]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const containerCenter = scrollRef.current.scrollLeft + scrollRef.current.offsetWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(scrollRef.current.children).forEach((child, index) => {
      const childCenter = (child as HTMLElement).offsetLeft + (child as HTMLElement).offsetWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) setActiveIndex(closestIndex);
  };

  // Auto-scroll logic tailored to cycle to the next tab when the current one finishes
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      if (scrollRef.current && scrollRef.current.children.length > 0) {
        let nextIndex = activeIndex + 1;

        if (nextIndex >= filteredFeatures.length) {
          // End of the line for this division! Cycle to the next division tab.
          const currentDivIndex = DIVISIONS.findIndex(d => d.id === activeDivision);
          const nextDivIndex = (currentDivIndex + 1) % DIVISIONS.length;
          setActiveDivision(DIVISIONS[nextDivIndex].id);
          // Note: setActiveIndex(0) is handled automatically by the division dependency useEffect above
        } else {
          // Slide to the next feature in the current tab
          const targetElement = scrollRef.current.children[nextIndex] as HTMLElement;
          if (targetElement) {
            const scrollPos = targetElement.offsetLeft - (scrollRef.current.offsetWidth / 2) + (targetElement.offsetWidth / 2);
            scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
          }
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, isDragging, filteredFeatures.length, activeDivision]);

  return (
    <div className="w-full relative flex flex-col items-center select-none touch-pan-y overflow-hidden">

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer-sweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-shimmer-sweep {
          animation: shimmer-sweep 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      ` }} />

      {/* Modern UI: Responsive, Scrollable, Icon-based Division Tabs */}
      <div className="mb-6 lg:mb-10 z-20 w-full max-w-[95vw] sm:max-w-3xl hide-scrollbar px-2 flex justify-start sm:justify-center">
        <div className="flex flex-nowrap items-center gap-0.75 sm:gap-3 bg-black/20 p-1 sm:p-2 rounded-full border border-white/10 backdrop-blur-md mx-auto w-max">
          {DIVISIONS.map((div) => {
            const Icon = div.icon;
            const isActive = activeDivision === div.id;

            return (
              <button
                key={div.id}
                onClick={() => setActiveDivision(div.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap ${isActive
                  ? `${div.activeBg} ${div.color} ${div.shadow} ${div.border} border`
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isActive ? div.color : 'text-white/40'}`} strokeWidth={isActive ? 2.5 : 2} />
                {div.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draggable Track */}
      <div
        ref={scrollRef}
        className={`w-full flex overflow-x-auto hide-scrollbar pb-4 pt-1 lg:py-6 cursor-grab active:cursor-grabbing gap-4 sm:gap-6 px-[calc(50%-140px)] min-[400px]:px-[calc(50%-160px)] sm:px-[calc(50%-200px)] lg:px-[calc(50%-250px)] ${isDragging ? '' : 'snap-x snap-mandatory scroll-smooth'}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredFeatures.map((feat, idx) => {
          const Icon = feat.icon;
          const isActive = idx === activeIndex;

          return (
            <div
              key={feat.id}
              className="shrink-0 w-[280px] min-[400px]:w-[320px] sm:w-[400px] lg:w-[500px] snap-center flex justify-center items-center transition-transform duration-500"
            >
              <div
                className={`relative w-full p-5 sm:p-6 lg:p-8 rounded-2xl md:rounded-3xl backdrop-blur-xl flex flex-col gap-3 sm:gap-4 transition-all duration-700 overflow-hidden group border
                  ${isActive
                    ? `scale-100 lg:scale-105 bg-slate-900/80 ${feat.border} opacity-100 z-10 shadow-2xl ${feat.glow}`
                    : 'scale-[0.90] bg-black/30 border-white/5 opacity-50 z-0 shadow-none'
                  }`}
              >
                {isActive && (
                  <>
                    <div className="absolute top-0 bottom-0 w-[150%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none animate-shimmer-sweep" style={{ left: '-100%' }} />
                    <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-80 rounded-b-full" />
                  </>
                )}

                <div className="flex items-center gap-3.5 sm:gap-4 relative z-10">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${isActive ? feat.bg : 'bg-white/5'} ${isActive ? feat.color : 'text-white/40'} ${isActive ? feat.border : 'border-white/10'} border transition-all duration-500 shadow-inner`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <h3 className={`text-lg sm:text-xl lg:text-2xl font-black tracking-wide transition-colors duration-500 break-words leading-tight ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {feat.title}
                  </h3>
                </div>

                <p className={`text-[13px] sm:text-sm lg:text-base leading-relaxed text-left relative z-10 transition-colors duration-500 break-words mt-1 ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                  {feat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Pagination Dots */}
      <div className="flex flex-wrap justify-center gap-2 lg:gap-2.5 mt-2 lg:mt-6 bg-black/30 px-3.5 py-2 rounded-full border border-white/10 backdrop-blur-md max-w-[90vw]">
        {filteredFeatures.map((_, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (scrollRef.current) {
                const targetElement = scrollRef.current.children[idx] as HTMLElement;
                const scrollPos = targetElement.offsetLeft - (scrollRef.current.offsetWidth / 2) + (targetElement.offsetWidth / 2);
                scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
              }
            }}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 cursor-pointer hover:bg-white/60 ${activeIndex === idx ? 'w-8 sm:w-10 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]' : 'w-1.5 sm:w-2 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
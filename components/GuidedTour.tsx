'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardStore } from '@/store/dashboardStore';
import { ChevronLeft, ChevronRight, X, Clock, Flame, Calendar, ListTodo, Sparkles, Settings, CheckCircle2, Map, BarChart2, StickyNote, Timer as TimerIcon, Newspaper, Trophy, Users, Image as ImageIcon, EyeOff, Sparkles as SparklesIcon } from 'lucide-react';

interface TourStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  icon: React.ElementType;
  positionHint: 'bottom' | 'right' | 'left' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'clock',
    selector: '[data-tour="clock"]',
    title: 'Your Master Time Center',
    description: 'Single-click digits to switch 12h/24h format. Double-click to snap back to center, or click & drag anywhere to position your ideal focus clock!',
    icon: Clock,
    positionHint: 'bottom',
  },
  {
    id: 'focus-pill',
    selector: '[data-tour="focus-pill"]',
    title: 'Live Focus & Streak Tracker',
    description: 'Monitors your active focus streak, total study hours today, and active countdowns. Tap the pill anytime to enter distraction-free Focus Mode (Ctrl+H)!',
    icon: Flame,
    positionHint: 'bottom',
  },
  {
    id: 'wallpaper',
    selector: '[data-tour="wallpaper-btn"]',
    title: 'Instant Ambient Wallpapers',
    description: 'Transform your workspace vibe! Click this top-left toggle to instantly cycle through live animated backgrounds and custom HD wallpapers.',
    icon: ImageIcon,
    positionHint: 'right',
  },
  {
    id: 'calendar-drawer',
    selector: '[data-tour="calendar-drawer"]',
    title: 'Interactive Calendar & Deadlines',
    description: 'Tap the left calendar tab to peek at upcoming deadlines, mark key study dates, and keep your upcoming schedule organized without losing focus.',
    icon: Calendar,
    positionHint: 'right',
  },
  {
    id: 'leaderboard-drawer',
    selector: '[data-tour="leaderboard-drawer"]',
    title: 'Global Leaderboard & Streaks',
    description: 'See how you stack up against top achievers worldwide! Track your daily rank, compare focus hours, and stay motivated every single day.',
    icon: Trophy,
    positionHint: 'right',
  },
  {
    id: 'groups-drawer',
    selector: '[data-tour="groups-drawer"]',
    title: 'Study Groups & Accountability',
    description: 'Join live study rooms with friends! Share group tasks, sync focus timers, chat in real-time, and hold each other accountable to crush goals together.',
    icon: Users,
    positionHint: 'right',
  },
  {
    id: 'task-drawer',
    selector: '[data-tour="task-drawer"]',
    title: 'Task & Sub-Task Command Center',
    description: 'Organize personal to-dos and group assignments with sub-tasks, priority tags, and filter tabs. Swipe out from the right edge anytime to manage your flow!',
    icon: ListTodo,
    positionHint: 'left',
  },
  {
    id: 'news-drawer',
    selector: '[data-tour="news-drawer"]',
    title: 'What\'s New & Product Updates',
    description: 'Stay ahead with new features! Click the newspaper tab to discover recent feature drops, app updates, and pro productivity tips.',
    icon: Newspaper,
    positionHint: 'left',
  },
  {
    id: 'hide-peek',
    selector: '[data-tour="eye-toggle"]',
    title: 'Practice Panic Shortcut (Ctrl+Z)',
    description: 'Try it now! Press Ctrl+Z on your keyboard to test Panic/Peek Mode. Press Ctrl+H for Focus Mode. (Note: If shortcut fails to trigger, click anywhere on the background wallpaper first to focus your screen! You can customize what hides in Settings).',
    icon: EyeOff,
    positionHint: 'left',
  },
  {
    id: 'dock',
    selector: '#nav-dock',
    title: 'App Dock & Timetable Hub',
    description: 'Launch essential web tools (Gemini, Keep, WhatsApp, VS Code, Translate) with 1 click, and expand your customized Weekly Timetable right from the bottom bar!',
    icon: Sparkles,
    positionHint: 'top',
  },
  {
    id: 'plans',
    selector: '[data-tour="plans-btn"]',
    title: 'Roadmap & Goal Planner',
    description: 'Turn big dreams into actionable milestones! Set project phases, track long-term goals, and visualize your progress on interactive Kanban roadmaps.',
    icon: Map,
    positionHint: 'left',
  },
  {
    id: 'stats',
    selector: '[data-tour="stats-btn"]',
    title: 'Focus Analytics & History',
    description: 'Analyze your productivity trends with rich charts, daily focus breakdowns, and task completion logs to discover your peak performance hours.',
    icon: BarChart2,
    positionHint: 'left',
  },
  {
    id: 'stopwatch',
    selector: '[data-tour="stopwatch-btn"]',
    title: 'Precision Stopwatch',
    description: 'Perfect for open-ended study sprints, reading sessions, or practice tests! Features lap timing, pause controls, and floating layout.',
    icon: Clock,
    positionHint: 'left',
  },
  {
    id: 'timer',
    selector: '[data-tour="timer-btn"]',
    title: 'Pomodoro & Interval Timer',
    description: 'Power through deep work sessions with customizable countdowns, interval chimes, and gentle audio alerts to keep your mind locked in.',
    icon: TimerIcon,
    positionHint: 'left',
  },
  {
    id: 'notes',
    selector: '[data-tour="notes-btn"]',
    title: 'Floating Sticky Notes',
    description: 'Never lose a key idea! Jot down quick thoughts, code snippets, links, and scratchpad items on a floating sticky note widget.',
    icon: StickyNote,
    positionHint: 'left',
  },
  {
    id: 'settings',
    selector: '[data-tour="settings-btn"]',
    title: 'Settings & Workspace Control',
    description: 'Customize everything—wallpaper scale, widget visibility, alarm sounds, and hotkeys. Need a refresher? Replay this guided tour anytime from Settings!',
    icon: Settings,
    positionHint: 'left',
  },
];

export default function GuidedTour() {
  const { hasSeenOnboarding, isTourOpen, setIsTourOpen, setHasSeenOnboarding, _hasHydrated } = useDashboardStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hasPracticedShortcut, setHasPracticedShortcut] = useState(false);

  // Auto-start tour for new users on initial load
  useEffect(() => {
    if (_hasHydrated && !hasSeenOnboarding && !isTourOpen) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [_hasHydrated, hasSeenOnboarding, isTourOpen, setIsTourOpen]);

  // Reset practice status on step change
  useEffect(() => {
    setHasPracticedShortcut(false);
  }, [currentStepIndex]);

  // Listen for Ctrl+Z practice during hide-peek step
  useEffect(() => {
    if (!isTourOpen || TOUR_STEPS[currentStepIndex]?.id !== 'hide-peek') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        setHasPracticedShortcut(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, currentStepIndex]);

  // Track combined bounding rect using offsetWidth/offsetHeight to ignore absolute Tooltips
  useEffect(() => {
    if (!isTourOpen) return;

    const updateRect = () => {
      const step = TOUR_STEPS[currentStepIndex];
      if (!step) return;

      const elements = Array.from(document.querySelectorAll(step.selector));
      if (elements.length === 0) {
        setTargetRect(null);
        return;
      }

      let minTop = Infinity;
      let minLeft = Infinity;
      let maxRight = -Infinity;
      let maxBottom = -Infinity;

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        
        const isNavDock = htmlEl.id === 'nav-dock' || step.id === 'dock';
        
        let elTop = rect.top;
        let elLeft = rect.left;
        let elWidth = rect.width;
        let elHeight = rect.height;

        if (isNavDock) {
          const trueHeight = htmlEl.offsetHeight || rect.height;
          const trueWidth = htmlEl.offsetWidth || rect.width;
          elTop = rect.bottom - trueHeight;
          elLeft = rect.left + (rect.width - trueWidth) / 2;
          elWidth = trueWidth;
          elHeight = trueHeight;
        }

        const elRight = elLeft + elWidth;
        const elBottom = elTop + elHeight;

        if (rect.width > 0 && rect.height > 0) {
          minTop = Math.min(minTop, elTop);
          minLeft = Math.min(minLeft, elLeft);
          maxRight = Math.max(maxRight, elRight);
          maxBottom = Math.max(maxBottom, elBottom);
        }
      });

      if (minTop === Infinity) {
        setTargetRect(null);
      } else {
        setTargetRect(
          new DOMRect(
            minLeft,
            minTop,
            Math.max(20, maxRight - minLeft),
            Math.max(20, maxBottom - minTop)
          )
        );
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 150);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isTourOpen, currentStepIndex]);

  if (!isTourOpen || typeof document === 'undefined') return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep?.icon || Sparkles;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const isDesktopScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  let currentTitle = currentStep.title;
  let currentDescription = currentStep.description;

  if (currentStep.id === 'hide-peek') {
    if (isDesktopScreen) {
      if (hasPracticedShortcut) {
        currentTitle = '🎉 Shortcut Practiced Successfully!';
        currentDescription = 'Awesome job! You pressed Ctrl+Z and toggled Panic/Peek Mode! Press Ctrl+Z again to unhide your interface, or click Next to continue the tour.';
      } else {
        currentTitle = 'Practice Panic Shortcut (Ctrl+Z)';
        currentDescription = 'Try it now! Press Ctrl+Z on your keyboard to test Panic/Peek Mode. Press Ctrl+H for Focus Mode. (Note: If shortcut fails to trigger, click anywhere on the background wallpaper first to focus your screen! You can customize what hides in Settings).';
      }
    } else {
      if (hasPracticedShortcut) {
        currentTitle = '🎉 Shortcut Practiced!';
        currentDescription = 'Great job! You toggled Panic Mode using Ctrl+Z! Tap the eye button or press Ctrl+Z again to unhide, or tap Next to continue.';
      } else {
        currentTitle = 'Peek Mode & Panic Shortcuts';
        currentDescription = 'Tap the red eye button on your right toolbar to toggle Peek Mode on mobile! On desktop, try pressing Ctrl+Z for Panic Mode or Ctrl+H for Focus Mode. (If shortcuts don\'t trigger, tap the wallpaper first to focus the screen).';
      }
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkipStep = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleComplete = () => {
    setHasSeenOnboarding(true);
    setIsTourOpen(false);
    setCurrentStepIndex(0);
  };

  // Compute spotlight cutout style cleanly wrapping element bounds
  const getSpotlightStyle = (): React.CSSProperties => {
    if (!targetRect) return { display: 'none' };

    const padding = 5;
    const isFlushLeft = targetRect.left <= 6;
    const isFlushRight = typeof window !== 'undefined' && targetRect.right >= window.innerWidth - 6;

    const top = Math.max(0, targetRect.top - padding);
    const left = isFlushLeft ? -4 : isFlushRight ? targetRect.left - 4 : Math.max(0, targetRect.left - padding);
    const width = isFlushLeft
      ? targetRect.width + 8
      : isFlushRight
      ? targetRect.width + 8
      : targetRect.width + padding * 2;
    const height = targetRect.height + padding * 2;

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  // Compute smart Card Positioning anchored to target rect
  const getCardStyle = (): React.CSSProperties => {
    if (typeof window === 'undefined') return {};
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      if (!targetRect) {
        return {
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        };
      }

      // Dynamic Mobile Placement: If target element is in the bottom half of the screen,
      // flip the card to the TOP (top: 20px). If in top half, keep card at BOTTOM (bottom: 20px).
      const isTargetInBottomHalf = targetRect.top > (window.innerHeight * 0.45);

      if (isTargetInBottomHalf) {
        return {
          position: 'fixed',
          left: '50%',
          top: '20px',
          transform: 'translateX(-50%)',
        };
      } else {
        return {
          position: 'fixed',
          left: '50%',
          bottom: '20px',
          transform: 'translateX(-50%)',
        };
      }
    }

    if (!targetRect) {
      return {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const cardWidth = 380;
    const cardHeight = 230;
    const padding = 20;

    const hint = currentStep.positionHint;

    let top = 0;
    let left = 0;

    if (hint === 'right') {
      left = targetRect.right + padding;
      top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
    } else if (hint === 'left') {
      left = targetRect.left - cardWidth - padding;
      // If element is in lower section of screen (Stopwatch, Timer, Notes & Settings), position card higher up
      if (targetRect.bottom > window.innerHeight - 320) {
        top = targetRect.bottom - cardHeight - 35;
      } else {
        top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
      }
    } else if (hint === 'top') {
      left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
      // Give extra bottom margin (40px) above bottom dock so it doesn't cover it
      top = targetRect.top - cardHeight - 40;
    } else {
      // 'bottom'
      left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
      top = targetRect.bottom + padding;
    }

    // Clamp top so card's bottom edge is AT LEAST 50px above screen bottom (leaving full room for action buttons)
    top = Math.max(16, Math.min(window.innerHeight - cardHeight - 50, top));
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-auto select-none animate-in fade-in duration-300">
      {/* Tour overlay backdrop */}
      <div className="absolute inset-0 bg-transparent" />

      {/* Precise Dynamic Spotlight Cutout Ring (Huge box-shadow dims the rest, 0% shade inside) */}
      {targetRect && (
        <div
          className="fixed rounded-2xl border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.75),0_0_25px_rgba(99,102,241,0.9)] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={getSpotlightStyle()}
        />
      )}

      {/* Tour Card Box with Smart Positioning */}
      <div
        style={getCardStyle()}
        className={`z-10 w-[calc(100vw-32px)] sm:w-[380px] p-5 sm:p-6 bg-slate-900/95 border rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-white flex flex-col gap-3.5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          hasPracticedShortcut ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-indigo-500/30'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border transition-colors ${
              hasPracticedShortcut
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
            }`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
              <h3 className="text-base sm:text-lg font-bold leading-tight text-white">
                {currentTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Close Tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed min-h-[3.25rem]">
          {currentDescription}
        </p>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1.5 my-1">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentStepIndex
                  ? 'w-6 bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
          {/* Previous Step */}
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-white/10 transition-all ${
              isFirstStep
                ? 'opacity-40 cursor-not-allowed text-white/40'
                : 'text-white hover:bg-white/10 active:scale-95 cursor-pointer'
            }`}
          >
            <ChevronLeft size={14} />
            Back
          </button>

          {/* Skip Current Step */}
          <button
            onClick={handleSkipStep}
            className="text-xs font-medium text-white/50 hover:text-white underline underline-offset-4 px-2 transition-colors cursor-pointer"
          >
            Skip step
          </button>

          {/* Next / Finish */}
          <button
            onClick={handleNext}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
              hasPracticedShortcut
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400/50 animate-pulse'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30'
            }`}
          >
            {isLastStep ? (
              <>
                Finish Tour
                <CheckCircle2 size={14} />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

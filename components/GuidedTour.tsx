'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardStore } from '@/store/dashboardStore';
import { ChevronLeft, ChevronRight, Clock, Flame, Calendar, ListTodo, Sparkles, Settings, CheckCircle2, Map, BarChart2, StickyNote, Timer as TimerIcon, Newspaper, Trophy, Users, Image as ImageIcon, EyeOff, Target, CalendarDays, MonitorPlay, Download, Sliders, ExternalLink, PartyPopper, Check, X, Eye } from 'lucide-react';
import WallpaperTutorialModal, { WALLPAPER_TUTORIAL_STEPS } from './WallpaperTutorialModal';

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
    id: 'welcome',
    selector: '',
    title: 'Welcome to GrindBoard! ✨',
    description: 'Your ultimate focus & productivity command center! Master daily focus streaks, sub-tasks, study groups, floating notes, and hotkey privacy modes in this quick tour.',
    icon: Sparkles,
    positionHint: 'bottom',
  },
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
    description: 'Monitors your active focus streak, total study hours today (from Pomodoro Timers, Stopwatches & Task Timers), and time left today to achieve your goals! Click this pill anytime with your mouse as a shortcut to switch to Focus Mode (same as Ctrl+H).',
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
    id: 'manifestation-toggle',
    selector: '[data-tour="manifestation-toggle"]',
    title: 'Your Vision & Manifestation Board ✨',
    description: 'Immerse yourself in your goals! Open this full-screen vision board to view your dream images, motivational videos, and custom quotes. Pin your ultimate desires here to stay laser-focused on your "Why"!',
    icon: Sparkles,
    positionHint: 'left',
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
    selector: '',
    title: 'Practice Peek Mode (Ctrl+Z)',
    description: 'Don\'t want to show your desktop wallpaper or private work to friends or comrades passing by? Press Ctrl+Z (or tap red eye button) for Peek Mode! It hides all widgets so ONLY your background wallpaper shows. (Hotkeys customizable in Settings).',
    icon: EyeOff,
    positionHint: 'bottom',
  },
  {
    id: 'focus-mode',
    selector: '',
    title: 'Practice Focus Mode (Ctrl+H)',
    description: 'Want a distraction-free study zone? Press Ctrl+H (or click the Focus Pill) to activate Focus Mode! In Settings -> Focus / Peek, you can customize EXACTLY what widgets appear or hide during Focus Mode, as well as customize hotkeys.',
    icon: Target,
    positionHint: 'bottom',
  },
  {
    id: 'dock',
    selector: '#nav-dock',
    title: 'App Dock Command Center',
    description: 'Launch essential productivity web tools (Gemini, Keep, WhatsApp, VS Code, Translate) with 1 click right from the bottom dock!',
    icon: Sparkles,
    positionHint: 'top',
  },
  {
    id: 'timetable',
    selector: '[data-tour="timetable-btn"]',
    title: 'Interactive Weekly Timetable 🗓️',
    description: 'Tap to expand your timetable! Timeslots adjust dynamically based on your custom Day Start Time (e.g. 8:00 AM) and duration settings. ⚠️ IMPORTANT: Be sure to click "Backup" (download json) after setting up your schedule to avoid timetable loss during updates—you can 1-click Restore it anytime!',
    icon: CalendarDays,
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
    title: 'Precision Stopwatch & Focus Sync',
    description: 'Tracks open-ended study sprints! Use the checkmark toggle to add elapsed time to Today\'s Focus Hours (credited in 5-min spans) or leave unticked to track wasted/break time. Sessions under 5 mins are discarded.',
    icon: Clock,
    positionHint: 'left',
  },
  {
    id: 'timer',
    selector: '[data-tour="timer-btn"]',
    title: 'Pomodoro & Custom Timers',
    description: 'Run deep work sessions! Synced to server-side time to prevent proxy cheats, crediting stats in 5-minute spans. Stopping a task timer under 5 mins discards incomplete work, while custom timers add every completed 5-min block.',
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
    title: 'Settings & Workspace Control ⚙️',
    description: 'Customize everything—wallpaper scale, alarm ringtones, theme, and hotkeys. Need a refresher? Replay this guided tour anytime from Settings!',
    icon: Settings,
    positionHint: 'left',
  },
];

const FlowerFlowAnimation = () => {
  const flowers = ['🌸', '🌺', '🌻', '🌼', '🌷', '🎉', '✨', '🏵️', '💐', '⭐', '🌸', '🌼', '🌺', '✨', '🌷'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {Array.from({ length: 35 }).map((_, i) => {
        const flower = flowers[i % flowers.length];
        const left = (i * 2.9) % 100;
        const duration = 3.2 + (i % 5) * 0.7;
        const delay = (i % 8) * 0.25;
        const fontSize = 18 + (i % 5) * 5;
        return (
          <div
            key={i}
            className="absolute -top-10 animate-flower-fall opacity-0"
            style={{
              left: `${left}%`,
              fontSize: `${fontSize}px`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }}
          >
            {flower}
          </div>
        );
      })}
      <style jsx global>{`
        @keyframes flowerFall {
          0% {
            transform: translateY(-10vh) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(360deg) scale(1.2);
            opacity: 0;
          }
        }
        .animate-flower-fall {
          animation-name: flowerFall;
        }
      `}</style>
    </div>
  );
};

export default function GuidedTour() {
  const { hasSeenOnboarding, isTourOpen, setIsTourOpen, setHasSeenOnboarding, _hasHydrated, isPanicHidden, isHidden } = useDashboardStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeSteps = React.useMemo(() => {
    if (isMobile) {
      return TOUR_STEPS.filter((step) => step.id !== 'hide-peek');
    }
    return TOUR_STEPS;
  }, [isMobile]);

  useEffect(() => {
    if (currentStepIndex >= activeSteps.length) {
      setCurrentStepIndex(Math.max(0, activeSteps.length - 1));
    }
  }, [activeSteps.length, currentStepIndex]);

  // Mandatory 2-step practice tracking for Peek Mode (Hide -> Unhide)
  const [hasHiddenPeek, setHasHiddenPeek] = useState(false);
  const [hasRestoredPeek, setHasRestoredPeek] = useState(false);

  // Mandatory 2-step practice tracking for Focus Mode (Focus -> Restore)
  const [hasHiddenFocus, setHasHiddenFocus] = useState(false);
  const [hasRestoredFocus, setHasRestoredFocus] = useState(false);

  // Completion modal state
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishModalStep, setFinishModalStep] = useState<1 | 2>(1);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [tourWallpaperStep, setTourWallpaperStep] = useState(0);

  // Auto-start tour for new users on initial load (checking cloud DB & local cache)
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    if (isTourOpen) {
      const hasSeenLocal = typeof window !== 'undefined' && localStorage.getItem('grindboard_has_seen_onboarding') === 'true';
      const hasSeenCloudOrStore = hasSeenOnboarding || Boolean(useDashboardStore.getState().hasSeenOnboarding);
      if (hasSeenLocal || hasSeenCloudOrStore) {
        setIsReplaying(true);
      } else {
        setIsReplaying(false);
      }
    }
  }, [isTourOpen, hasSeenOnboarding]);

  useEffect(() => {
    if (!_hasHydrated) return;

    const hasSeenLocal = typeof window !== 'undefined' && localStorage.getItem('grindboard_has_seen_onboarding') === 'true';
    const hasSeenCloudOrStore = hasSeenOnboarding || Boolean(useDashboardStore.getState().hasSeenOnboarding);

    if (hasSeenLocal || hasSeenCloudOrStore) {
      // If user has already seen onboarding in DB or local cache, ensure tour does not auto-start
      return;
    }

    if (!isTourOpen) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [_hasHydrated, hasSeenOnboarding, isTourOpen, setIsTourOpen]);

  // Reset practice statuses on step change
  useEffect(() => {
    setHasHiddenPeek(false);
    setHasRestoredPeek(false);
    setHasHiddenFocus(false);
    setHasRestoredFocus(false);
  }, [currentStepIndex]);

  // Ensure workspace starts UNHIDDEN when user enters practice steps
  useEffect(() => {
    if (!isTourOpen) return;
    const currentStepId = activeSteps[currentStepIndex]?.id;
    if (currentStepId === 'hide-peek') {
      if (useDashboardStore.getState().isPanicHidden) {
        useDashboardStore.getState().togglePanicHide();
      }
    } else if (currentStepId === 'focus-mode') {
      if (useDashboardStore.getState().isHidden) {
        useDashboardStore.getState().toggleHide();
      }
    }
  }, [currentStepIndex, isTourOpen, activeSteps]);

  // Monitor changes to isPanicHidden during hide-peek step
  useEffect(() => {
    if (!isTourOpen || activeSteps[currentStepIndex]?.id !== 'hide-peek') return;

    if (isPanicHidden) {
      setHasHiddenPeek(true);
    } else if (!isPanicHidden && hasHiddenPeek) {
      setHasRestoredPeek(true);
    }
  }, [isPanicHidden, isTourOpen, currentStepIndex, hasHiddenPeek, activeSteps]);

  // Monitor changes to isHidden during focus-mode step
  useEffect(() => {
    if (!isTourOpen || activeSteps[currentStepIndex]?.id !== 'focus-mode') return;

    if (isHidden) {
      setHasHiddenFocus(true);
    } else if (!isHidden && hasHiddenFocus) {
      setHasRestoredFocus(true);
    }
  }, [isHidden, isTourOpen, currentStepIndex, hasHiddenFocus, activeSteps]);

  // Track combined bounding rect using offsetWidth/offsetHeight to ignore absolute Tooltips
  useEffect(() => {
    if (!isTourOpen) return;

    const updateRect = () => {
      const step = activeSteps[currentStepIndex];
      if (!step || !step.selector) {
        setTargetRect(null);
        return;
      }

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

  const currentStep = activeSteps[currentStepIndex];
  const StepIcon = currentStep?.icon || Sparkles;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  const isDesktopScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const currentStepId = currentStep?.id;
  const isPanicStep = currentStepId === 'hide-peek';
  const isFocusStep = currentStepId === 'focus-mode';

  // Practice states
  const hasPracticedPanic = hasHiddenPeek && hasRestoredPeek && !isPanicHidden;
  const hasPracticedFocus = hasHiddenFocus && hasRestoredFocus && !isHidden;

  const isPanicLocked = isPanicStep && !hasPracticedPanic;
  const isFocusLocked = isFocusStep && !hasPracticedFocus;
  const isStepLocked = isPanicLocked || isFocusLocked;

  let currentTitle = currentStep?.title || '';
  let currentDescription = currentStep?.description || '';

  if (isPanicStep) {
    if (hasPracticedPanic) {
      currentTitle = '🎉 Peek Mode Practice Complete!';
      currentDescription = isDesktopScreen
        ? 'Awesome! You mastered Peek Mode (Ctrl+Z)! Whenever friends or comrades pass by and you don\'t want to show your wallpaper or private work, use Ctrl+Z anytime. You can customize this hotkey in Settings -> Focus / Peek!'
        : 'Awesome! You mastered Peek Mode! Whenever friends or comrades pass by and you don\'t want to show your wallpaper or private work, tap the red eye button. You can customize hotkeys in Settings!';
    } else if (hasHiddenPeek || isPanicHidden) {
      currentTitle = '🙈 Workspace Hidden! Now Unhide It!';
      currentDescription = isDesktopScreen
        ? 'Great job! Peek Mode hid all your widgets, leaving ONLY your background wallpaper showing. Press Ctrl+Z AGAIN on your keyboard (or click wallpaper first if unfocused) to unhide!'
        : 'Great job! Peek Mode hid all your widgets, leaving ONLY your wallpaper showing. Tap the SAME hidden spot on the right toolbar where the red eye button was to unhide!';
    } else {
      currentTitle = isDesktopScreen ? 'Practice Peek Mode (Ctrl+Z)' : 'Practice Peek Mode (Eye Toggle)';
      currentDescription = isDesktopScreen
        ? 'Don\'t want to show your wallpaper or private work to friends or comrades passing by? Press Ctrl+Z to test Peek Mode! It hides all widgets so ONLY your background wallpaper shows. (You can customize hotkeys in Settings).'
        : 'Don\'t want to show your wallpaper or private work to friends or comrades passing by? Tap the red eye button on your right toolbar to test Peek Mode! It hides all widgets so ONLY your background wallpaper shows. (You can customize hotkeys in Settings).';
    }
  }

  if (isFocusStep) {
    if (hasPracticedFocus) {
      currentTitle = '🎉 Focus Mode Practice Complete!';
      currentDescription = isDesktopScreen
        ? 'Awesome! You mastered Focus Mode (Ctrl+H)! You can customize exactly what widgets appear or hide during Focus Mode in Settings -> Focus / Peek, as well as customize your hotkey!'
        : 'Awesome! You mastered Focus Mode! You can customize exactly what widgets appear or hide during Focus Mode in Settings -> Focus / Peek, as well as customize your hotkey!';
    } else if (hasHiddenFocus || isHidden) {
      currentTitle = '🎯 Focus Mode Active! Now Unhide It!';
      currentDescription = isDesktopScreen
        ? 'Great job! Non-essential widgets hidden for deep focus. Now press Ctrl+H AGAIN on your keyboard (or tap the Focus Pill) to unhide & restore your full layout!'
        : 'Great job! Non-essential widgets hidden for deep focus. Now tap the top "Today Hrs" pill AGAIN to unhide & restore your layout!';
    } else {
      currentTitle = isDesktopScreen ? 'Practice Focus Mode (Ctrl+H)' : 'Practice Focus Mode (Focus Pill)';
      currentDescription = isDesktopScreen
        ? 'Want a distraction-free study zone? Press Ctrl+H on your keyboard to enter Focus Mode! In Settings -> Focus / Peek, you can choose exactly what widgets appear or hide during focus, and customize hotkeys!'
        : 'Want a distraction-free study zone? Tap the top "Today Hrs" pill to enter Focus Mode! (Note: The red eye button on the right toolbar toggles Peek Mode to show only wallpaper; click the same empty spot to get back). No practice required for that, but go ahead and tap the "Today Hrs" pill now to test Focus Mode!';
    }
  }

  const ensureWorkspaceVisible = () => {
    const store = useDashboardStore.getState();
    if (store.isPanicHidden) {
      store.togglePanicHide();
    }
    if (store.isHidden) {
      store.toggleHide();
    }
  };

  const handleNext = () => {
    if (isStepLocked) return;
    ensureWorkspaceVisible();
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    ensureWorkspaceVisible();
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkipStep = () => {
    if (isStepLocked) return;
    ensureWorkspaceVisible();
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleComplete = () => {
    ensureWorkspaceVisible();
    setHasSeenOnboarding(true);
    setIsTourOpen(false);
    setCurrentStepIndex(0);
    setFinishModalStep(1);
    setShowFinishModal(true);
  };

  const handleCloseTour = () => {
    ensureWorkspaceVisible();
    setIsTourOpen(false);
    setHasSeenOnboarding(true);
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
    const cardHeight = 220;
    const padding = 16;

    const hint = currentStep.positionHint;

    let top = 0;
    let left = 0;

    if (hint === 'right') {
      left = targetRect.right + padding;
      top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
    } else if (hint === 'left') {
      left = targetRect.left - cardWidth - padding;
      // For lower right toolbar items (Stopwatch, Timer, Notes, Settings & Preferences), position card significantly higher up
      const isBottomToolbarItem = ['stopwatch', 'timer', 'notes', 'settings', 'preferences-visibility'].includes(currentStep.id) || targetRect.bottom > window.innerHeight - 350;
      if (isBottomToolbarItem) {
        top = targetRect.top - cardHeight - 20;
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

    // Clamp top so card's bottom edge is AT LEAST 120px above screen bottom for bottom toolbar elements
    const isBottomToolbarItem = ['stopwatch', 'timer', 'notes', 'settings', 'preferences-visibility'].includes(currentStep.id) || targetRect.bottom > window.innerHeight - 350;
    const maxTopAllowed = isBottomToolbarItem
      ? window.innerHeight - cardHeight - 120
      : window.innerHeight - cardHeight - 50;

    top = Math.max(16, Math.min(maxTopAllowed, top));
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  if (showFinishModal && typeof document !== 'undefined') {
    return createPortal(
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99990] flex items-center justify-center p-4 select-none">
        <FlowerFlowAnimation />
        <div className="relative z-[100000] bg-[#12121a] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_60px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-300 text-white flex flex-col gap-4">
          
          {/* Header & Celebration */}
          <div className="flex flex-col items-center text-center gap-1.5 border-b border-white/10 pb-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-0.5">
              <PartyPopper className="w-6 h-6 text-white animate-bounce" />
            </div>
            <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
              Congratulations! Tour Completed! 🎉
            </h2>
            <p className="text-xs text-white/70">
              Here are 2 essential pro tips to get the ultimate experience from GrindBoard:
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 gap-1">
            <button
              onClick={() => setFinishModalStep(1)}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                finishModalStep === 1
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Sliders size={14} />
              <span>1. Preferences & Focus Mode</span>
            </button>
            <button
              onClick={() => setFinishModalStep(2)}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                finishModalStep === 2
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <MonitorPlay size={14} />
              <span>2. PC Desktop Wallpaper</span>
            </button>
          </div>

          {/* Step 1 Content: Preferences & Focus Mode setup */}
          {finishModalStep === 1 && (
            <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/80 leading-relaxed animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Sliders className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Hide Any Unwanted Widgets or Controls</h4>
                  <p className="text-white/70">
                    Want a cleaner layout? Any widget, button, or drawer on screen (Timers, Notes, Calendar, Deadlines, Dock, Stopwatch, etc.) can be turned OFF anytime!
                  </p>
                </div>
              </div>
              
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <Sparkles size={12} className="text-amber-300" />
                  <span>Two Ways to Customize Visibility:</span>
                </div>
                <p className="text-white/80">
                  1️⃣ <strong>Settings (⚙️) ➔ Preferences / Visibility:</strong> Permanently toggle off any widget you don't want on your screen.
                </p>
                <p className="text-white/80">
                  2️⃣ <strong>Focus Mode Specific Setup:</strong> In <strong>Settings ➔ Focus / Peek</strong>, choose exactly which widgets hide during Focus Mode (Ctrl+H) so you only see what you need!
                </p>
              </div>
            </div>
          )}

          {/* Step 2 Content: PC Wallpaper Setup with Interactive Screenshot Carousel */}
          {finishModalStep === 2 && (
            <div className="flex flex-col gap-2.5 bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10 text-xs text-white/80 max-h-[48vh] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 gap-2">
                <div className="flex items-center gap-1.5 text-blue-300 font-bold min-w-0">
                  <MonitorPlay className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">Windows Interactive Desktop Setup</span>
                </div>
                <span className="text-[9px] font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full shrink-0">
                  {WALLPAPER_TUTORIAL_STEPS[tourWallpaperStep].badge}
                </span>
              </div>

              {/* Interactive Screenshot Viewer with Left/Right Arrows */}
              <div className="relative group bg-black/70 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center min-h-[150px] sm:min-h-[190px] shadow-inner">
                <img
                  src={WALLPAPER_TUTORIAL_STEPS[tourWallpaperStep].image}
                  alt={WALLPAPER_TUTORIAL_STEPS[tourWallpaperStep].title}
                  className="w-full h-auto max-h-[210px] object-contain cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                  onClick={() => setIsWallpaperModalOpen(true)}
                />

                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded text-[9px] font-semibold text-white/80 flex items-center gap-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <Eye size={10} className="text-blue-400" />
                  <span>Click to Expand</span>
                </div>

                {/* Left Arrow Navigation Button */}
                <button
                  onClick={() => setTourWallpaperStep((prev) => Math.max(0, prev - 1))}
                  disabled={tourWallpaperStep === 0}
                  className={`absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-xl bg-black/80 hover:bg-blue-600 text-white border border-white/20 transition-all cursor-pointer ${
                    tourWallpaperStep === 0 ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'opacity-90 hover:opacity-100'
                  }`}
                  title="Previous Step"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Right Arrow Navigation Button */}
                <button
                  onClick={() => setTourWallpaperStep((prev) => Math.min(WALLPAPER_TUTORIAL_STEPS.length - 1, prev + 1))}
                  disabled={tourWallpaperStep === WALLPAPER_TUTORIAL_STEPS.length - 1}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-xl bg-black/80 hover:bg-blue-600 text-white border border-white/20 transition-all cursor-pointer ${
                    tourWallpaperStep === WALLPAPER_TUTORIAL_STEPS.length - 1 ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'opacity-90 hover:opacity-100'
                  }`}
                  title="Next Step"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Step Title & Description Details */}
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1 text-[11px]">
                <div className="font-bold text-white text-xs flex items-center justify-between">
                  <span>{WALLPAPER_TUTORIAL_STEPS[tourWallpaperStep].title}</span>
                  <button
                    onClick={() => setIsWallpaperModalOpen(true)}
                    className="text-[10px] text-blue-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Full View</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
                <p className="text-white/75 leading-relaxed">
                  {WALLPAPER_TUTORIAL_STEPS[tourWallpaperStep].description}
                </p>
              </div>

              {/* Dots Indicator */}
              <div className="flex items-center justify-center gap-1 py-0.5">
                {WALLPAPER_TUTORIAL_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTourWallpaperStep(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === tourWallpaperStep ? 'w-5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Modal Action Buttons (Back / Next / Finish) */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
            {finishModalStep === 1 ? (
              <div />
            ) : (
              <button
                onClick={() => setFinishModalStep(1)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}

            {finishModalStep === 1 ? (
              <button
                onClick={() => setFinishModalStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer ml-auto"
              >
                <span>Next: PC Wallpaper Setup</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Awesome, Let's Grind! 🚀</span>
              </button>
            )}
          </div>
        </div>

        {/* Full Interactive Wallpaper Tutorial Modal */}
        <WallpaperTutorialModal
          isOpen={isWallpaperModalOpen}
          onClose={() => setIsWallpaperModalOpen(false)}
          initialStep={tourWallpaperStep}
        />
      </div>,
      document.body
    );
  }

  if (!isTourOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-auto select-none animate-in fade-in duration-300">
      {/* Floating Exit Button ONLY for Tour Replay Mode (Positioned Top-Right of Screen) */}
      {isReplaying && (
        <button
          onClick={handleCloseTour}
          className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[100001] px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900/90 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:shadow-red-500/20"
          title="Close & Exit Tour"
        >
          <X className="w-4 h-4 text-red-400" />
          <span>Exit Tour</span>
        </button>
      )}

      {/* Tour overlay backdrop - Glassy dark blur for Welcome Step 0 */}
      <div className={`absolute inset-0 transition-all duration-500 ${isFirstStep ? 'bg-slate-950/75 backdrop-blur-md' : 'bg-transparent'}`} />

      {/* Precise Dynamic Spotlight Cutout Ring (Huge box-shadow dims the rest, 0% shade inside) */}
      {targetRect && (
        <div
          className="fixed rounded-2xl border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.75),0_0_25px_rgba(99,102,241,0.9)] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={getSpotlightStyle()}
        />
      )}

      {/* Tour Card Box with Smart Compact Positioning */}
      <div
        style={getCardStyle()}
        className={`z-10 w-[calc(100vw-32px)] sm:w-[380px] p-3.5 sm:p-4 bg-slate-900/95 border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-white flex flex-col gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          (hasPracticedPanic || hasPracticedFocus) ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-indigo-500/40'
        }`}
      >
        {isFirstStep ? (
          /* Animated Glassy Welcome Step */
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400/20 via-indigo-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold tracking-widest text-amber-300 uppercase bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                    Productivity Command Center
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent mt-0.5">
                    Welcome to GrindBoard! ✨
                  </h3>
                </div>
              </div>
            </div>

            {/* Must Read Callout Banner */}
            <div className="bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-300">
              <span>⚠️</span>
              <span>Please read this quick guide carefully to master all features!</span>
            </div>

            <p className="text-xs text-white/90 leading-snug bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-md">
              🔥 <strong className="text-indigo-300 font-bold">Master your daily focus flow!</strong> Discover streak tracking, sub-task management, live study groups with friends, floating notes, and instant hotkey privacy modes.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-white/80">
              <div className="flex items-center justify-center gap-1 bg-indigo-500/15 border border-indigo-500/30 p-1.5 rounded-lg text-indigo-200">
                <span className="text-emerald-400 font-bold">✓</span> 100% Free & Custom
              </div>
              <div className="flex items-center justify-center gap-1 bg-purple-500/15 border border-purple-500/30 p-1.5 rounded-lg text-purple-200">
                <span className="text-amber-400 font-bold">⚡</span> Quick 1-Min Tour
              </div>
            </div>
          </div>
        ) : (
          /* Standard Step Header & Description */
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                  (hasPracticedPanic || hasPracticedFocus)
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                }`}>
                  <StepIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold tracking-widest text-indigo-300 uppercase">
                    Step {currentStepIndex + 1} of {activeSteps.length}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold leading-tight text-white truncate">
                    {currentTitle}
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/85 leading-snug min-h-[2.5rem]">
              {currentDescription}
            </p>
          </>
        )}

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1.5 my-0.5">
          {activeSteps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                ensureWorkspaceVisible();
                setCurrentStepIndex(idx);
              }}
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
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-white/10 transition-all ${
              isFirstStep
                ? 'opacity-40 cursor-not-allowed text-white/40'
                : 'text-white hover:bg-white/10 active:scale-95 cursor-pointer'
            }`}
          >
            <ChevronLeft size={14} />
            Back
          </button>

          {/* Skip Current Step */}
          {!isLastStep && !isStepLocked && (
            <button
              onClick={handleSkipStep}
              className="text-xs font-medium text-white/50 hover:text-white underline underline-offset-4 px-1.5 transition-colors cursor-pointer"
            >
              Skip step
            </button>
          )}

          {/* Next / Start / Finish */}
          <button
            onClick={handleNext}
            disabled={isStepLocked}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
              isStepLocked
                ? 'bg-slate-800 text-white/40 border border-white/10 cursor-not-allowed opacity-75'
                : (hasPracticedPanic || hasPracticedFocus)
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400/50 animate-pulse cursor-pointer'
                : isFirstStep
                ? 'bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-white shadow-lg shadow-amber-500/30 animate-pulse cursor-pointer'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 cursor-pointer'
            }`}
          >
            {isPanicLocked ? (
              <>
                🔒 {hasHiddenPeek || isPanicHidden 
                      ? (isDesktopScreen ? 'Do Ctrl+Z to Unhide' : 'Tap Eye to Unhide')
                      : (isDesktopScreen ? 'Do Ctrl+Z to Hide' : 'Tap Eye to Hide')}
              </>
            ) : isFocusLocked ? (
              <>
                🔒 {hasHiddenFocus || isHidden 
                      ? (isDesktopScreen ? 'Do Ctrl+H to Restore' : 'Tap Pill to Restore')
                      : (isDesktopScreen ? 'Do Ctrl+H to Focus' : 'Tap Pill to Focus')}
              </>
            ) : isFirstStep ? (
              <>
                Start Tour
                <ChevronRight size={14} />
              </>
            ) : isLastStep ? (
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

import { useEffect, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { fetchQuote } from '@/utils/quoteEngine';

export function useDashboardLogic(isMobile: boolean, _hasHydrated: boolean) {
  const calendarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- State Healer ---
  useEffect(() => {
    const state = useDashboardStore.getState();
    let healed = false;
    const healArray = (arr: string[]) => {
      if (!Array.isArray(arr)) return arr;
      const originalLength = arr.length;
      const newArr = arr.filter(item => !(typeof item === 'string' && item.startsWith('data:image') && item.length > 500000));
      if (newArr.length !== originalLength) healed = true;
      return newArr;
    };

    if (healed) {
      useDashboardStore.setState({
        customDesktopWallpapers: healArray(state.customDesktopWallpapers),
        customMobileWallpapers: healArray(state.customMobileWallpapers)
      });
      setTimeout(() => useDashboardStore.getState().forceInstantSave(), 1000);
    }
  }, []);

  // --- Mutually Exclusive Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if (e.altKey && (e.key?.toLowerCase() === 'f4' || e.code === 'F4' || e.keyCode === 115)) return;

      const state = useDashboardStore.getState();
      let fKey = state.focusShortcutKey;
      if (!fKey.includes('+') && fKey.length === 1) fKey = 'ctrl+' + fKey;
      let pKey = state.panicShortcutKey;
      if (!pKey.includes('+') && pKey.length === 1) pKey = 'ctrl+' + pKey;

      const checkShortcut = (ev: KeyboardEvent, shortcut: string) => {
        const parts = shortcut.split('+');
        const key = parts.pop();
        return ev.ctrlKey === parts.includes('ctrl') && 
               ev.shiftKey === parts.includes('shift') && 
               ev.altKey === false && 
               ev.key?.toLowerCase() === key;
      };

      // PEEK MODE (Focus)
      if (checkShortcut(e, fKey)) {
        e.preventDefault();
        state.setIsManifestationOpen(false);
        // MUTUALLY EXCLUSIVE RULE: If turning ON Peek while Panic is ON -> Turn OFF Panic first
        if (!state.isHidden && state.isPanicHidden) {
          state.togglePanicHide();
        }
        state.toggleHide();
      }

      // PANIC MODE
      if (checkShortcut(e, pKey)) {
        e.preventDefault();
        state.setIsManifestationOpen(false);
        // MUTUALLY EXCLUSIVE RULE: If turning ON Panic while Peek is ON -> Turn OFF Peek first
        if (!state.isPanicHidden && state.isHidden) {
          state.toggleHide();
        }
        state.togglePanicHide();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Calendar Auto-Close Logic ---
  const handleCalendarExpand = () => {
    useDashboardStore.setState({ isCalendarOpen: true });
    if (calendarTimeoutRef.current) clearTimeout(calendarTimeoutRef.current);
    calendarTimeoutRef.current = setTimeout(() => {
      if (!useDashboardStore.getState().isCalendarBusy) {
        useDashboardStore.setState({ isCalendarOpen: false });
      }
    }, 8000);
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    const isCalendarOpen = useDashboardStore.getState().isCalendarOpen;
    const isCalendarBusy = useDashboardStore.getState().isCalendarBusy;

    if (isCalendarOpen) {
      if (isCalendarBusy) {
        if (calendarTimeoutRef.current) clearTimeout(calendarTimeoutRef.current);
      } else {
        handleCalendarExpand();
      }
    }
    return () => { if (calendarTimeoutRef.current) clearTimeout(calendarTimeoutRef.current); };
  }, [useDashboardStore.getState().isCalendarBusy, useDashboardStore.getState().isCalendarOpen, _hasHydrated]);

  // --- Quotes & Countdowns Initialization ---
  useEffect(() => {
    if (!_hasHydrated) return;
    const showQuotePopup = useDashboardStore.getState().showQuotePopup;
    
    const initialTimer = setTimeout(async () => showQuotePopup(await fetchQuote()), 5000);
    const interval = setInterval(async () => showQuotePopup(await fetchQuote()), 30 * 60 * 1000);

    const autoOpen = useDashboardStore.getState().autoOpenCountdowns;
    if (autoOpen !== false) useDashboardStore.getState().setIsMobileCountdownsVisible(true);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [_hasHydrated]);

  // --- Wallpaper Cycler ---
  const cycleWallpaper = async () => {
    const state = useDashboardStore.getState();
    const list = isMobile ? state.customMobileWallpapers : state.customDesktopWallpapers;
    const activeIndex = isMobile ? state.activeMobileCustomIndex : state.activeDesktopCustomIndex;
    const setIndex = isMobile ? state.setActiveMobileCustomIndex : state.setActiveDesktopCustomIndex;

    if (!list || list.length === 0) {
      state.cycleBackground();
      return;
    }

    let nextIndex = activeIndex === null ? 0 : (activeIndex + 1) % list.length;
    let foundValid = false;
    let attempts = 0;

    while (attempts < list.length) {
      const url = list[nextIndex];
      if (url.startsWith('custom-')) {
        const { getWallpaperFromDB } = await import('@/lib/indexedDB');
        let blob = await getWallpaperFromDB(url);
        if (!blob) {
          await new Promise(r => setTimeout(r, 200));
          blob = await getWallpaperFromDB(url);
        }
        if (blob) { foundValid = true; break; }
      } else {
        foundValid = true; break;
      }
      nextIndex = (nextIndex + 1) % list.length;
      attempts++;
    }

    if (foundValid) setIndex(nextIndex);
    else { setIndex(null); state.cycleBackground(); }
  };

  return { handleCalendarExpand, cycleWallpaper };
}
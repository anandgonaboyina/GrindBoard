'use client';

import { useCallback, useRef, useState } from 'react';
import { useTaskStore, Task } from '@/store/taskStore';
import { normalizeTitle } from './timetableStatsUtils';

export type PlanDay = 'today' | 'tomorrow';
export interface PlanItem { title: string; duration: number }

interface Conflict { item: PlanItem; existing: Task; existingTabName: string }
interface TabPick { items: PlanItem[]; day: PlanDay }
interface Pending { day: PlanDay; groupId: number; tabName: string; fresh: PlanItem[]; conflicts: Conflict[] }

const uid = (i: number) => `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Flow: requestAdd(items) -> user picks the tab (tabPick) -> chooseTab(idx)
 *   -> no duplicates: added right away
 *   -> duplicates: confirm (pending) -> resolve('replace' | 'skip')
 * Replace = the existing task becomes a fresh one (full duration back, done time 0, not completed, in the chosen tab).
 * Skip = duplicates untouched, new ones still added. Other tasks are never removed.
 */
export function usePlanYourDay() {
  const taskGroupNames = useTaskStore(s => s.taskGroupNames);
  const [tabPick, setTabPick] = useState<TabPick | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const tabPickRef = useRef<TabPick | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabNames = [0, 1, 2].map(i => taskGroupNames?.[i] || `Tab ${i + 1}`);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  const commit = (p: Pending, replace: boolean) => {
    const s = useTaskStore.getState();
    const list = p.day === 'today' ? s.tasks : s.tomorrowTasks;

    const replaceMap = new Map<string, number>(); // task id -> new planned duration
    if (replace) p.conflicts.forEach(c => replaceMap.set(c.existing.id, c.item.duration));

    const updated = list.map(t =>
      replaceMap.has(t.id)
        ? { ...t, duration: replaceMap.get(t.id) as number, timeSpent: 0, completed: false, groupId: p.groupId }
        : t
    );
    const added: Task[] = p.fresh.map((it, i) => ({
      id: uid(i), title: it.title, duration: it.duration, completed: false, timeSpent: 0, groupId: p.groupId,
    }));

    // One write for the whole batch (addTask uses Date.now() ids, which would collide in a loop)
    if (added.length || replaceMap.size) s.setTasks([...updated, ...added], p.day);

    const dayLabel = p.day === 'today' ? 'Today' : 'Tomorrow';
    const parts: string[] = [];
    if (added.length) parts.push(`Added ${added.length} task${added.length > 1 ? 's' : ''} to “${p.tabName}” (${dayLabel})`);
    if (replace && p.conflicts.length) parts.push(`${p.conflicts.length} replaced as fresh in “${p.tabName}”`);
    if (!replace && p.conflicts.length) parts.push(`skipped ${p.conflicts.length} already in your plan`);
    showNotice(parts.length ? parts.join(' · ') : 'Nothing to add');
  };

  // Step 1: remember what to add and ask which tab
  const requestAdd = useCallback((items: PlanItem[], day: PlanDay) => {
    const merged = new Map<string, PlanItem>(); // same title (case-insensitive) = one task
    items.filter(i => i.duration > 0).forEach(i => {
      const k = normalizeTitle(i.title);
      const hit = merged.get(k);
      hit ? (hit.duration += i.duration) : merged.set(k, { ...i });
    });
    if (merged.size === 0) return;
    const tp: TabPick = { items: Array.from(merged.values()), day };
    tabPickRef.current = tp;
    setTabPick(tp);
  }, []);

  const cancelPick = useCallback(() => {
    tabPickRef.current = null;
    setTabPick(null);
  }, []);

  // Step 2: tab chosen -> check duplicates (all 3 tabs of that day)
  const chooseTab = useCallback((groupId: number) => {
    const tp = tabPickRef.current;
    if (!tp) return;
    tabPickRef.current = null;
    setTabPick(null);

    const s = useTaskStore.getState();
    const names = s.taskGroupNames || [];
    const nameOf = (i: number) => names[i] || `Tab ${i + 1}`;
    const dayTasks = tp.day === 'today' ? s.tasks : s.tomorrowTasks;
    const fresh: PlanItem[] = [];
    const conflicts: Conflict[] = [];

    tp.items.forEach(item => {
      const k = normalizeTitle(item.title);
      const existing = dayTasks.find(t => normalizeTitle(t.title) === k);
      existing
        ? conflicts.push({ item, existing, existingTabName: nameOf(existing.groupId || 0) })
        : fresh.push(item);
    });

    const p: Pending = { day: tp.day, groupId, tabName: nameOf(groupId), fresh, conflicts };
    if (conflicts.length === 0) { commit(p, false); return; }
    pendingRef.current = p;
    setPending(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref guard: a double callback from the confirm dialog can never apply twice.
  const resolve = useCallback((choice: 'replace' | 'skip') => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    setPending(null);
    commit(p, choice === 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tabPick, tabNames, requestAdd, cancelPick, chooseTab, pending, resolve, notice };
}

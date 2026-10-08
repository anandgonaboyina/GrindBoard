# Productivity Dashboard Architecture Guide

This document provides a comprehensive overview of the `dashboard-cloud` application architecture, focusing on the offline-first sync engine, state management, and key component workflows (like the Timer and Deadman switches).

If you are a Full Stack MERN developer, this guide bridges the gap between a standard React/Express app and this highly specialized Next.js + Zustand + Offline-First architecture.

---

## 1. High-Level Philosophy

The app is designed to be **Offline-First**. This means:
1. The UI *never* waits for an API call to update.
2. All data is written to local Zustand stores (and persisted to `localStorage`).
3. A background Sync Engine (`sync.ts`) quietly pushes these changes to MongoDB.
4. If a network request fails or the user is offline, changes are queued and retried automatically.

### Tech Stack
- **Frontend**: Next.js (App Router), React Client Components, TailwindCSS, Zustand.
- **Backend**: Next.js API Routes (`/app/api/...`), MongoDB.
- **Auth**: JWT-based (stored in `localStorage` as `dashboard_sync_token`).

---

## 2. State Management (Zustand)

Instead of a single massive store or React Context, the state is divided into logical domains inside the `/store` directory:

- **`dashboardStore/`**: The core store. Manages the Timer, Stopwatch, active tasks, user settings, and the Sync Engine.
- **`taskStore.ts`**: Manages the To-Do lists, Task groupings, and durations.
- **`timetableStore.ts`**: Manages the weekly grid, colors, and blueprint.
- **`noteStore.ts`**: Manages the rich text notes.

All these stores use Zustand's `persist` middleware, meaning any state change is instantly written to `localStorage`.

---

## 3. The Offline-First Sync Engine (`sync.ts`)

This is the most complex part of the app. It lives in `store/dashboardStore/sync.ts` and `app/api/store/route.ts`.

### How Saving Works
1. When a user clicks a button (e.g., changes a setting), we call a Zustand action: `useDashboardStore.setState({ someSetting: true })`.
2. The UI instantly updates.
3. We call `triggerInstantSave()` or let the debounced auto-save handle it.
4. `performSave()` in `sync.ts` runs. It compares the current `localStorage` state against `lastSavedValue` to find what changed (the **delta** payload).
5. It sends *only the changes* to `POST /api/store`.

### Atomic Offline Queues
For critical data that cannot simply be overwritten (like deleting a task or adding a note), the app uses Atomic Queues. 
If you go offline and delete 3 tasks, those actions are pushed to `tasks_offline_queue` in `localStorage`. When the connection returns, `processQueue` sends them sequentially so no data is lost.

### 409 Conflict Resolution & Multi-Device Sync
Because users might have the app open on their phone, tab and laptop simultaneously:
- The server tracks a `lastModified` timestamp.
- If the frontend sends a payload with an old timestamp, the server rejects it with a **409 Conflict** and returns the latest cloud data.
- `sync.ts` catches the 409, merges the cloud data with the local data (`...parsedLocal.state` takes priority for local edits), and retries the save.

### Anti-Tamper Secure Queue
Focus minutes are tracked securely. `getSecureFocusQueue` hashes the minutes logged (`unsaved_focus_mins`) using the JWT token as a salt. If a user tries to manually edit `localStorage` to give themselves 10,000 focus minutes, the hash will fail, and the engine will discard the tampered data.

---

## 4. Key Component Workflows

### Timer & Stopwatch (`components/Timer.tsx`)
The timer is highly optimized to run across multiple devices without duplicating time.

- **Ownership (`timerDeviceId`)**: When you start a timer on your laptop, the laptop becomes the "Owner". Only the owner executes the logic to add minutes to the database (`addMins()`). If you open your phone, the phone sees it is *not* the owner and only visually ticks down, saving database calls.
- **5-Minute Chunking**: The Timer doesn't wait until the end to save data. Every 5 minutes, it calculates how many "chunks" have passed (`savedChunksRef`) and saves those minutes instantly. This prevents data loss if the tab crashes.

### The 3-Hour Deadman Switch
To prevent runaway timers if a user falls asleep:
1. Inside the Timer's `setInterval`, it checks if `elapsedSecs >= 180 * 60` (3 hours).
2. If true, it sets `deadmanTriggeredAtRef.current = Date.now()` and shows the "Are you still working?" modal (`showStillWorkingPrompt`).
3. While triggered, chunk saving is paused.
4. A 5-minute timeout starts (`deadmanTimeoutRef`). If the user doesn't click "Yes, I'm here", the timer auto-stops and saves the exact 3-hour mark, discarding the extra 5 idle minutes.
5. If the user clicks "Yes", `deadmanTriggeredAtRef` is set to `-1` to prevent it from triggering again immediately.

---

## 5. Adding New Features (Dev Guide)

If you want to add a new feature (e.g., a "Pomodoro Counter" setting), follow this workflow:

1. **Add to Types**: Update `DashboardState` in `store/dashboardStore/types.ts`.
2. **Add to Zustand**: Initialize the default value in `store/dashboardStore/index.ts`.
3. **Add to API Route**: If it's a setting, ensure the key is allowed in `app/api/store/route.ts` (usually handled automatically by the delta diffing, unless it requires a specific collection mapping).
4. **Build the UI**: Create your component and read the state via `const pomodoroCount = useDashboardStore(state => state.pomodoroCount);`.
5. **Update State**: When updating, just call `useDashboardStore.setState({ pomodoroCount: newCount })` and call `triggerInstantSave()`. The Sync Engine handles the rest.

### Common Pitfalls
- **Hydration Errors**: Next.js server-side renders (SSR) the initial HTML. If your component relies on `localStorage` (which is null on the server), Next.js will crash. Always use the `useDashboardLogic` hook's `hasHydrated` flag or a `useEffect` to ensure the component only renders after the store has loaded client-side.
- **Infinite Loops**: Do not put the entire `store` in a `useEffect` dependency array (`[store]`). Always pick specific primitives: `[store.timerEndAt, store.isTimerOpen]`.
- **Duplicate Keys**: React Strict Mode renders components twice in dev mode. Ensure your `.map(item => <div key={item.id}>)` keys are truly unique to avoid React errors.


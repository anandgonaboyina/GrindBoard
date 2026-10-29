
# 🚀 Personal Productivity OS (PWA)

**Made with ❤️ for working more efficiently every single day.**

> A fully interactive, animated productivity system running as a native-like Progressive Web App (PWA), powered by Next.js and a cloud database.

<p align="center">
  <strong>Build your routine. Track your progress. Stay focused.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.7-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Cloud%20Database-Online%20Sync-003B57?logo=database" alt="Cloud Database" />
  <img src="https://img.shields.io/badge/Zustand-5-orange" alt="Zustand" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
</p>

---

## 🌟 Key Architecture Highlights & Challenges Solved

### 1. Atomic Updates Instead of Bulk JSON Writes

**Challenge:** Initially, the app serialized the entire Zustand state into one large JSON object and wrote it to the database on every change. This caused unnecessary database writes, increased latency, and higher cloud database costs.

**Solution:** Re-engineered the state synchronization engine to use **atomic updates**. Only discrete mutations, such as editing a single task, are queued and synced. This reduces unnecessary database writes and helps optimize API usage.

### 2. Queue-Based Offline-to-Online Synchronization

Built a custom local **queue data structure** to manage state changes.

- Mutations are queued locally when the internet connection is unavailable.
- Pending operations are synchronized when connectivity returns.
- Changes are processed in chronological order to help maintain consistency.
- The approach reduces unnecessary full-state synchronization.

### 3. Migration to a Fully Online PWA

Transitioned from a locally hosted Windows batch-script environment to a fully fledged Progressive Web App.

The application can be accessed through a supported browser and installed for a more native-like desktop or mobile experience.

---

## 📖 Table of Contents

1. [What Is This?](#-what-is-this)
2. [Tech Stack & Architecture](#️-tech-stack--architecture)
3. [Project Structure](#-project-structure)
4. [PWA Installation](#-pwa-installation)
5. [Features Deep Dive](#-features-deep-dive)
6. [OTA Updates](#-seamless-pwa-over-the-air-updates)
7. [Database Schema](#️-database-schema)
8. [API Endpoints](#-api-endpoints-reference)
9. [State Management & Atomic Sync](#-state-management--atomic-queue-sync)
10. [Wallpaper & Background System](#️-wallpaper--background-system)
11. [Known Quirks & Pro Tips](#-known-quirks--pro-tips)
12. [Roadmap](#️-roadmap--ideas)
13. [Contributing](#-contributing)
14. [Author](#-author)

---

## 🤔 What Is This?

Personal Productivity OS is a **fully interactive productivity system** that runs in a browser or as an installed desktop PWA.

It combines animated dashboard widgets, cloud synchronization, productivity analytics, scheduling, and gamification to help users organize their work and stay focused.

### Why Is This Technically Interesting?

- **☁️ Cloud Sync with Offline Reliability:** Data is stored in a cloud database, while a local mutation queue preserves pending changes when the network is unavailable.
- **🏆 Peer-to-Peer Gamification:** Anonymous global leaderboards and groups let users compare focused hours with friends.
- **🔥 GitHub-Style Productivity Heatmap:** Visualize daily focus activity and track productivity trends over time.
- **🖼️ Persistent Wallpaper Preferences:** Lock a preferred wallpaper so it remains selected instead of following the slideshow cycle.
- **🧠 Dynamic Scheduling:** Import AI-generated JSON schedules and roadmaps into an interactive dashboard.
- **📱 Installable PWA:** Use the application through a browser or install it for a standalone experience.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | Next.js 16 (App Router) | React frontend and server-side API routes |
| UI Library | React 19 | Interactive user interfaces |
| Language | TypeScript 5 | Type-safe application development |
| Styling | Tailwind CSS 4 | Utility-first styling and glassmorphism effects |
| State Management | Zustand 5 + `persist` | Lightweight global state management |
| Database ORM | Prisma 5 | Type-safe database queries and migrations |
| Database | Cloud PostgreSQL | Persistent storage, cross-device sync, and leaderboard data |
| Synchronization | Custom queue data structure | Atomic offline-to-online state synchronization |
| Application Runtime | Progressive Web App | Native-like desktop and mobile experience |

### Architecture Diagram

```text
┌─────────────────────────────────────────────────────┐
│                 PWA Client (Browser)                │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │          Next.js Frontend (React)             │  │
│  │                    ↕                          │  │
│  │             Zustand Store                     │  │
│  │                    ↕                          │  │
│  │        Local Mutation Queue (RAM/IDB)          │  │
│  │                    ↕                          │  │
│  │       Atomic Sync (Rate-Limited Requests)      │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        ↕
              Next.js API Routes
                        ↕
                   Prisma ORM
                        ↕
              Cloud PostgreSQL DB
```

---

## 📁 Project Structure

```text
productivedashboard/
├── app/
│   ├── page.tsx
│   └── api/
│       ├── sync/
│       │   └── route.ts
│       ├── heatmap/
│       │   └── route.ts
│       ├── leaderboard/
│       │   └── route.ts
│       ├── scheduler/
│       │   └── route.ts
│       └── wallpapers/
│           └── route.ts
├── components/
│   ├── VideoBackground.tsx
│   ├── BigClock.tsx
│   ├── FocusHeatmap.tsx
│   ├── Leaderboard.tsx
│   ├── MasterScheduler.tsx
│   ├── EmbeddedSyncWindow.tsx
│   └── Timer.tsx
├── store/
│   └── dashboardStore.ts
└── prisma/
    └── schema.prisma
```

### Important Files

| File | Responsibility |
|---|---|
| `app/page.tsx` | Main productivity dashboard and PWA page |
| `app/api/sync/route.ts` | Processes queued atomic updates |
| `app/api/heatmap/route.ts` | Provides daily, weekly, and monthly focus data |
| `app/api/leaderboard/route.ts` | Provides global and group rankings |
| `app/api/scheduler/route.ts` | Processes AI-generated JSON for the scheduler |
| `app/api/wallpapers/route.ts` | Manages wallpaper-related API functionality |
| `components/FocusHeatmap.tsx` | GitHub-style focus activity grid |
| `components/Leaderboard.tsx` | Anonymous rankings and group statistics |
| `components/MasterScheduler.tsx` | Roadmap and timetable visualization |
| `store/dashboardStore.ts` | Zustand global store and atomic synchronization logic |
| `prisma/schema.prisma` | Relational database schema |

---

## ⚡ PWA Installation

No terminal commands or batch scripts are required to install the deployed application.

1. Open the deployed application URL in a supported browser such as Chrome, Edge, Brave, or Safari.
2. Look for the **Install App** icon in the browser address bar, or use the browser's **Add to Home Screen** option where available.
3. Confirm the installation.
4. Launch the dashboard from your desktop, taskbar, or home screen.

The application can then open in a standalone window, providing a more focused experience without the usual browser interface.

> **Note:** Installation options and PWA capabilities vary by browser, operating system, and deployment configuration.

---

## 🎯 Features Deep Dive

### 🧠 AI Master Scheduler & Roadmaps

More than a static timetable, the scheduler helps organize learning plans and daily work blocks.

- **AI JSON Upload:** Paste a schedule or roadmap generated by ChatGPT or Claude into the dashboard.
- **Automatic Parsing:** Converts supported JSON into visual learning roadmaps and daily schedule blocks.
- **Time Analysis:** Tracks adherence to planned activities and provides analytical feedback on efficiency.

### 🔥 GitHub/LeetCode-Style Heatmap & Statistics

A visual history of your productivity.

- Tracks total focus minutes per day.
- Displays activity in a color-coded contribution heatmap.
- Supports daily, weekly, and monthly progress analysis.
- Helps visualize productivity trends, momentum, and consistency.

### 🏆 Peer-to-Peer Global & Group Leaderboards

Turn productivity into a multiplayer experience.

**Global Leaderboard**
- Ranks users using anonymous aliases.
- Compares focus activity and tracked hours.

**Groups & Friends**
- Create private or public peer-to-peer groups.
- Compare daily productivity with friends.
- Follow group activity and rankings.

### ⏱️ Focus Timer & Ahead-of-Time Deadlines

**Pomodoro Timer**
- Supports custom focus-session durations.
- Synchronizes timer-related state through the application’s state and queue system.
- Helps preserve supported state across refreshes.

**Ahead-of-Time Deadlines**
- Integrates approaching deadlines into the dashboard interface.
- Keeps important deadlines visible without relying entirely on disruptive popups or floating notifications.

### 📝 Embedded Note Sync & Task Manager

A unified workspace for organizing tasks, notes, and saved problems.

- View, edit, and organize saved problems such as DSA solutions.
- Manage notes in a file-based organization interface.
- Create tasks with a title and estimated duration.
- Start a focus timer directly from a task card.

### 🎥 Dynamic Video & Image Wallpapers

Customize the dashboard background with supported media formats:

- `.mp4`
- `.webm`
- `.jpg`
- `.webp`
- `.gif`

**Slideshow Mode**
- Automatically cycles through backgrounds at configurable intervals.

**Lock Wallpaper**
- Pins a selected wallpaper so it remains active.
- Synchronizes wallpaper preferences across devices.

### 🔄 Seamless PWA Over-the-Air Updates

As an online Progressive Web App, the application is designed to receive updates through service-worker-based mechanisms.

When a new deployment is available, the intended update flow is:

1. **Background Fetch:** The PWA downloads updated assets in the background.
2. **Notification:** The interface informs the user that a new version is ready.
3. **Instant Reload:** The user can refresh the application to load the latest version.

This avoids requiring users to download and install a new desktop package for every web deployment.

> Actual update behavior depends on the service worker implementation, caching strategy, and deployment configuration.

---

## 🗄️ Database Schema

### Atomic Architecture

To reduce the overhead of storing the entire application state as one large JSON object, the database architecture uses separate relational tables for individual types of data.

The following examples illustrate the key models.

### Task Model

Individual tasks can be stored and updated independently.

```prisma
model Task {
  id          String   @id @default(uuid())
  title       String
  isCompleted Boolean  @default(false)
  updatedAt   DateTime @updatedAt
}
```

### Focus Heatmap Model

Stores daily focus activity for the contribution heatmap.

```prisma
model FocusHeatmap {
  id           Int      @id @default(autoincrement())
  date         String   @unique // YYYY-MM-DD format
  focusMinutes Int      @default(0)
  commits      Int      @default(0)
}
```

### Leaderboard Model

Stores anonymous ranking data and optional group information.

```prisma
model LeaderboardEntry {
  id          String   @id @default(uuid())
  alias       String   @unique
  groupId     String?
  weeklyHours Float
  dailyStreak Int
}
```

> These are representative schema snippets from the project documentation, not necessarily the complete database schema.

---

## 🔌 API Endpoints Reference

The following endpoints are documented as part of the application architecture.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sync/mutate` | Accepts arrays of atomic queue operations or diffs |
| `GET` | `/api/sync/hydrate` | Fetches the current application state on initial load |
| `GET` | `/api/heatmap` | Fetches daily, weekly, and monthly activity data |
| `GET` | `/api/leaderboard` | Fetches global and group leaderboard rankings |
| `POST` | `/api/scheduler` | Processes AI-generated JSON for the Master Scheduler |
| `GET` | `/api/wallpapers` | Lists available wallpaper files |
| `GET` | `/api/media?file=x` | Streams media with HTTP range-request support |

### API Design Notes

- Synchronization endpoints are designed to use rate limiting to reduce unnecessary requests and prevent API abuse.
- Atomic mutations help avoid sending the entire application state for every small change.
- The media endpoint supports HTTP range requests for browser video playback and seeking.

> Endpoint behavior and availability depend on the current deployed implementation.

---

## 🧠 State Management & Atomic Queue Sync

Reliable synchronization is essential when a productivity dashboard must work across devices and during network interruptions.

### 1. Atomic Diffing

Instead of sending the complete state after every change, the application records individual mutations.

For example:

```json
{
  "action": "UPDATE_TASK",
  "id": "123",
  "completed": true
}
```

This illustrates the concept of an atomic task update.

### 2. Queue System

Mutations are pushed into a local queue data structure instead of immediately requiring a full-state database write.

### 3. Offline-to-Online Synchronization

The queue attempts to send pending mutations to the synchronization endpoint.

When the user is offline:

- Mutations remain queued locally.
- The application can continue working with locally available state.
- Pending changes wait for connectivity to return.

When the connection is restored:

- The queue attempts to synchronize pending operations.
- Operations are processed in chronological order.
- The server applies the supported updates to the cloud database.

### Benefits

- Reduces unnecessary full-state writes.
- Helps lower database write overhead.
- Supports offline usage.
- Improves synchronization efficiency.
- Helps maintain consistent application state across devices.

> Reliable delivery and conflict prevention depend on implementation details such as retry handling, idempotency, transaction boundaries, and conflict resolution.

---

## 🖼️ Wallpaper & Background System

The background system supports images, animated images, and video wallpapers.

Media files are served through a custom `/api/media` streaming route.

### HTTP Range Request Support

The media endpoint supports HTTP range requests, including `206 Partial Content` responses, which are useful for browser video playback, seeking, and looping.

This allows the browser to request portions of a media file instead of always downloading the entire file at once.

### Wallpaper Behavior

- Supports multiple image and video formats.
- Offers slideshow mode with configurable intervals.
- Allows users to lock a selected wallpaper.
- Stores wallpaper preferences for synchronization across devices.

---

## 🕵️ Known Quirks & Pro Tips

### 🎥 Video Wallpaper Autoplay

Modern browsers restrict autoplay with audio until the user interacts with the page.

The intended behavior is:

1. The video wallpaper starts muted when the dashboard loads.
2. The application restores the user's preferred volume after the first interaction, subject to browser autoplay policies.

### 📱 PWA Installation

For the best desktop experience:

1. Open the application in a supported browser.
2. Click the **Install App** icon in the address bar when available.
3. Launch the installed application in its standalone window.

This can provide a distraction-free experience without the regular browser interface.

---

## 🗺️ Roadmap / Ideas

### ✅ Implemented Features

- [x] Queue-based offline-to-online cloud synchronization
- [x] Atomic database updates to reduce unnecessary writes
- [x] Peer-to-peer leaderboards and anonymous aliases
- [x] LeetCode/GitHub-style focus heatmap
- [x] AI JSON Master Scheduler integration
- [x] Migration to a fully online PWA architecture

### 🚧 Planned Features

- [ ] **AI Voice Assistant** — Gemini-powered voice interface with an avatar overlay
- [ ] **Spotify / Music Widget** — Currently playing song integration
- [ ] **Weather Widget** — Real-time local weather
- [ ] **Mobile Companion App** — Native mobile access to productivity statistics and heatmaps

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!

### How to Contribute

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and test them.
4. Commit and push your branch.
5. Open a Pull Request describing your changes.

Please include clear reproduction steps when reporting bugs and explain the purpose of proposed changes.

---

## 👨‍💻 Author

**Gonaboyina Anand Kumar**

This project evolved from a locally hosted desktop productivity dashboard into a cloud-synchronized Progressive Web App.

A major engineering focus was redesigning state synchronization around an **Atomic Update Queue** to reduce unnecessary database writes while supporting offline-to-online synchronization.

The application also combines dynamic scheduling, productivity analytics, anonymous peer-to-peer leaderboards, and customizable wallpapers to make focused work more organized and measurable.

- **GitHub:** [@anandgonaboyina](https://github.com/anandgonaboyina)
- **Telegram:** Available via the dashboard navbar
- **Support via UPI:** `gonaboyinaanandkumar@ybl`

---

<p align="center">
  <em>"The secret of getting ahead is getting started."</em>
  <br />
  — Mark Twain
</p>

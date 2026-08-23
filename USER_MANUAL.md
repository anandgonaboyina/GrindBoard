# Grind Board — User Manual

## 0. Introduction

**What is this app?**
Grind Board is a personal productivity web app that works on both desktop and mobile (installable as a PWA — Progressive Web App). It combines a focus timer, stopwatch, weekly timetable, task manager, roadmap planner, rich-text notes, daily routine times, leaderboard, friends system, calendar with deadlines, countdown widgets, wallpaper system, and live quotes — all synced to the cloud so your data follows you everywhere.

### Core Features
- **Unified Workspace**: Eliminate distractions with a clean, centralized hub.
- **Smart Timetable**: Take absolute control of your schedule with a precision interactive timetable.
- **Task Management**: Never miss a deadline with intuitive drag-and-drop to-do lists.
- **Global Leaderboard**: Turn productivity into a game and climb the global ranks.
- **Focus Widgets**: Customize your space with sticky notes, weather updates, and goals.
- **Cloud Sync**: Your data follows you seamlessly across all your devices in real-time.

---

## 0. Installing the App on Your Device

This app is a **PWA (Progressive Web App)** — it installs like a native app directly from your browser. No app store needed.

### On Mobile (Android — Chrome)
1. Open the app URL in **Chrome**.
2. Tap the **three-dot menu (⋮)** at the top-right corner of Chrome.
3. Tap **"Add to Home screen"** or **"Install app"**.
4. A prompt appears — tap **"Install"** or **"Add"**.
5. The app icon appears on your home screen. Tap it to open the app in full-screen, just like a native app — no browser bar visible.

### On Mobile (iOS — Safari)
1. Open the app URL in **Safari** (must be Safari, not Chrome, on iPhone).
2. Tap the **Share button** (box with arrow pointing up) at the bottom of the screen.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top-right.
5. The icon appears on your home screen.

### On Desktop (Chrome / Edge)
1. Open the app URL in **Chrome** or **Edge**.
2. Look for the **install icon** (computer screen with a down-arrow) in the browser's address bar on the right side.
3. Click it → click **"Install"** in the popup.
4. The app opens in its own window (no browser tabs, no address bar) — feels like a desktop app.
5. It also appears in your Start Menu / taskbar like any other installed app.

> **Tip:** If you don't see the install icon in the address bar, try the three-dot menu (⋮) at the top-right → look for **"Install Grind Board"** or **"Cast, save, and share → Install page as app"**.

---

## Using the App Offline & Sync Behaviour

The app is designed to keep working even when your internet connection drops.

### What works without internet
- The **Focus Timer & Stopwatch** run entirely on-device. They will not stop, pause, or lose time if you go offline.
- **Tasks, Notes, Timetable, Roadmap, Countdowns** — you can view and edit all of them. Changes are saved locally in your browser instantly.
- **Daily Routine logs, Stats** — readable and writable offline.

### What requires internet
- **Logging in / registering** — needs internet for the OTP and authentication.
- **Leaderboard, Friends, Broadcasts** — these pull live data from the server.
- **Cloud Sync (saving to cloud)** — write operations are queued and pushed when internet returns.

### How sync works
Your data is saved to your browser first (instant, always works), and then pushed to the cloud server in the background.

- If you edit something while offline, it is stored locally.
- When internet reconnects, the app automatically detects this and pushes the pending data to the cloud.
- **You will not lose data** by going offline mid-session.

> **Important:** Data lives in your browser's local storage AND the cloud. Logging in on any device restores your data from the cloud.

---

## 1. First Launch — Login / Register Screen

When you open the app for the first time, you will land on the **Login screen**, not the dashboard. You must create an account or log in before anything else is accessible.

### Registering a New Account
1. Click **"Need an account? Register"** on the login screen.
2. Fill in: **Email**, **Username**, **Password**.
3. Submit — a **6-digit OTP** is sent to your email (check spam if not visible).
4. Enter the OTP on the next screen to verify your email.

> **If the app gets stuck on a "Syncing..." or loading screen after registration:**
> Simply **close the browser tab / app window completely and reopen it**. Then log in normally with your username and password. Your account is already created — do not register again.

### Logging In
- Enter your **Username or Email** + **Password** → Login.

### Forgot Password
1. Click "Forgot Password?" on the login screen.
2. Enter your registered email → an OTP is sent.
3. Enter the OTP + your new password → done. Then log in.

---

## 2. The Dashboard Layout

After login, you see the main dashboard — a full-screen wallpaper with floating widgets.

- **Bottom Dock** — quick-launch buttons for Timer, Tasks, Notes, Roadmap, Stats, Calendar, Timetable, etc.
- **Right Toolbar** — Stopwatch, Settings, Daily Routine, and secondary toggle icons.
- **Draggable Widgets** — Clock, Calendar, Timer, Stopwatch, Countdowns, Tasks. Drag them anywhere on the screen.
- **Settings (⚙️)** — accessed via the dock or toolbar; contains all configuration panels.

The loading screen that appears on startup shows your profile picture and intro text while data is syncing. If syncing takes longer than expected, it automatically switches to **Motivator Mode** — showing a random motivational quote and a feature carousel while data loads.

---

## 3. Account & Cloud Sync (Connect Tab)

Go to **Settings → Connect & Ranks** after login.

Inside the Connect tab there are four sub-tabs: **Profile**, **Friends**, **News**, **Ranks**.

### Profile Tab
- Displays your username and a green **Sync Active** badge when cloud sync is working.
- **Avatar:** Paste any public image URL (e.g. from imgur) → Save. The image updates everywhere including the loading screen.
- **Alias:** Unlock with your password → set a nickname shown on the leaderboard instead of your real username.
- **Sign Out** and **Delete Account** are both here. Delete requires unlocking first.

> ⚠️ **90-Day Inactivity Warning:** Accounts with no logins for 90 days are **permanently deleted** along with all data. Export your backup regularly via **Settings → Data & Backup**.

---

## 4. Focus Timer

The **Focus Timer widget** sits on the main dashboard and is freely draggable (can be locked in place or reset via Settings → Preferences).

### Starting the Timer

| Method | How |
|---|---|
| Quick preset | Click **5m**, **15m**, or **25m** button |
| Custom minutes | Type a number in the "Custom mins..." box → press **Set** or Enter |
| Click the display | When idle (showing `00:00`), click the big digits to open the editor and set hours:minutes manually |

### Display Clock Time Toggle
Click the small **Clock (🕑)** icon to toggle the timer display to show the estimated completion time (e.g. "Ends at 2:15 PM") instead of countdown digits. Click it again to switch back.

### Interval Beep Alert
Click the **🔔 Interval** bell icon to enable a recurring alert during your session.
- Set your alert frequency (e.g., every 5 or 10 minutes).
- The timer rings a short beep each time that interval elapses.
- Customize alert sound & ring duration under **Settings → Sound Settings**.

### 2-Hour Idle Protection
To prevent continuous unattended timer runs, the app includes automatic idle monitoring: **If the timer runs for 2 continuous hours without interaction, it pauses automatically and rings the alarm.**
A prompt will ask **"Are you still working?"** with **Continue** or **Stop** options. Clicking Continue resumes the session right where it paused (works even if the browser was closed).

### Controls while running
- **▶ / ⏸** — Start or Pause
- **⏹** — Stop/Reset — saves any completed focus minutes to history before resetting

### Auto-Save & Offline Protection
Focus time is logged in **5-minute completed chunks** to ensure quality focus. The timer auto-saves progress every 10 minutes locally and pushes to the cloud when online.

### Linking Timer to a Task
From the **Tasks** panel, click the play (**▶**) button next to any task. The Focus Timer launches with that task's title attached, logging focus time directly for that specific task.

---

## 5. Stats (Focus History)

Open via the **📊 Stats** button on the dock/toolbar.

**Left panel:**
- **Today's Focus** — minutes logged today
- **All Time** — total ever logged
- **7-Day Avg / 30-Day Avg** — daily averages for recent periods
- **Days Logged** — number of days you've used the timer

**Right panel — Monthly Breakdown:**
- Lists all months, sorted newest first.
- Click any month row to expand it → shows individual day entries.
- Each day entry also shows your **Wake Time and Bed Time** if you logged Daily Routine data that day.

You can also click any **friend's 📊 Stats icon** in the Friends tab to view their breakdown in the same panel.

---

## 6. Tasks & Task Manager (Plan Your Day)

Open from the dock. A comprehensive task planner organized by Customizable Tabs, Drag-and-Drop Handles, and Cloud Groups.

### Task Tabs
- Categorize tasks into customizable **Tabs** at the top (e.g., Work, Personal, Urgent).
- **Double-click** any tab name to rename it.
- Click the move arrow on a task to transfer it between tabs.

### Drag & Drop Reordering
- Click and drag the **grip handle (⋮⋮)** on the left edge of any task to reorder tasks instantly within the current tab view.

### Cloud Groups Integration
- Click the settings (**⚙️**) icon in Task Manager to switch between your **Personal** workspace and any **Cloud Group**.
- Group tasks sync in real-time — all group members can view task progress, remaining time, and completions.
- The total time left updates dynamically for the selected group.

### Managing Tasks & Manual Time Editing
- **Add Task:** Click the **+** button. Enter title, due date, and duration.
- **Edit Task Title:** Double-click any task title to edit inline.
- **Edit Time Left ("m left"):** Double-click the remaining duration badge to update planned time.
- **Edit Time Done ("m done"):** Double-click the done badge to log completed minutes manually (automatically deducts from time left).
- **Task Timer:** Click the play (**▶**) button next to any task to launch the Focus Timer for that task.

### Task Interval Beep Alert
- Click the bell (**🔔**) icon at the top of Task Manager to enable recurring interval beeps specifically while tracking task timers.

---

## 7. Calendar & Deadlines

The **Mini Calendar** is a draggable widget on the dashboard. Open it from the dock if it is not visible.

### Adding a Deadline to a Date
1. Click any **date** on the calendar grid.
2. The view switches to that day's deadline list.
3. Click **"+ ADD DEADLINE"** at the bottom.
4. Type the deadline name/note → press **Enter** or click away to save.
5. To edit a saved deadline: **double-click** the text.
6. To delete: click the 🗑️ trash icon next to it.

Dates with deadlines show a **red dot** on the calendar. If a deadline falls on today, the dot pulses.

### View All Deadlines
Click **"VIEW ALL DEADLINES"** at the bottom of the calendar widget to see a sorted list of every deadline across all dates.

### Deadline Alert Notifications
Go to **Settings → Preferences → Deadline Alerts**.

Set the number of days in advance you want an alert popup. Example: set to **3** — if a deadline is in 3 days or less, a warning banner appears automatically on the dashboard each time you open the app.

---

## 8. Timetable

A weekly schedule grid. Open from the dock or toolbar.

### Basic use
- **Weekdays / Weekends** — toggle using the `‹ ›` arrows on either side of the title.
- Today's column is highlighted in purple automatically.
- Click any cell → type the subject or activity (e.g. "Maths", "Gym") → press Tab or click away to save.
- If you type the **exact same text** in back-to-back rows of the same day, those cells visually merge into one block automatically.

### How the time column works
The time column on the left is **fully automatic** — you never type times manually. It works like this:

1. You set a **Day Start Time** (e.g. 8:00 AM).
2. Each row has a **duration** (e.g. 60 min).
3. The app calculates every slot's start and end time by adding durations top-to-bottom from your start time.

> **Example:** Start = 8:00 AM. Row 1 = 60 min → shows `8:00AM – 9:00AM`. Row 2 = 90 min → shows `9:00AM – 10:30AM`. Row 3 = 60 min → shows `10:30AM – 11:30AM`. You only needed to set durations; the times adjust automatically.

**This means:** If you change any row's duration, all rows below it shift their times automatically.

### Setting the Day Start Time
Click the small **"Day Starts: 9:00 AM"** button just below the title. A time picker appears → choose your time → Save.

- This is saved separately for **Weekdays** and **Weekends**.

### Changing a slot's duration
Click any **time cell** in the left column:
- A small editor pops up on that cell.
- Use **▲ +15** / **▼ -15** to adjust in 15-minute steps, or type a number directly (in minutes).
- Press ✓ or Enter to confirm.
- All subsequent row times update automatically.

### Adding / Removing rows
Click the **⚙️** settings icon next to the schedule title:

| Option | What it does |
|---|---|
| Add Top Row | Adds a new slot before row 1 |
| Add Bottom Row | Adds a new slot at the end |
| Delete Top Row | Removes row 1 |
| Delete Bottom Row | Removes the last row |
| Reset Timetable | Resets to a default weekday + weekend schedule |

---

## 9. Focus Mode & Panic Mode

### Desktop — Keyboard Shortcuts
Configure shortcuts in **Settings → Focus / Panic Mode**.

| Mode | What it does |
|---|---|
| **Focus Mode** | Hides the widgets you selected in the "Focus Specific Setup" section. Press again to restore. |
| **Panic Mode** | Instantly hides ALL widgets. Press again to restore. |

- Click the shortcut input box → press your desired key combo (e.g. `Ctrl + H`) → it saves automatically.
- You can also click **"Trigger"** button to test it manually.
- **Switch Wallpaper on Panic** — toggle ON if you want the wallpaper to also change when Panic is triggered.

### Mobile — Eye Icon Panic
On mobile, there is no keyboard. Instead:

- Look for the **👁️ Eye icon** on the right side of the screen.
- Tap it to trigger the Panic action instantly.

**Panic Action has two modes** (set in Settings → Focus / Panic Mode → Panic Action):

| Mode | What happens |
|---|---|
| **Redirect** | The browser immediately navigates to a random/neutral website, making the dashboard completely invisible to anyone looking. To return: press **Back** in the browser — the dashboard reloads and your session is still active. |
| **Hide UI** | All widgets disappear and the screen goes transparent/blank. Tap the eye icon again to bring everything back. |

---

## 10. Friends & Groups

**Settings → Connect & Ranks → Friends tab / Groups tab** (requires login).

### Groups (Collaborative Work)
- **Create Groups:** Create up to 3 cloud-synced groups. You can set them as Public or Private, and toggle whether they accept Join Requests.
- **Task Sharing:** Groups share a common Task Manager. When you switch to a Group in your Task Manager, any tasks completed or time spent is synced to the group.
- **Member Progress:** Peek into groups to see member completion rates and time remaining for shared tasks.
- **Join Requests:** You can request to join private groups (unless the admin disables requests), or instantly join public groups.
- **Admin Controls:** Admins can grant Edit Rights to specific members, remove members, or delete the group.

### Adding a Friend
1. Use the **search bar** to find users by username.
2. Click **Send Request** next to their name.
3. They will see a pending request badge on their Friends tab.

### Accepting / Rejecting Requests
- A red number badge on the Friends tab shows pending incoming requests.
- Tap the request to **Accept ✓** or **Reject ✗**.

### Viewing Friend Stats & Timetables
- In your friends list, click the **📊 Stats** icon next to a friend's name to view their focus history.
- Click the **📅 TimeTable** icon next to a friend to instantly load their weekly schedule into your Timetable view (read-only).
- Click **"My Stats"** button to switch back to your own stats in the same view.

### Friend Request Notifications
When someone sends you a friend request, a **Friend Request popup notification** will appear automatically on your dashboard — so you never miss a request even if Settings is closed.

### Removing a Friend
Click the 🗑️ trash icon next to any friend → confirm.

---

## 11. Leaderboard

**Settings → Connect & Ranks → Ranks tab** (requires login).

### How the Leaderboard Works
- The leaderboard tracks your total accumulated focus time via the Timer.
- It ranks all users by focus time for **Today / This Week / This Month** — toggle at the top.
- Your own row is highlighted in the list.
- Your **alias** is shown if you set one; otherwise your username is shown.
- Use the search bar to find a specific user.
- Click any user row to expand and see their stats breakdown (including **Daily Avg: This Week** and **Daily Avg: Last Week**).

### Daily Streaks & Daily Routine Times
- **🔥 Streaks**: You earn a streak day by accumulating at least 60 minutes of focus time. Miss a day, and your current streak resets. Your active streak and all-time Max Streak are visible to everyone.
- **⏱️ Routine**: If you use the Daily Routine widget, your Wake, Work, and Last Active times are also visible on your leaderboard card.

### Badges & Achievements
As you accumulate focused work hours, you can earn dynamic badges that appear next to your name on the leaderboard. Badges are awarded automatically to the top user who meets the strict minimum requirements:
- **Daily Badge (🏆)**: Requires a minimum of **6 hours** of focus time in a single day.
- **Weekly Badge (🌟)**: Requires a minimum of **42 hours** of focus time over the last 7 days.
- **Monthly Badge (👑)**: Requires a minimum of **180 hours** of focus time over the last 30 days.

*Note: Badges are incrementable! If you win the daily top spot with 6+ hours multiple times, your badge count will increase (e.g., "🏆 2 Day").*

> Set your alias in **Settings → Connect → Profile → Security & Alias** (requires password unlock) to appear anonymously on the leaderboard.

---

## 12. Roadmap Manager (Plans)

Open from the dock. A powerful, visual roadmap builder for long-term goals and projects.

### Structure — Roadmaps and Topics
- You can have **multiple roadmaps** (e.g. "Semester Goals", "Career Path", "Personal Projects"). Switch between them using the **roadmap name button** at the top of the view.
- Each roadmap is a **tree of topics** — each topic can have subtopics nested up to 4 levels deep.
- On **desktop**, topics alternate left and right along a central timeline. On **mobile**, topics stack in a left-aligned list.

### Adding Topics
1. Click **"Add Main Topic"** at the bottom of the roadmap view to add a root-level topic.
2. Click the **⋮** menu on any existing topic → **➕ Subtopic** to add a nested child topic (up to 4 levels).
3. A new topic is created with the name "New Topic" — click it to open the **Edit Topic** modal.

### Editing a Topic
Click any **leaf topic** (one with no children) directly, or click the **⋮ → Edit** on any topic. Inside the editor:
- **Title** — the topic name.
- **Description (Optional)** — additional notes below the title.
- Click **Save** to confirm.

### Topic Statuses
Each topic has a status you can cycle through by clicking the **status button** (circle icon on the right of the topic card):

| Icon | Status | Card Border Color |
|---|---|---|
| ⚪ | Pending | White/dim |
| 🔵 | In Progress | Blue glow |
| ✅ | Completed | Green |

Completed topics show the title with a strikethrough.

### Filtering by Status
Use the **legend bar** at the top (⚪ Pending / 🔵 In Progress / ✅ Completed) to filter the entire view to show only topics of that status across **all roadmaps** — this is called the **Synthetic View**. Click the active filter again to clear it.

### Roadmap Deadline
Click the **"Set Deadline"** badge at the top of the roadmap tree to set a target completion date. It shows how many days are left. In the Synthetic (filtered) view, you can also set per-status deadlines.

### Managing Roadmaps
- **Create a new roadmap:** Click the roadmap name at the top → **"+ Create Roadmap"** in the switcher popup.
- **Switch roadmaps:** Click the roadmap name at the top → click any roadmap in the list.
- **Delete a roadmap:** Scroll to the bottom of the roadmap view → click **"Delete Entire Roadmap"** (you must type DELETE to confirm).

### Deleting a Topic
Click **⋮** on any topic → **✕ Delete** → type "DELETE" to confirm. This also removes all of that topic's subtopics.

---

## 13. Quick Notes

Open from the dock. A rich-text, multi-note writing space.

### Managing Notes
- **Create a note:** Click the **+** button in the top-right of the Notes sidebar.
- **Switch notes:** Click any note title in the left sidebar (or top list on mobile).
- **Rename a note:** Click the note title text at the top of the editor area and type to rename.
- **Delete a note:** Click the 🗑️ trash icon next to any note in the sidebar (only visible when you have more than one note).

### The Editor
- Notes are **date-sectioned** — each day you write, a new date heading appears automatically. Your existing entries for previous days are preserved and visible below.
- The editor supports full **rich text** formatting:

| Button | Action |
|---|---|
| H1 | Large heading |
| H2 | Medium heading |
| P | Normal paragraph text |
| **B** | Bold |
| *I* | Italic |
| U | Underline |
| ☰ | Bullet list |
| ↩ Undo / ↪ Redo | Undo or redo last change |

- The **floating formatting toolbar** appears at the bottom of the editor — scroll it horizontally on small screens.
- Notes **auto-save** 30 seconds after you stop typing, and immediately when you close the Notes modal.

### Exporting Notes
- **Export a single note:** Click the ⬇️ download icon next to any note in the sidebar — saves as a `.json` file.
- **Export all notes:** Click the ⬇️ export icon in the top-right header of the Notes panel — exports all notes at once.

---

## 14. Daily Routine

Open via the Morning/Night icon on the right toolbar or dashboard.

Log your daily routine schedule alongside your focus sessions:

| Field | What it means |
|---|---|
| **Wake Up Time** | When you woke up today. Once logged, this is permanent for the day. |
| **Start Work Time** | When you began your first focus block. Once logged, this is permanent. |
| **Last Active** | Automatically logged based on your last active time tracking session (e.g. Focus Timer stops). Requires no manual interaction. |

These appear in the **Monthly Breakdown in Stats** alongside your Focus Timer data and also on your **Leaderboard User Card**, letting you and your friends see your daily schedule.

---

## 15. Stopwatch

The **Stopwatch** is a dedicated timing tool for tracking open-ended sessions.

### Widget Positioning & Drag Controls
- Accessible via the **Stopwatch icon** on the right toolbar or dock.
- When visible on the dashboard, it is a **draggable widget** — click and drag its header to position it anywhere. Lock or reset positions via **Settings → Preferences**.

### Controls
- **Start / Pause** — start or pause elapsed timing.
- **Lap** — records the current elapsed time as a split lap point while continuing to run.
- **Reset** — clears the current session.

### Interval Beep Support
- Supports recurring interval alert beeps during active timing (configured in **Settings → Sound**).

### 2-Hour Idle Protection
Just like the Focus Timer, if the Stopwatch runs for **2 continuous hours** without interaction, it automatically pauses, plays your alarm sound, and shows the **"Are you still working?"** prompt. Clicking **Continue** resumes timing immediately.

---

## 16. Countdowns

A widget showing a list of upcoming target events with day countdowns.

### Mobile & Drag Access
- Access or toggle the Countdowns widget by **swiping left or right on the top Focus Pill** of the screen.
- Swipe **UP** directly on the widget to quickly dismiss/hide it.

### Features
- **Add Event:** Click **+** in the Countdowns widget → enter event name and target date.
- Displays **"X days left"** for each event.
- Events within your **Deadline Alert Days** threshold trigger dashboard warning popups.
- Use the **chevron (▲/▼)** button at the bottom of the widget to expand/collapse the full event list.

---

## 17. Wallpapers

**Settings → Wallpapers**

### Choosing a Wallpaper
- Pick from **built-in wallpapers** — a curated set of images and animated video backgrounds.
- Click a wallpaper thumbnail to make it active immediately.

### Custom Wallpapers via URL
- Add up to **4 custom wallpapers for Desktop** and **4 for Mobile** by pasting an image URL.
- The app stores separate wallpaper sets for desktop and mobile — so your phone gets an appropriately sized background.

### Slideshow Mode
- Toggle **Slideshow** on to have the wallpaper auto-cycle through your active wallpapers.
- Set the **interval in minutes** — e.g. 30 minutes to switch wallpaper every half hour.

### Locking & Hiding Wallpapers
| Option | What it does |
|---|---|
| **Lock** | Slideshow skips this wallpaper — it stays as the permanent background until unlocked |
| **Hide** | Removes the wallpaper from slideshow rotation without deleting it |

### 🖥️ Set as Windows Live Desktop Wallpaper
You can run Grind Board directly as your interactive Windows desktop background instead of using it in a browser window!

1. Download and install Lively Wallpaper:
   - **[Direct Download (Google Drive)](https://drive.google.com/file/d/1TJWAWPTtTbKNMaNVAwz2GwbSb04NO-J5/view?usp=drivesdk)** (Recommended)
   - **[Official Source](https://rocksdanister.github.io/lively/)** (Alternative)
2. Open Lively Wallpaper and click **"Add Wallpaper"** (the + icon).
3. Under **"Enter URL"**, type the live URL of the Grind Board app `https://wallpaper-dashboard-cloud.vercel.app/` and press **→**.
4. Lively will load the webpage as your desktop background! You can click and interact with all the widgets directly on your desktop.
5. **Enable Auto Start:**
   - Open Lively Wallpaper Settings (⚙️) → **General** → Toggle **"Start with Windows"** ON.
   - Open Windows **Task Manager** (Ctrl+Shift+Esc) → Go to the **Startup Apps** tab → Right-click on **Lively Wallpaper** and select **Enable**.

---

## 18. Widget Settings & Preferences

**Settings → Preferences**

### Widget Visibility
Toggle any widget on or off. Hidden widgets do not appear on the dashboard at all.

Available toggles: Timer, Clock (with Today's Work), Calendar, Tasks, Notes, Timetable, Daily Routine, Stats, Plans (Roadmap), Stopwatch, Countdowns, Dock, Deadline Alerts, Settings Button.

### Widget Drag Locking & Position Reset
- **Drag Unlock/Lock:** When unlocked, all dashboard widgets (Timer, Stopwatch, Clock, Calendar, Countdowns, Tasks) can be freely repositioned by dragging.
- Toggle the **Lock** switch on any specific widget to freeze it in place.
- **Reset Default Positions:** Click this button to snap all draggable widgets back to their original default layout locations.

### Display Options
- **24-Hour Clock:** Toggle between 12h AM/PM and 24h military format for the Big Clock.
- **Deadline Alert Days:** Configure how many days in advance deadline warning banners appear on the dashboard.

---

## 19. Sound Settings

**Settings → Sound Settings**

| Setting | Description |
|---|---|
| **Enable Alarm Sound** | Plays audio when the Focus Timer ends, Stopwatch interval triggers, or when 2-hour idle protection prompts appear. |
| **Enable Device Vibrate** | Vibrates mobile devices when alarms or idle prompts fire. |
| **Auto Stop Timer** | Slider (5 seconds to 2 minutes) controlling how long alarms ring before silencing automatically. |
| **Task Interval Alert** | Configure interval frequency (in minutes) and ring duration for Task Manager focus timers. |
| **Select Alarm Sound** | Pick from curated ringtones. |

---

## 20. Data & Backup

**Settings → Data & Backup**

### Real-Time Cloud Synchronization
Your data (tasks, focus history, timetable, daily routines, roadmap, notes, and preferences) is automatically synced to the cloud in real-time when logged in. Logging in on any device restores your account state.

### Backup & Management
- **Export Data:** Downloads a complete `.json` backup file of all your account data.
- **Import Data:** Upload a `.json` backup file:
  - **Merge:** Safely combines the backup file with your existing data without losing anything.
  - **Overwrite:** Replaces your current dashboard data completely with the imported file.
- **Reset Timetable:** Resets your weekly schedule grid and slot colors back to default.
- **Clear Old Data:** Deletes focus history entries older than chosen days (30, 60, 90 days) to optimize load speed.
- **Factory Reset Profile:** Permanently wipes all local and cloud data (requires typing *delete all* to confirm).

---

## 21. Feedback & Developer Support

**Settings → About Dev**

Have suggestions, feedback, or found a bug? You can contact the developer directly:

- **💼 LinkedIn:** Go to **Settings → About Dev** and click the **LinkedIn** button ("Message me") to open the developer profile and send a direct message with your bug report or feedback text.
- **💬 Telegram:** Message `@gAnandKumar` on Telegram for direct support.
- **🌐 Portfolio:** View other projects by the developer directly from the About Dev panel.

---

## 22. Hidden Widget Drag & Gesture Controls

Control widgets effortlessly using swipe and drag gestures:

- **Countdowns:** Swipe left/right on the widget to switch countdown events. Swipe **UP** directly on the widget to close it. Swipe left or right on the top Focus Pill to open/close Countdowns.
- **Calendar:** Swipe near the top-left edge of the screen to quickly toggle Calendar visibility.
- **Task Manager:** Swipe near the top-right edge of the screen to toggle Task Manager visibility.
- **Task Reordering:** Drag the grip handle (⋮⋮) on the left of any task to reorder tasks in the active tab.
- **Widget Dragging:** Drag any widget by its top header to reposition it on the screen (lock/unlock in Settings → Preferences).
- **Settings & Menus:** Drag or swipe to navigate or dismiss the Settings panel.
- **Right Toolbar:** Hides at screen edge — hover/click edge to expand, or swipe right to hide.

---

## Quick Reference

| What you want to do | Where |
|---|---|
| Start focus timer | Timer widget on dashboard |
| See your focus logs | 📊 Stats button on dock |
| Set weekly schedule | Timetable (dock) |
| Add a deadline to a date | Click date on Calendar widget |
| Plan long-term goals | Plans / Roadmap (dock) |
| Manage & drag reorder tasks | Task Manager (dock) — drag grip handle (⋮⋮) to reorder |
| Switch task tabs / groups | Task Manager header / settings (⚙️) |
| Log daily routine times | Morning/Night icon on toolbar/dashboard |
| Time an open-ended activity | Stopwatch (right toolbar / widget) |
| Add a countdown event | + button in Countdowns widget |
| Check leaderboard & averages | Settings → Connect & Ranks → Ranks tab |
| Backup your data (.json) | Settings → Data & Backup → Export |
| Import backup (Merge / Overwrite) | Settings → Data & Backup → Import |
| Factory Reset profile | Settings → Data & Backup → Factory Reset |
| Change wallpaper / slideshow | Settings → Wallpapers |
| Drag lock & reset widget positions | Settings → Preferences → Widget Drag Locking |
| Submit bug / feedback to dev | Settings → About Dev → Click LinkedIn |
| Mobile Panic button | Tap 👁️ Eye icon on right side of screen |
| Set alias for leaderboard | Settings → Connect & Ranks → Profile → Alias |

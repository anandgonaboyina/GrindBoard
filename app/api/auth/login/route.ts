import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function POST(request: Request) {
  try {
    const { username, password, isDemo } = await request.json();

    if (isDemo) {
      const demoUser = process.env.DEMO_USERNAME;
      const demoPass = process.env.DEMO_PASSWORD;
      
      const client = await clientPromise;
      const db = client.db();
      const user = await db.collection('User').findOne({ username: demoUser });

      if (!user) {
         return NextResponse.json({ error: 'Demo user not found in database' }, { status: 404 });
      }
      
      if (!demoPass) {
        return NextResponse.json({ error: 'Demo credentials not configured' }, { status: 500 });
      }

      const isMatch = await bcrypt.compare(demoPass, user.password);
      if (!isMatch) {
         return NextResponse.json({ error: 'Invalid demo credentials' }, { status: 401 });
      }

      const todayDate = new Date();
      const tomorrowDate = new Date(); tomorrowDate.setDate(todayDate.getDate() + 1);
      const dayAfterDate = new Date(); dayAfterDate.setDate(todayDate.getDate() + 2);
      
      const demoDeadlines = [
        { id: 'demo-deadline-1', text: 'Project Submission', date: todayDate.toISOString().split('T')[0], isPinned: true },
        { id: 'demo-deadline-2', text: 'Team Sync Meeting', date: todayDate.toISOString().split('T')[0], isPinned: true },
        { id: 'demo-deadline-3', text: 'Code Review', date: tomorrowDate.toISOString().split('T')[0], isPinned: true },
        { id: 'demo-deadline-4', text: 'Client Presentation', date: dayAfterDate.toISOString().split('T')[0], isPinned: true }
      ];

      const nextWeekDate = new Date(todayDate); nextWeekDate.setDate(todayDate.getDate() + 7);
      const nextMonthDate = new Date(todayDate); nextMonthDate.setDate(todayDate.getDate() + 30);
      
      const demoCountdowns = [
        { id: 'demo-countdown-1', title: 'Product Launch', endDate: nextWeekDate.toISOString() },
        { id: 'demo-countdown-2', title: 'Vacation', endDate: nextMonthDate.toISOString() }
      ];

      const demoTasks = [
        { id: 'demo-task-1', title: 'Review pull requests', completed: false, duration:120, timeSpent: 30, groupId: 0, createdAt: Date.now() },
        { id: 'demo-task-2', title: 'Update project documentation', completed: false, duration:50, timeSpent: 20, groupId: 0, createdAt: Date.now() },
        { id: 'demo-task-3', title: 'Prepare presentation slides for weekly sync', completed: true, duration:120, timeSpent: 120, groupId: 1, createdAt: Date.now() },
        { id: 'demo-task-4', title: 'Reply to high-priority emails', completed: false, duration:150, timeSpent: 80, groupId: 1, createdAt: Date.now() },
        { id: 'demo-task-5', title: 'Plan Q3 Roadmap', completed: false, duration:160, timeSpent: 50, groupId: 2, createdAt: Date.now() },
        { id: 'demo-task-6', title: 'fix the minor bugs', completed: true, duration:120, timeSpent: 120, groupId: 0, createdAt: Date.now() }
      ];

      const demoYesterdayDate = new Date(todayDate); demoYesterdayDate.setDate(todayDate.getDate() - 1);
      const demoTomorrowDate = new Date(todayDate); demoTomorrowDate.setDate(todayDate.getDate() + 1);

      const yesterdayStr = demoYesterdayDate.toISOString().split('T')[0];
      const todayStr = todayDate.toISOString().split('T')[0];
      const tomorrowStr = demoTomorrowDate.toISOString().split('T')[0];

      const demoNotes = [
        {
          id: 'demo-note-1',
          title: 'Deep Work Session Log',
          entries: {
            [yesterdayStr]: '<p><strong>Morning Block:</strong> Finished drafting the architectural proposal for the new messaging system. The async pattern looks much cleaner.</p><ul><li>Drafted the specs</li><li>Created Mermaid diagrams</li><li>Sent for peer review</li></ul>',
            [todayStr]: '<p><strong>Afternoon Focus:</strong> Refactoring the legacy state management. It is a bit tangled, but breaking it down into smaller custom hooks is working well.</p><br><p><em>Blocker:</em> Need to figure out the best way to handle concurrent hydration. Will read the Next.js docs tomorrow.</p>',
            [tomorrowStr]: '<p><strong>Plan for tomorrow:</strong> Finalize hydration bug fixes and prepare for the staging deployment at 3 PM.</p>'
          }
        },
        {
          id: 'demo-note-2',
          title: 'Meeting Notes & Action Items',
          entries: {
            [yesterdayStr]: '<h3>Weekly Sync (10:00 AM)</h3><p>- Marketing team needs the new assets by Thursday.</p><p>- Discussed the Q3 roadmap and finalized OKRs.</p><br><p><strong>Action Items:</strong></p><ol><li>Ping Sarah about the missing Figma files.</li><li>Schedule 1-on-1 with David.</li></ol>',
            [todayStr]: '<h3>Design Review (2:30 PM)</h3><p>The new dark mode palette looks fantastic. We decided to dial back the contrast slightly on the secondary text.</p>'
          }
        },
        {
          id: 'demo-note-3',
          title: 'Books / Learning Notes',
          entries: {
            [todayStr]: '<h3>Atomic Habits - Chapter 3</h3><p>The idea of focusing on <em>systems</em> instead of <em>goals</em> is profound. A goal is a result you want to achieve, but a system is the process that leads to those results.</p><br><p>Quote: <em>"You do not rise to the level of your goals. You fall to the level of your systems."</em></p>'
          }
        },
        {
          id: 'demo-note-4',
          title: 'Scratchpad',
          entries: {
            [todayStr]: '<p>Quick thoughts:</p><p>- Try using Zustand instead of Context API for the new global state.</p><p>- Grocery list: Milk, Eggs, Coffee beans.</p><p>- Call mom at 6 PM.</p>'
          }
        }
      ];

      await Promise.all([
        // 1. Reset timer/stopwatch states in DashboardStorage
        db.collection('DashboardStorage').updateOne(
          { userId: user._id.toString() },
          { 
            $unset: { 
              timerEndAt: "", 
              timerPausedLeft: "",
              stopwatchStartTime: "",
              stopwatchLastSavedChunks: "",
              stopwatchDeviceId: ""
            } 
          }
        ),
        
        // 2. Reset them in Settings where they are actually mapped
        db.collection('Settings').updateOne(
          { userId: user._id.toString() },
          { 
            $set: { 
              hasSeenOnboarding: false,
              "displaySettings.isPanicHidden": false,
              "displaySettings.isHidden": false
            },
            $unset: {
              "generalSettings.timerEndAt": "",
              "generalSettings.timerPausedLeft": "",
              "generalSettings.stopwatchStartTime": "",
              "generalSettings.stopwatchLastSavedChunks": "",
              "generalSettings.stopwatchDeviceId": "",
              "generalSettings.activeTimerSecs": "",
              "generalSettings.activeStopwatchSecs": "",
              "displaySettings.showQuote": "",
              "displaySettings.showTimer": "",
              "displaySettings.showCountdowns": "",
              "displaySettings.showVideoControls": "",
              "displaySettings.showClock": "",
              "displaySettings.showTasks": "",
              "displaySettings.showCalendar": "",
              "displaySettings.showTodayWork": "",
              "displaySettings.showStats": "",
              "displaySettings.showPlans": "",
              "displaySettings.showNotes": "",
              "displaySettings.showTimetable": "",
              "displaySettings.showDock": "",
              "displaySettings.showDeadlineAlerts": "",
              "displaySettings.showBgSwitcher": "",
              "displaySettings.showSettingsBtn": "",
              "displaySettings.showStopwatch": ""
            }
          },
          { upsert: true }
        ),
        
        // 3. Set 4 hardcoded deadlines
        db.collection('Deadlines').updateOne(
          { userId: user._id.toString() },
          { 
            $set: { 
              deadlines: demoDeadlines,
              lastModified: Date.now(),
              hideYouInLeaderboard: false
            }
          },
          { upsert: true }
        ),
        
        // 4. Reset User profile fields to default
        db.collection('User').updateOne(
          { _id: user._id },
          {
            $set: {
              alias: "demoUser",
              profilePicture: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf48actplbaZQTsAVGm8rv1ZmiaFa_P8oYMiLKnzAm4pkcylWmgJ_XKFEI&s=10"
            }
          }
        ),
        
        // 5. Overwrite Dashboard settings for Wallpapers
        db.collection('DashboardStorage').updateOne(
          { userId: user._id.toString() },
          {
            $set: {
              wallpaper: "https://static.toiimg.com/photo/imgsize-23456,msid-122440968,resizemode-4/naruto-vs-sasuke.jpg",
              bgIndex: 1,
              peekModeWallpaper: "https://i.pinimg.com/736x/07/bd/cb/07bdcb605727348d60ac19d4e8215e06.jpg",
              panicWallpaperSwitch: true,
              customDesktopWallpapers: [
                "https://static.toiimg.com/photo/imgsize-23456,msid-122440968,resizemode-4/naruto-vs-sasuke.jpg",
                "https://images4.alphacoders.com/140/1402795.mp4",
                "https://images4.alphacoders.com/476/thumb-1920-47698.png",
                "https://i.pinimg.com/736x/07/bd/cb/07bdcb605727348d60ac19d4e8215e06.jpg"
              ],
              activeDesktopCustomIndex: 0,
              isHidden: false,
              isPanicHidden: false,
              lastModified: Date.now()
            }
          },
          { upsert: true }
        ),
        
        // 6. Set Countdowns
        db.collection('Countdowns').updateOne(
          { userId: user._id.toString() },
          { 
            $set: { 
              countdowns: demoCountdowns,
              lastModified: Date.now()
            } 
          },
          { upsert: true }
        ),
        
        // 7. Set Tasks
        db.collection('Tasks').updateOne(
          { userId: user._id.toString() },
          { 
            $set: { 
              tasks: demoTasks,
              lastModified: Date.now()
            } 
          },
          { upsert: true }
        ),
        
        // 8. Set Notes
        db.collection('Notes').updateOne(
          { userId: user._id.toString() },
          {
            $set: {
              notes: demoNotes,
              lastModified: Date.now()
            }
          },
          { upsert: true }
        )
      ]);

      // Short-lived token for demo (25 minutes)
      const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, {
        expiresIn: '25m',
      });

      return NextResponse.json({ success: true, token, username: user.username, message: 'Demo mode active for 25 minutes' });
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Username/Email and password required' }, { status: 400 });
    }

    // HARDCODED ADMIN CREDENTIALS FOR TESTING
    if (username === 'admin' && password === 'admin is anand') {
      const token = jwt.sign({ userId: 'admin_id_test', username: 'admin', role: 'admin' }, JWT_SECRET, {
        expiresIn: '365d',
      });
      return NextResponse.json({ success: true, token, username: 'admin', role: 'admin' });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('User').findOne({
      $or: [
        { username },
        { email: username }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, {
      expiresIn: '365d',
    });

    await db.collection('User').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    return NextResponse.json({ success: true, token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

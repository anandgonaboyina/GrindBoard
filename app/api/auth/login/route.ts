import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function POST(request: Request) {
  try {
    const { username, password, isDemo } = await request.json();

    if (isDemo) {
      const demoUser = process.env.DEMO_USERNAME || 'demo';
      const demoPass = process.env.DEMO_PASSWORD || 'demo123';
      
      const client = await clientPromise;
      const db = client.db();
      const user = await db.collection('User').findOne({ username: demoUser });

      if (!user) {
         return NextResponse.json({ error: 'Demo user not found in database' }, { status: 404 });
      }
      
      const isMatch = await bcrypt.compare(demoPass, user.password);
      if (!isMatch) {
         return NextResponse.json({ error: 'Invalid demo credentials' }, { status: 401 });
      }

      // 1. Reset timer/stopwatch states in DashboardStorage (just in case)
      await db.collection('DashboardStorage').updateOne(
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
      );

      // 2. Reset them in Settings where they are actually mapped (generalSettings), and make sure they always see the onboarding tour
      // Also reset peek mode (isPanicHidden) and focus mode (isHidden) so new users aren't confused
      await db.collection('Settings').updateOne(
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
      );

      // 3. Set 4 hardcoded deadlines based on the current date, so demo users always see upcoming deadlines
      const todayDate = new Date();
      const tomorrowDate = new Date(); tomorrowDate.setDate(todayDate.getDate() + 1);
      const dayAfterDate = new Date(); dayAfterDate.setDate(todayDate.getDate() + 2);
      
      const demoDeadlines = [
        {
          id: 'demo-deadline-1',
          text: 'Project Submission',
          date: todayDate.toISOString().split('T')[0],
          isPinned: true
        },
        {
          id: 'demo-deadline-2',
          text: 'Team Sync Meeting',
          date: todayDate.toISOString().split('T')[0],
          isPinned: true
        },
        {
          id: 'demo-deadline-3',
          text: 'Code Review',
          date: tomorrowDate.toISOString().split('T')[0],
          isPinned: true
        },
        {
          id: 'demo-deadline-4',
          text: 'Client Presentation',
          date: dayAfterDate.toISOString().split('T')[0],
          isPinned: true
        }
      ];

      await db.collection('Deadlines').updateOne(
        { userId: user._id.toString() },
        { 
          $set: { 
            deadlines: demoDeadlines,
            lastModified: Date.now()
          } 
        },
        { upsert: true }
      );

      // 4. Set 2 hardcoded countdowns based on current date
      const nextWeekDate = new Date(todayDate); nextWeekDate.setDate(todayDate.getDate() + 7);
      const nextMonthDate = new Date(todayDate); nextMonthDate.setDate(todayDate.getDate() + 30);
      
      const demoCountdowns = [
        {
          id: 'demo-countdown-1',
          title: 'Product Launch',
          endDate: nextWeekDate.toISOString()
        },
        {
          id: 'demo-countdown-2',
          title: 'Vacation',
          endDate: nextMonthDate.toISOString()
        }
      ];

      await db.collection('Countdowns').updateOne(
        { userId: user._id.toString() },
        { 
          $set: { 
            countdowns: demoCountdowns,
            lastModified: Date.now()
          } 
        },
        { upsert: true }
      );

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

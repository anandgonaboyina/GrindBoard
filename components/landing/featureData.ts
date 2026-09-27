import { 
  Activity, Ghost, TrendingUp, Target, 
  Timer, Shield, Monitor, CalendarDays, 
  Users, BookOpen, CheckCircle2, Flame 
} from 'lucide-react';

export const CORE_FEATURES = [
  {
    id: 'rhythm-blueprint',
    title: 'Rhythm & Pacing Blueprint',
    description: 'Track your focus consistency over 14, 21, or 30 days. Compete against your own historical averages for every day of the week.',
    icon: Activity,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    glow: 'from-blue-500/20 to-transparent'
  },
  {
    id: 'ghost-leaderboard',
    title: 'Ghost-Mode Leaderboards',
    description: 'Climb the ranks with complete privacy. Utilize custom aliases and lock down your private timetable while crushing public stats.',
    icon: Ghost,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500/20',
    glow: 'from-purple-500/20 to-transparent'
  },
  {
    id: 'focus-heatmap',
    title: '6-Month Focus Heatmaps',
    description: 'Visualize your entire grind history at a glance. Spot trends, identify burnout phases, and maintain unbroken momentum.',
    icon: CalendarDays,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
    glow: 'from-amber-500/20 to-transparent'
  },
  {
    id: 'deep-focus-engine',
    title: 'Deep Focus Engine',
    description: 'Built-in precision Timers and Stopwatches that automatically log your sessions to your daily analytics and global leaderboard.',
    icon: Timer,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 border-orange-500/20',
    glow: 'from-orange-500/20 to-transparent'
  },
  {
    id: 'relentless-consistency',
    title: 'Ruthless Consistency Tracking',
    description: 'Measure the exact percentage of days you break the 1-hour deep focus threshold. Build an unbreakable chain.',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    glow: 'from-emerald-500/20 to-transparent'
  },
  {
    id: 'precision-targets',
    title: 'Precision Target Countdowns',
    description: 'Configure multi-target countdowns with our custom-built modal time-pickers, designed for zero-friction interaction.',
    icon: Target,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10 border-pink-500/20',
    glow: 'from-pink-500/20 to-transparent'
  },
  {
    id: 'lively-desktop',
    title: 'Lively Wallpaper Native',
    description: 'Designed to live directly on your desktop background. Features dynamic glass-morphism UI and an instant Panic Mode switch.',
    icon: Monitor,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500/20',
    glow: 'from-rose-500/20 to-transparent'
  },
  {
    id: 'global-connect',
    title: 'Global Squads & Rivalries',
    description: 'Join the Global Groups or create your own one, form private groups, and instantly compare your daily Best against your fiercest rivals.',
    icon: Users,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 border-teal-500/20',
    glow: 'from-teal-500/20 to-transparent'
  },
  {
    id: 'aes-cloud-sync',
    title: 'AES-256 Cloud Sync',
    description: 'Flawless offline-first architecture. Your data hydrates instantly from local storage and safely syncs to the cloud in the background.',
    icon: Shield,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    glow: 'from-cyan-500/20 to-transparent'
  },
  {
    id: 'markdown-notes',
    title: 'Markdown Knowledge Base',
    description: 'Integrated rich-text note-taking. Document your journey, save code snippets, and organize your thoughts without leaving the dash.',
    icon: BookOpen,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    glow: 'from-indigo-500/20 to-transparent'
  }
];
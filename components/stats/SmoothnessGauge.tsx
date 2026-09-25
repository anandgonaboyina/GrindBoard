'use client';
import { useMemo } from 'react';
import { 
  Activity, ShieldCheck, AlertCircle, 
  BarChart3, TrendingUp, Sparkles, Lightbulb 
} from 'lucide-react';
import { calculateSmoothnessScore } from './utils';

interface Props {
  history: Record<string, number>;
  isLight: boolean;
  formatMins: (mins: number) => string;
}

export default function SmoothnessGauge({ history, isLight, formatMins }: Props) {
  const analysis = useMemo(() => {
    return calculateSmoothnessScore(history, 30);
  }, [history]);

  const colorConfig = {
    'Steady Flow': {
      text: isLight ? 'text-emerald-700' : 'text-emerald-400',
      bg: isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20',
      bar: isLight ? 'bg-emerald-500' : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]',
      glow: 'from-emerald-500/10 to-transparent',
      icon: ShieldCheck,
    },
    'Flexible Wave': {
      text: isLight ? 'text-amber-700' : 'text-amber-400',
      bg: isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20',
      bar: isLight ? 'bg-amber-500' : 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      glow: 'from-amber-500/10 to-transparent',
      icon: Activity,
    },
    'Volatile': {
      text: isLight ? 'text-rose-700' : 'text-rose-400',
      bg: isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/10 border-rose-500/20',
      bar: isLight ? 'bg-rose-500' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.5)]',
      glow: 'from-rose-500/10 to-transparent',
      icon: AlertCircle,
    },
  }[analysis.status];

  const Icon = colorConfig.icon;

  return (
    <div 
      className={`p-3 rounded-xl border flex flex-col gap-2.5 shadow-sm relative overflow-hidden ${
        isLight 
          ? 'bg-white border-slate-200' 
          : 'bg-slate-900/70 border-white/10 backdrop-blur-md'
      }`}
    >
      {/* Ambient Glow Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${colorConfig.glow} rounded-full blur-2xl pointer-events-none`} />

      {/* Header: Title & Status */}
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-lg ${isLight ? 'bg-purple-50 text-purple-600' : 'bg-purple-500/10 text-purple-400'}`}>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <h3 className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Rhythm & Flow
          </h3>
        </div>

        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[16px] font-bold shadow-sm ${colorConfig.bg} ${colorConfig.text}`}>
          <Icon className="w-3 h-3" />
          <span>{analysis.status}</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="flex flex-col gap-1 relative z-10 mt-0.5">
        <div className="flex justify-between text-[20px] font-black leading-none">
          <span className={isLight ? 'text-slate-500' : 'text-white/60'}>Stability Index (30d)</span>
          <span className={colorConfig.text}>{analysis.score}%</span>
        </div>
        <div className={`w-full h-4 mt-1 rounded-full overflow-hidden p-0.5 ${isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800/80 border border-white/5'}`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${colorConfig.bar}`}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
      </div>

      {/* Ultra-Slim Metric Cards */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        <div className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-white/5'
        }`}>
          <span className={`flex items-center gap-1 text-[9px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            <TrendingUp className="w-3 h-3 text-purple-500" />
            Avg
          </span>
          <span className={`text-[11px] font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>
            {formatMins(analysis.avgMins)}/d
          </span>
        </div>

        <div className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-white/5'
        }`}>
          <span className={`flex items-center gap-1 text-[9px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            <BarChart3 className="w-3 h-3 text-blue-500" />
            Variance
          </span>
          <span className={`text-[11px] font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>
            ±{formatMins(analysis.standardDeviation)}
          </span>
        </div>
      </div>

      {/* Condensed Insights & Tips (Stacked tightly) */}
      <div className="flex flex-col gap-1.5 relative z-10">
        <div className={`px-2.5 py-2 rounded-lg border flex items-start gap-2 ${
          isLight ? 'bg-purple-50/50 border-purple-100' : 'bg-purple-500/10 border-purple-500/20'
        }`}>
          <Sparkles className={`w-3 h-3 shrink-0 mt-0.5 ${isLight ? 'text-purple-500' : 'text-purple-400'}`} />
          <p className={`text-[10px] leading-snug font-medium ${isLight ? 'text-purple-900/80' : 'text-purple-200/80'}`}>
            <strong className={isLight ? 'text-purple-900' : 'text-purple-300'}>Pattern: </strong>
            {analysis.description} Low variance protects stamina.
          </p>
        </div>

        <div className={`px-2.5 py-2 rounded-lg border flex items-start gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-white/5'
        }`}>
          <Lightbulb className={`w-3 h-3 shrink-0 mt-0.5 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
          <p className={`text-[10px] leading-snug font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            <strong className={isLight ? 'text-slate-700' : 'text-white/80'}>Tip: </strong>
            {analysis.status === 'Steady Flow' 
              ? 'Protect routines to keep variance minimal.'
              : analysis.status === 'Flexible Wave'
              ? 'Anchor a baseline minimum time to flatten the curve.'
              : 'Deep dips cause burnout. Aim for micro-habits.'}
          </p>
        </div>
      </div>
    </div>
  );
}
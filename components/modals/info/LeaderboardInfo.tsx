import {useState} from "react";
import {Clock, ShieldAlert, Flame, X, Info} from 'lucide-react'
export function LeaderboardInfo(close:any)
{
    return (<div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 p-5 rounded-xl w-full max-w-sm flex flex-col gap-3 relative max-h-[80vh] overflow-y-auto shadow-2xl">
                <button onClick={() => close()} className="absolute top-3 right-3 text-white/40 hover:text-white p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
                </button>
            <h3 className="text-sm md:text-base font-bold flex items-center gap-2 text-white"><Info className="w-4 h-4 text-blue-400" /> About Leaderboard</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              The Global Leaderboard ranks users based on their total focus time. Focus time is strictly tracked by completing Timer or Stopwatch sessions on the dashboard.
            </p>
            <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                    <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                    <h4 className="text-xs font-bold text-red-300">Daily Streaks</h4>
                    <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">You earn a streak day by accumulating at least 60 minutes of focus time in a single day. Miss a day, and your current streak resets.</p>
                    </div>
                </div>
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-300">Sleep Schedule</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">Your Wake and Work times are captured via the Daily Routine modal. Your Last Active time is logged automatically based on when you stop working.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-300">Privacy & IDs</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">Your personal data is secured by JWT encryption. We mask user IDs for privacy. IDs are only used to send friend requests.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => close()}
              className="mt-2 w-full py-2 bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
    )
}
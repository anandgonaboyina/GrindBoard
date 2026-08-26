'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Newspaper, X, Check, Loader2, Plus, Clock, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NewsCardStack from './NewsCardStack';
import type { NewsPost } from './admin/AdminNewsManager';
import { syncNewsMediaCache } from '@/lib/newsMediaCache';

export default function NewsModal() {
  const { isNewsOpen, toggleNews, hasUnreadNews, setHasUnreadNews } = useDashboardStore();
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [marking, setMarking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function initNews() {
      try {
        const token = localStorage.getItem('dashboard_sync_token');
        const username = localStorage.getItem('dashboard_username');

        let readIds: string[] = [];
        if (token && username) {
          const userRes = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            const me = userData.users?.find((u: any) => u.username === username);
            readIds = me?.readNewsIds || [];
            if (me?.isAdmin === true || me?.isAdmin === 'true') {
              setIsAdmin(true);
            }
          }
        }

        const newsRes = await fetch('/api/news');
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          if (newsData.news) {
            const now = Date.now();
            const broadcasted = newsData.news.filter((n: NewsPost) => new Date(n.broadcastDate).getTime() <= now);
            const unread = broadcasted.filter((n: NewsPost) => n._id && !readIds.includes(n._id));

            setNews(broadcasted);
            setUnreadIds(unread.map((n: NewsPost) => n._id!));
            setHasUnreadNews(unread.length > 0);
            syncNewsMediaCache(broadcasted);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    initNews();
  }, [setHasUnreadNews]);

  // Auto-open logic with 10-second reading timer flag
  useEffect(() => {
    if (hasUnreadNews && !hasAutoOpened && !loading) {
      if (!isNewsOpen) {
        useDashboardStore.setState({ isNewsOpen: true });
        setIsAutoOpened(true);
        setTimeLeft(10);
      }
      setHasAutoOpened(true);
    }
  }, [hasUnreadNews, hasAutoOpened, isNewsOpen, loading]);

  // Timer countdown effect for auto-opened news
  useEffect(() => {
    if (!isNewsOpen || !isAutoOpened || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowWarning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isNewsOpen, isAutoOpened, timeLeft]);

  // Reset warning when modal closes
  useEffect(() => {
    if (!isNewsOpen) {
      setShowWarning(false);
    }
  }, [isNewsOpen]);

  const handleAttemptClose = (onCanClose: () => void) => {
    if (isAutoOpened && timeLeft > 0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3500);
      return;
    }
    onCanClose();
  };

  const handleMarkAsRead = async () => {
    if (unreadIds.length === 0) {
      toggleNews();
      return;
    }

    setMarking(true);
    try {
      const token = localStorage.getItem('dashboard_sync_token');
      if (token) {
        await fetch('/api/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ readNewsIds: unreadIds })
        });
      }
      setHasUnreadNews(false);
      setUnreadIds([]);
      toggleNews();
    } catch (e) {
      console.error(e);
      toggleNews(); // still close it 
    } finally {
      setMarking(false);
    }
  };

  if (!isNewsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[990] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
    >
      {/* Early Close Warning Banner (No visible timer digits) */}
      {showWarning && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[1010] w-[92%] max-w-md p-3.5 bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 backdrop-blur-xl border border-amber-400/50 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-in fade-in slide-in-from-top-4 duration-300 flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-300 animate-bounce" />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wide">Please Read Today's Updates</h4>
            <p className="text-[11px] text-white/90 leading-snug">
              Important news & updates available! Please take a moment to review the news before closing.
            </p>
          </div>
          <button onClick={() => setShowWarning(false)} className="text-white/40 hover:text-white p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Top Bar (Close Button) */}
      <div className="absolute top-8 right-4 sm:top-20 sm:right-36 flex items-center gap-2.5 z-[1000]">
        <button
          onClick={() => handleAttemptClose(() => toggleNews())}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white/80 hover:text-white transition-all border border-white/10 shadow-2xl active:scale-95 cursor-pointer"
          title="Close Updates"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Title */}
      <div className="absolute top-12 left-6 sm:left-10 flex items-center gap-3 z-[1000] pointer-events-none">
        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-xl">
          <Newspaper className="text-blue-400 w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tight">
          What's New
        </h2>
      </div>

      {/* Content */}
      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={40} className="animate-spin text-blue-500" />
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-white/40 p-12 border border-white/10 border-dashed rounded-[3rem] bg-white/5 backdrop-blur-2xl shadow-2xl">
            <Newspaper className="w-16 h-16 opacity-30" />
            <p className="text-xl font-medium">No updates available.</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            <NewsCardStack posts={news.sort((a, b) => a.createdAt - b.createdAt)} unreadIds={unreadIds} isOpen={isNewsOpen} />
          </div>
        )}
      </div>

      {/* Floating Footer Button */}
      <div className="absolute bottom-16 sm:bottom-25 left-1/2 -translate-x-1/2 flex justify-center z-[1000]">
        {hasUnreadNews ? (
          <button
            onClick={() => handleAttemptClose(() => handleMarkAsRead())}
            disabled={marking}
            className="px-6 sm:px-8 py-3 bg-blue-500/80 hover:bg-blue-500 backdrop-blur-xl active:scale-95 text-white font-bold rounded-full text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_10px_40px_rgba(59,130,246,0.4)] border border-blue-400/50 disabled:opacity-70 uppercase tracking-wider whitespace-nowrap cursor-pointer"
          >
            {marking ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {marking ? 'Updating...' : 'Mark as Read & Close'}
          </button>
        ) : (
          <button
            onClick={() => handleAttemptClose(() => toggleNews())}
            className="px-6 sm:px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl active:scale-95 text-white font-bold rounded-full text-xs sm:text-sm transition-all border border-white/20 shadow-2xl uppercase tracking-wider whitespace-nowrap cursor-pointer"
          >
            Close Updates
          </button>
        )}
      </div>

      {/* Admin Quick Add Button */}
      {isAdmin && (
        <button
          onClick={() => { toggleNews(); router.push('/admin'); }}
          className="absolute bottom-28 sm:bottom-25 right-4 sm:right-10 p-3 sm:p-4 bg-green-500/80 hover:bg-green-500 backdrop-blur-xl rounded-full text-white transition-all border border-green-400/50 shadow-[0_10px_40px_rgba(34,197,94,0.4)] z-[1000] active:scale-95 flex items-center justify-center cursor-pointer"
          title="Add News (Admin)"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
}

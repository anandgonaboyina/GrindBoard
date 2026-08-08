'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Newspaper, X, Check, Calendar, Image as ImageIcon, Video, FileCode2, Loader2, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NewsCardStack from './NewsCardStack';
import type { NewsPost } from './admin/AdminNewsManager';

export default function NewsModal() {
  const { isNewsOpen, toggleNews, hasUnreadNews, setHasUnreadNews } = useDashboardStore();
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [marking, setMarking] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  useEffect(() => {
    if (hasUnreadNews && !hasAutoOpened && !loading) {
      if (!isNewsOpen) {
        useDashboardStore.setState({ isNewsOpen: true });
      }
      setHasAutoOpened(true);
    }
  }, [hasUnreadNews, hasAutoOpened, isNewsOpen, loading]);

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
      {/* Floating Close Button */}
      <button
        onClick={toggleNews}
        className="absolute top-8 right-4 sm:top-20 sm:right-36 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white/80 hover:text-white transition-all border border-white/10 shadow-2xl z-[1000] active:scale-95"
      >
        <X className="w-6 h-6" />
      </button>

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
            onClick={handleMarkAsRead}
            disabled={marking}
            className="px-6 sm:px-8 py-3 bg-blue-500/80 hover:bg-blue-500 backdrop-blur-xl active:scale-95 text-white font-bold rounded-full text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_10px_40px_rgba(59,130,246,0.4)] border border-blue-400/50 disabled:opacity-70 uppercase tracking-wider whitespace-nowrap"
          >
            {marking ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {marking ? 'Updating...' : 'Mark as Read & Close'}
          </button>
        ) : (
          <button
            onClick={toggleNews}
            className="px-6 sm:px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl active:scale-95 text-white font-bold rounded-full text-xs sm:text-sm transition-all border border-white/20 shadow-2xl uppercase tracking-wider whitespace-nowrap"
          >
            Close Updates
          </button>
        )}
      </div>

      {/* Admin Quick Add Button */}
      {isAdmin && (
        <button
          onClick={() => { toggleNews(); router.push('/admin'); }}
          className="absolute bottom-28 sm:bottom-25 right-4 sm:right-10 p-3 sm:p-4 bg-green-500/80 hover:bg-green-500 backdrop-blur-xl rounded-full text-white transition-all border border-green-400/50 shadow-[0_10px_40px_rgba(34,197,94,0.4)] z-[1000] active:scale-95 flex items-center justify-center"
          title="Add News (Admin)"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
}

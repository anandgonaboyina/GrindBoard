'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Newspaper, X, Check, Loader2, Plus, Clock, ShieldAlert, Sparkles, Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import type { NewsPost as AdminNewsPost } from './admin/News/AdminNewsManager';
import { syncNewsMediaCache } from '@/lib/newsMediaCache';
import ScrollableWithArrows from '@/components/ScrollableWithArrows';
import { getEmbedVideoUrl } from '@/components/NewsCardStack';

interface NewsPost extends AdminNewsPost {
  mediaUrl?: string; // Kept for backward compatibility with older posts
  createdAt?: number; 
}

export default function NewsModal() {
  const { 
    isNewsOpen, toggleNews, hasUnreadNews, setHasUnreadNews,
    lastSeenNewsTime = 0, updateLastSeenNews, _hasHydrated, theme 
  } = useDashboardStore();

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsPost[]>([]);
  
  const [localHighWaterMark, setLocalHighWaterMark] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [marking, setMarking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const isRouteAdmin = pathname?.startsWith('/admin');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (theme === 'auto') {
      const hour = new Date().getHours();
      setResolvedTheme(hour >= 6 && hour < 18 ? 'light' : 'dark');
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);
  const isLight = resolvedTheme === 'light';

  useEffect(() => {
    if (!_hasHydrated) return;

    async function initNews() {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('grindboard_read_news_ids');
          localStorage.removeItem('grindboard_seen_news_ids');
        }

        const token = localStorage.getItem('dashboard_sync_token');
        const username = localStorage.getItem('dashboard_username');

        const localLastSeen = parseInt(localStorage.getItem('grindboard_last_seen_news') || '0', 10);
        let cloudLastSeen = lastSeenNewsTime;

        if (token && username) {
          try {
            const userRes = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (userRes.ok) {
              const userData = await userRes.json();
              const me = userData.users?.find((u: any) => u.username === username);
              if (me) {
                cloudLastSeen = Math.max(cloudLastSeen, me.lastSeenNewsTime || 0);
                if (me.isAdmin === true || me.isAdmin === 'true') setIsAdmin(true);
              }
            }
          } catch (err) { console.warn('Unable to fetch user data for news:', err); }
        }

        const absoluteHighWaterMark = Math.max(localLastSeen, cloudLastSeen);
        setLocalHighWaterMark(absoluteHighWaterMark);

        try {
          const newsRes = await fetch('/api/news');
          if (newsRes.ok) {
            const newsData = await newsRes.json();
            if (newsData.news) {
              const now = Date.now();
              const broadcasted = newsData.news.filter((n: NewsPost) => new Date(n.broadcastDate).getTime() <= now);
              const sortedNews = broadcasted.sort((a: NewsPost, b: NewsPost) => new Date(b.broadcastDate).getTime() - new Date(a.broadcastDate).getTime());
              const unreadPosts = sortedNews.filter((n: NewsPost) => (n.createdAt || 0) > absoluteHighWaterMark);

              setNews(sortedNews);
              setUnreadCount(unreadPosts.length);
              setHasUnreadNews(unreadPosts.length > 0);
              syncNewsMediaCache(broadcasted);
            }
          }
        } catch (err) { console.warn('Unable to fetch news feed:', err); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    initNews();
  }, [_hasHydrated, lastSeenNewsTime, setHasUnreadNews]);

  useEffect(() => {
    if (hasUnreadNews && unreadCount > 0 && !hasAutoOpened && !loading && !isRouteAdmin) {
      if (!isNewsOpen) {
        useDashboardStore.setState({ isNewsOpen: true });
        setIsAutoOpened(true);
        setTimeLeft(10);
      }
      setHasAutoOpened(true);
    }
  }, [hasUnreadNews, unreadCount, hasAutoOpened, isNewsOpen, loading, isRouteAdmin]);

  useEffect(() => {
    if (!isNewsOpen || !isAutoOpened || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); setShowWarning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isNewsOpen, isAutoOpened, timeLeft]);

  useEffect(() => { if (!isNewsOpen) setShowWarning(false); }, [isNewsOpen]);

  const handleAttemptClose = (onCanClose: () => void) => {
    if (isAutoOpened && timeLeft > 0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3500);
      return;
    }
    if (unreadCount > 0) handleMarkAsRead(); else onCanClose();
  };

  const handleMarkAsRead = async () => {
    if (news.length === 0) { toggleNews(); return; }
    setMarking(true);
    try {
      const highestTimestamp = Math.max(...news.map(n => n.createdAt || 0));
      if (typeof window !== 'undefined') localStorage.setItem('grindboard_last_seen_news', highestTimestamp.toString());
      if (updateLastSeenNews) updateLastSeenNews(highestTimestamp);

      const token = localStorage.getItem('dashboard_sync_token');
      if (token) {
        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ lastSeenNewsTime: highestTimestamp })
        });
      }

      setLocalHighWaterMark(highestTimestamp);
      setUnreadCount(0);
      setHasUnreadNews(false);
      toggleNews();
    } catch (e) { console.error(e); toggleNews(); } finally { setMarking(false); }
  };

  if (isRouteAdmin) return null;
  if (!isNewsOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-1 sm:p-2 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full h-[96vh] md:h-[85vh] max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 border transition-colors ${
        isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#090e17] border-slate-800'
      }`}>
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isLight ? 'from-blue-400 to-indigo-500' : 'from-cyan-400 to-blue-600'} z-50`} />

        <div className={`px-4 py-3 md:py-4 flex justify-between items-center border-b shrink-0 z-40 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
              <Megaphone className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h2 className={`text-lg md:text-xl font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>GrindBoard Updates</h2>
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse border ${isLight ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                <Sparkles className="w-3 h-3" /> {unreadCount} New
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {isAdmin && (
              <>
              <p className="text-green-400 font-bold bg-white p-1 rounded-xl" >Admin : </p>
              <button onClick={() => { toggleNews(); router.push('/admin'); }} className={`p-1.5 md:p-2 rounded-xl transition-colors ${isLight ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-slate-800 text-emerald-400'}`} title="Add News">
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              </>
            )}
            <button onClick={() => handleAttemptClose(() => toggleNews())} className={`p-1.5 md:p-2 rounded-xl transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-[#090e17] to-slate-900/50'}`}>
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-60">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading Feed...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-50">
              <div className={`p-6 rounded-full border-2 border-dashed ${isLight ? 'bg-slate-100 border-slate-300 text-slate-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                <Newspaper className="w-10 h-10" />
              </div>
              <p className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>You're all caught up</p>
            </div>
          ) : (
            <ScrollableWithArrows className="absolute inset-0 w-full h-full p-4 md:p-6 lg:p-8 custom-scrollbar">
              <div className={`relative border-l-2 ml-3 md:ml-4 pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="space-y-6 md:space-y-10">
                  {news.map((n) => {
                    const isUnread = (n.createdAt || 0) > localHighWaterMark;
                    return (
                      <div key={n._id} className="relative pl-5 md:pl-8 group">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 z-10 transition-colors ${
                          isLight ? 'border-slate-50' : 'border-[#090e17]'
                        } ${isUnread ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : isLight ? 'bg-slate-300' : 'bg-slate-700'}`}>
                          {isUnread && <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-60" />}
                        </div>
                        <div className={`flex flex-col gap-3 p-1 md:p-2 rounded-2xl border transition-all ${
                          isUnread 
                            ? isLight ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-800/80 border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.1)]' 
                            : isLight ? 'bg-white border-slate-200 shadow-sm opacity-80 hover:opacity-100' : 'bg-slate-900/60 border-white/5 opacity-80 hover:opacity-100 hover:bg-slate-800/60'
                        }`}>
                          <div className="flex flex-col gap-1">
                            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isUnread ? 'text-blue-500' : isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(n.broadcastDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <h3 className={`text-base md:text-xl font-black tracking-tight leading-tight ${isUnread ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-700' : 'text-slate-200')}`}>
                              {n.title}
                            </h3>
                          </div>
                          
                          {/* MEDIA RENDERING BLOCK */}
                          {(n.media?.imageUrl || n.media?.videoUrl || n.media?.svgUrl || n.mediaUrl) && (
                            <div className={`w-[60%] rounded-xl overflow-hidden mt-1 border ${isLight ? 'border-slate-100 bg-slate-100' : 'border-white/5 bg-black/40'}`}>
                              {(() => {
                                const legacyVideo = n.mediaUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? n.mediaUrl : null;
                                const videoSrc = n.media?.videoUrl || legacyVideo || (n.media?.imageUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? n.media.imageUrl : null);
                                
                                if (videoSrc) {
                                  const parsed = getEmbedVideoUrl(videoSrc);
                                  if (parsed.type === 'iframe') return <iframe src={parsed.embedUrl} title={n.title} className="w-full max-h-[220px] md:max-h-[300px] border-0 object-cover pointer-events-auto" allowFullScreen />;
                                  return <video src={parsed.embedUrl} controls playsInline className="w-full max-h-[220px] md:max-h-[300px] object-cover" />;
                                }
                                
                                const imgSrc = n.media?.imageUrl || n.mediaUrl;
                                if (imgSrc) return <img src={imgSrc} alt={n.title} className=" max-h-[120px] md:max-h-[200px] object-cover" loading="lazy" />;
                                
                                if (n.media?.svgUrl) return <img src={n.media?.svgUrl} alt={n.title} className="w-full max-h-[220px] md:max-h-[300px] object-contain p-2" />;
                                
                                return null;
                              })()}
                            </div>
                          )}

                          <div 
                            className={`text-xs md:text-sm leading-relaxed mt-1 
                              [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 
                              ${isLight ? 'text-slate-600 [&>a]:text-blue-600 [&>strong]:text-slate-900' : 'text-slate-300 [&>a]:text-blue-400 [&>strong]:text-white'}
                              [&>a]:underline font-medium`}
                            dangerouslySetInnerHTML={{ __html: n.content }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollableWithArrows>
          )}
        </div>

        <div className={`mt-auto shrink-0 relative border-t ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/95 border-white/10'}`}>
          {showWarning && (
            <div className={`absolute bottom-[100%] left-0 w-full p-2.5 border-t backdrop-blur-md flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 fade-in ${isLight ? 'bg-amber-100 border-amber-200' : 'bg-amber-500/20 border-amber-500/30'}`}>
              <ShieldAlert className={`w-4 h-4 animate-bounce ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>Please read updates before closing</span>
            </div>
          )}
          <div className="p-3 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center">
              {!showWarning && isAutoOpened && timeLeft > 0 ? (
                <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${isLight ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-slate-400 bg-white/5 border-white/10'}`}>
                  <Clock className="w-3.5 h-3.5" /> Unlocks in {timeLeft}s
                </div>
              ) : (
                <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  You are up to date
                </span>
              )}
            </div>
            {unreadCount > 0 ? (
              <button
                onClick={() => handleAttemptClose(() => handleMarkAsRead())}
                disabled={marking || (isAutoOpened && timeLeft > 0)}
                className={`w-full sm:w-auto px-6 py-3 md:py-3.5 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md
                  ${marking || (isAutoOpened && timeLeft > 0) 
                    ? isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] active:scale-95 cursor-pointer'
                  }`}
              >
                {marking ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {marking ? 'Syncing...' : 'Mark as Read & Close'}
              </button>
            ) : (
              <button
                onClick={() => handleAttemptClose(() => toggleNews())}
                disabled={isAutoOpened && timeLeft > 0}
                className={`w-full sm:w-auto px-6 py-3 md:py-3.5 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                  ${(isAutoOpened && timeLeft > 0)
                    ? isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 active:scale-95 cursor-pointer' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 cursor-pointer'
                  }`}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
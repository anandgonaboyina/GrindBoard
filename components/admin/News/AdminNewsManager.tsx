'use client';
import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Trash2, Edit2, Check, X, Calendar as CalendarIcon, Image as ImageIcon, Video, FileCode2, Loader2 } from 'lucide-react';
import { getLocalDateString } from '@/utils/date';
import ScrollableHorizontalWithArrows from '@/components/ScrollableHorizontalWithArrows';
import ScrollableWithArrows from '@/components/ScrollableWithArrows';
import { getEmbedVideoUrl } from '@/components/NewsCardStack';

export type NewsPost = {
  _id?: string;
  title: string;
  content: string;
  broadcastDate: string;
  media?: {
    imageUrl?: string;
    videoUrl?: string;
    svgUrl?: string;
  };
  createdAt: number;
};

export default function AdminNewsManager() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<NewsPost>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.news) {
        setPosts(data.news);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPost.title || !currentPost.content || !currentPost.broadcastDate) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('dashboard_sync_token');
      const method = currentPost._id ? 'PUT' : 'POST';
      const url = currentPost._id ? `/api/news/${currentPost._id}` : '/api/news';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentPost)
      });

      const data = await res.json();
      if (data.success) {
        await fetchNews();
        setIsEditing(false);
        setCurrentPost({});
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: NewsPost) => {
    setCurrentPost(post);
    setIsEditing(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this news post?")) {
      try {
        const token = localStorage.getItem('dashboard_sync_token');
        const res = await fetch(`/api/news/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setPosts(posts.filter(p => p._id !== id));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteMultiple = async (ids: string[], promptText: string) => {
    if (ids.length === 0) return;
    if (confirm(`Are you sure you want to ${promptText}? (${ids.length} post${ids.length === 1 ? '' : 's'})`)) {
      setLoading(true);
      try {
        const token = localStorage.getItem('dashboard_sync_token');
        const deletions = ids.map(id =>
          fetch(`/api/news/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        );
        await Promise.all(deletions);

        // Remove locally immediately for snappy UI
        setPosts(posts.filter(p => !ids.includes(p._id!)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const openNewPost = () => {
    setCurrentPost({ broadcastDate: getLocalDateString(), media: {} });
    setIsEditing(true);
  };

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6 max-w-full min-w-0 flex-1 min-h-0 pb-4">

      {/* Header */}
      <div className="flex flex-row justify-between items-center bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shrink-0 gap-3 backdrop-blur-sm">
        <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 truncate">
          <Newspaper className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          <span className="truncate">News Management</span>
        </h2>
        <div className="flex items-center gap-2">
          {posts.length > 0 && (
            <button
              onClick={() => handleDeleteMultiple(posts.map(p => p._id!), "delete ALL news posts forever")}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all border border-red-500/20 whitespace-nowrap shrink-0"
              title="Delete all news posts"
            >
              Clear All
            </button>
          )}
          <button
            onClick={openNewPost}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap shrink-0"
          >
            <Plus size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Add News</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Form / Editing Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-2xl max-h-full flex flex-col bg-[#111] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0 bg-white/5">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Newspaper className="text-blue-400 w-5 h-5" />
                {currentPost._id ? 'Edit News Post' : 'Create News Post'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <ScrollableWithArrows className="flex-1 overflow-hidden max-h-[70vh]">
              <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-6 w-full">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    value={currentPost.title || ''}
                    onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                    className="bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-2 text-sm sm:text-base text-white outline-none focus:border-blue-500 transition-colors w-full"
                    placeholder="e.g., v2.1 Update is Here!"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
                    <CalendarIcon size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Broadcast Date *
                  </label>
                  <input
                    type="date"
                    value={currentPost.broadcastDate || ''}
                    onChange={e => setCurrentPost({ ...currentPost, broadcastDate: e.target.value })}
                    className="bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-2 text-sm sm:text-base text-white outline-none focus:border-blue-500 transition-colors w-full sm:w-1/3 min-w-[150px]"
                  />
                  <p className="text-[10px] sm:text-xs text-white/40 leading-tight">Users will only see this post on or after this date. (You can prepare tomorrow's news today).</p>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 min-h-[200px]">
                  <label className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-wider">Content *</label>
                  <textarea
                    value={currentPost.content || ''}
                    onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                    className="bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 text-sm sm:text-base text-white outline-none focus:border-blue-500 transition-colors min-h-[150px] flex-1 resize-y custom-scrollbar"
                    placeholder="Write your news update here..."
                  />
                </div>

                {/* Media Fields */}
                <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 flex flex-col gap-3 sm:gap-4 mt-2 shrink-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white/80">Optional Media (Feature Additions)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1"><ImageIcon size={12} /> Image URL</label>
                      <input
                        type="text"
                        value={currentPost.media?.imageUrl || ''}
                        onChange={e => setCurrentPost({ ...currentPost, media: { ...currentPost.media, imageUrl: e.target.value } })}
                        className="bg-black/50 border border-white/10 rounded-md sm:rounded-lg px-3 py-2 sm:py-1.5 text-xs sm:text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1"><Video size={12} /> Video URL</label>
                      <input
                        type="text"
                        value={currentPost.media?.videoUrl || ''}
                        onChange={e => setCurrentPost({ ...currentPost, media: { ...currentPost.media, videoUrl: e.target.value } })}
                        className="bg-black/50 border border-white/10 rounded-md sm:rounded-lg px-3 py-2 sm:py-1.5 text-xs sm:text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1"><FileCode2 size={12} /> SVG URL</label>
                      <input
                        type="text"
                        value={currentPost.media?.svgUrl || ''}
                        onChange={e => setCurrentPost({ ...currentPost, media: { ...currentPost.media, svgUrl: e.target.value } })}
                        className="bg-black/50 border border-white/10 rounded-md sm:rounded-lg px-3 py-2 sm:py-1.5 text-xs sm:text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollableWithArrows>

            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 bg-black/20 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl font-bold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!currentPost.title || !currentPost.content || !currentPost.broadcastDate || saving}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 text-sm sm:text-base"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {saving ? 'Saving...' : 'Save Post'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* List View */}
      <div className="w-full relative min-w-0 flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex justify-center p-10 h-full items-center">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-black/20 border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-white/40 border-dashed m-2 h-full">
            <Newspaper size={40} className="mb-4 opacity-50 sm:w-12 sm:h-12" />
            <p className="text-sm sm:text-base text-center">No news posts yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="w-full flex-1 min-h-0 overflow-hidden relative">
            <ScrollableWithArrows className="absolute inset-0 w-full h-full pr-1 sm:pr-2 pb-10 pt-2">
              <div className="flex flex-col gap-6 sm:gap-8 w-full min-h-full">
                {(() => {
                  const grouped = posts.reduce((acc, post) => {
                    const d = post.broadcastDate;
                    if (!acc[d]) acc[d] = [];
                    acc[d].push(post);
                    return acc;
                  }, {} as Record<string, NewsPost[]>);

                  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                  return sortedDates.map(date => (
                    <div key={date} className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 px-1 sm:px-2 border-b border-white/10 pb-2 group/header">
                        <CalendarIcon size={16} className="text-blue-400 sm:w-5 sm:h-5 shrink-0" />
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">{date}</h3>
                        <span className="text-[10px] sm:text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-mono shrink-0">
                          {grouped[date].length} update{grouped[date].length !== 1 ? 's' : ''}
                        </span>

                        <button
                          onClick={() => handleDeleteMultiple(grouped[date].map(p => p._id!), `delete all posts for ${date}`)}
                          className="ml-auto text-[10px] sm:text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md opacity-0 group-hover/header:opacity-100 transition-opacity whitespace-nowrap shrink-0 border border-red-500/20 font-bold active:scale-95"
                        >
                          Delete Day
                        </button>
                      </div>

                      <ScrollableHorizontalWithArrows hideArrows={grouped[date].length <= 2}>
                        <div className="flex gap-4 pb-4">
                          {grouped[date].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()).map(post => (
                            <div key={post._id} className="min-w-[260px] w-[260px] sm:min-w-[320px] sm:w-[320px] shrink-0 bg-[#1a1a1a]/80 border border-white/10 rounded-2xl flex flex-col relative transition-all overflow-hidden group snap-center hover:bg-[#222] hover:border-white/20 shadow-xl">

                              {/* Media Section */}
                              {(post.media?.imageUrl || post.media?.videoUrl || post.media?.svgUrl) && (
                                <div className="w-full h-32 sm:h-40 bg-black/40 border-b border-white/10 relative flex items-center justify-center overflow-hidden shrink-0">
                                  {(() => {
                                    const videoSrc = post.media?.videoUrl || (
                                      post.media?.imageUrl && (
                                        post.media.imageUrl.includes('youtube.com') ||
                                        post.media.imageUrl.includes('youtu.be') ||
                                        post.media.imageUrl.includes('cloudinary.com') ||
                                        post.media.imageUrl.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i)
                                      ) ? post.media.imageUrl : null
                                    );

                                    if (videoSrc) {
                                      const parsed = getEmbedVideoUrl(videoSrc);
                                      if (parsed.type === 'iframe') {
                                        return (
                                          <iframe
                                            src={parsed.embedUrl}
                                            title={post.title}
                                            className="w-full h-full border-0 object-cover"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        );
                                      }
                                      return (
                                        <video
                                          src={parsed.embedUrl}
                                          controls
                                          muted
                                          playsInline
                                          className="w-full h-full object-cover"
                                        />
                                      );
                                    }

                                    if (post.media?.imageUrl) {
                                      return <img src={post.media.imageUrl} alt={post.title} className="w-full h-full object-cover" />;
                                    }

                                    if (post.media?.svgUrl) {
                                      return <img src={post.media.svgUrl} alt={post.title} className="w-full h-full object-contain p-4" />;
                                    }

                                    return null;
                                  })()}
                                </div>
                              )}

                              <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 flex-1">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 justify-between">
                                    <h4 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-2 flex-1" title={post.title}>{post.title}</h4>
                                    {new Date(post.broadcastDate).getTime() > Date.now() && (
                                      <span className="bg-purple-500/20 text-purple-300 text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-wider font-bold shrink-0 self-start">Scheduled</span>
                                    )}
                                  </div>
                                </div>

                                <p className="text-white/60 text-xs sm:text-sm line-clamp-3 leading-relaxed flex-1">{post.content}</p>

                                <div className="flex items-center justify-end mt-2 pt-3 sm:pt-4 border-t border-white/10">
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => handleEdit(post)}
                                      className="p-2 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-blue-400 hover:text-blue-300 rounded-lg transition-colors flex items-center gap-1.5"
                                      title="Edit"
                                    >
                                      <Edit2 size={14} className="sm:w-4 sm:h-4" /> <span className="text-xs font-bold hidden sm:inline">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(post._id)}
                                      className="p-2 sm:px-3 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center gap-1.5"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} className="sm:w-4 sm:h-4" /> <span className="text-xs font-bold hidden sm:inline">Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollableHorizontalWithArrows>
                    </div>
                  ));
                })()}
              </div>
            </ScrollableWithArrows>
          </div>
        )}
      </div>
    </div>
  );
}

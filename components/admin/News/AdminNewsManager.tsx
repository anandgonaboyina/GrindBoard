'use client';
import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Trash2, Edit2, Check, X, Calendar as CalendarIcon, Image as ImageIcon, Video, FileCode2, Loader2, Clock, UploadCloud, ArrowDownAZ, ArrowUpAZ, Search, Filter, LayoutGrid, List as ListIcon } from 'lucide-react';
import { getLocalDateString } from '@/utils/date';
import { getEmbedVideoUrl } from '@/components/NewsCardStack';
import ScrollableWithArrows from '@/components/ScrollableWithArrows';

export interface NewsPost {
  _id?: string;
  title: string;
  content: string;
  broadcastDate: string;
  media?: {
    imageUrl?: string;
    videoUrl?: string;
    svgUrl?: string;
  };
  cloudinaryPublicId?: string; // Tracks the asset for deletion
  createdAt?: number;
}

export default function AdminNewsManager() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<NewsPost>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // CMS View & Filter States
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'scheduled'>('all');
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'image' | 'video' | 'svg' | null>(null);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.news) setPosts(data.news);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- Secure Backend Cloudinary Upload Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'svg') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'video' && file.size > 50 * 1024 * 1024) { alert("Video must be smaller than 50MB"); return; } 
    else if (file.size > 10 * 1024 * 1024) { alert("File must be smaller than 10MB"); return; }

    setIsUploading(true);
    setUploadTarget(type);

    try {
      let finalFile = file;

      // Compress ONLY if it's an image and > 1MB
      if (type === 'image' && file.size > 1024 * 1024 && file.type.startsWith('image/')) {
        const compressedFile = await new Promise<File | null>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
              } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
              }
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);

              canvas.toBlob((blob) => {
                if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                else resolve(null);
              }, 'image/jpeg', 0.8);
            };
          };
        });
        if (compressedFile) finalFile = compressedFile;
      }

      const token = localStorage.getItem('dashboard_sync_token');

      // If replacing an existing uploaded file, delete the old one via API first
      const oldUrl = currentPost.media?.imageUrl || currentPost.media?.videoUrl || currentPost.media?.svgUrl;
      if (oldUrl && oldUrl.includes('res.cloudinary.com')) {
        try {
          const delFormData = new FormData();
          delFormData.append('action', 'delete');
          delFormData.append('oldUrl', oldUrl);
          await fetch('/api/upload/news', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: delFormData });
        } catch (err) { console.error("Failed to cleanup old media:", err); }
      }

      // Upload new file via your Next.js API
      const formData = new FormData();
      formData.append('file', finalFile);
      formData.append('action', 'upload');
      formData.append('folder', 'grindboard-News'); 

      const res = await fetch('/api/upload/news', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setCurrentPost(prev => ({
          ...prev,
          media: {
            ...prev.media,
            [type === 'image' ? 'imageUrl' : type === 'video' ? 'videoUrl' : 'svgUrl']: data.url,
            // Clear other media types to prevent conflicts
            ...(type === 'image' ? { videoUrl: '', svgUrl: '' } : type === 'video' ? { imageUrl: '', svgUrl: '' } : { imageUrl: '', videoUrl: '' })
          },
          cloudinaryPublicId: data.public_id || '' 
        }));
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading media");
    } finally {
      setIsUploading(false);
      setUploadTarget(null);
      if (e.target) e.target.value = ''; 
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(currentPost)
      });
      const data = await res.json();
      if (data.success) {
        await fetchNews();
        setIsEditing(false);
        setCurrentPost({});
      } else { alert("Failed to save: " + data.error); }
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleEdit = (post: NewsPost) => { setCurrentPost(post); setIsEditing(true); };

  const handleDelete = async (post: NewsPost) => {
    if (!post._id) return;
    if (confirm("Are you sure you want to delete this news post?")) {
      try {
        const token = localStorage.getItem('dashboard_sync_token');
        const queryParams = new URLSearchParams();
        if (post.cloudinaryPublicId) queryParams.append('public_id', post.cloudinaryPublicId);

        const res = await fetch(`/api/news/${post._id}?${queryParams.toString()}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setPosts(posts.filter(p => p._id !== post._id));
      } catch (e) { console.error(e); }
    }
  };

  const handleDeleteMultiple = async (ids: string[], promptText: string) => {
    if (ids.length === 0) return;
    if (confirm(`Are you sure you want to ${promptText}? (${ids.length} post${ids.length === 1 ? '' : 's'})`)) {
      setLoading(true);
      try {
        const token = localStorage.getItem('dashboard_sync_token');
        const deletions = ids.map(id => {
          const post = posts.find(p => p._id === id);
          const queryParams = new URLSearchParams();
          if (post?.cloudinaryPublicId) queryParams.append('public_id', post.cloudinaryPublicId);
          return fetch(`/api/news/${id}?${queryParams.toString()}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        });
        
        await Promise.all(deletions);
        setPosts(posts.filter(p => !ids.includes(p._id!)));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
  };

  const openNewPost = () => { setCurrentPost({ broadcastDate: getLocalDateString(), media: {} }); setIsEditing(true); };

  // --- Filtering & Sorting Logic ---
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const isFuture = new Date(post.broadcastDate).getTime() > Date.now();
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'published' && !isFuture) || (statusFilter === 'scheduled' && isFuture);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col min-w-0 h-full relative animate-in fade-in duration-300 min-h-[85vh] pb-6">

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/50 p-4 md:p-5 rounded-2xl border border-white/10 shrink-0 gap-4 backdrop-blur-md shadow-lg mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 shrink-0">
            <Newspaper className="text-blue-400 w-6 h-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-black text-white truncate">Broadcast Manager</h2>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Manage platform updates, feature drops, and announcements.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 shrink-0 w-full md:w-auto">
          {posts.length > 0 && (
            <button onClick={() => handleDeleteMultiple(posts.map(p => p._id!), "delete ALL news posts forever")} className="px-3 md:px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs md:text-sm font-bold transition-colors border border-red-500/20 active:scale-95 flex-1 md:flex-none text-center">
              Clear All
            </button>
          )}
          <button onClick={openNewPost} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs md:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(37,99,235,0.4)] whitespace-nowrap flex-1 md:flex-none">
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Compose Broadcast</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Advanced CMS Controls Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-slate-900/40 p-2 md:p-3 rounded-2xl border border-white/10 shrink-0 gap-3 mb-6 shadow-sm">
        
        <div className="relative w-full lg:max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search headlines or content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
          <div className="flex items-center bg-black/40 rounded-xl border border-slate-700/50 p-1 shrink-0">
            {(['all', 'published', 'scheduled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${statusFilter === status ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1 shrink-0" />

          <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="p-2.5 bg-black/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700/50 transition-colors shrink-0" title="Sort by Date">
            {sortOrder === 'desc' ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />}
          </button>

          <div className="flex items-center bg-black/40 rounded-xl border border-slate-700/50 p-1 shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`} title="Grid View">
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`} title="List View">
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[95vh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0 bg-slate-900/80">
              <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/20 rounded-lg"><Edit2 className="text-blue-400 w-4 h-4" /></div>
                {currentPost._id ? 'Edit Broadcast' : 'Draft New Broadcast'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-6 p-5 md:p-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headline *</label>
                    <input type="text" value={currentPost.title || ''} onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })} className="bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm md:text-base text-white font-bold outline-none focus:border-blue-500 transition-all w-full placeholder:text-slate-600" placeholder="e.g., v3.0: The Performance Update" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><CalendarIcon size={12} /> Go-Live Date *</label>
                    <input type="date" value={currentPost.broadcastDate || ''} onChange={e => setCurrentPost({ ...currentPost, broadcastDate: e.target.value })} className="bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm md:text-base text-white font-medium outline-none focus:border-blue-500 transition-all w-full [color-scheme:dark]" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Body *</label>
                  <textarea value={currentPost.content || ''} onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })} className="bg-black/40 border border-slate-700 rounded-xl px-4 py-4 text-sm text-slate-300 outline-none focus:border-blue-500 transition-all min-h-[150px] flex-1 resize-y custom-scrollbar placeholder:text-slate-600 leading-relaxed font-medium" placeholder="Supports standard HTML (<b>, <a>, <ul>, etc...)" />
                </div>

                <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Media Attachments</h4>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Provide URL OR Upload directly</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl relative overflow-hidden group">
                      <div className="flex items-center gap-1.5 text-blue-400 font-black text-xs uppercase tracking-widest"><ImageIcon size={14} /> Image</div>
                      
                      <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Direct Link</label>
                        <input type="text" value={currentPost.media?.imageUrl || ''} onChange={e => setCurrentPost({ ...currentPost, media: { ...currentPost.media, imageUrl: e.target.value, videoUrl: '', svgUrl: '' } })} className="bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500" placeholder="https://..." />
                      </div>

                      <div className="flex items-center gap-2 w-full text-slate-600 text-[10px] font-bold uppercase z-10"><hr className="flex-1 border-slate-700" /> OR <hr className="flex-1 border-slate-700" /></div>

                      <label className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors z-10 ${isUploading && uploadTarget === 'image' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading && uploadTarget === 'image' ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                        {isUploading && uploadTarget === 'image' ? 'Uploading...' : 'Upload File'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} disabled={isUploading} />
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl relative overflow-hidden group">
                      <div className="flex items-center gap-1.5 text-purple-400 font-black text-xs uppercase tracking-widest"><Video size={14} /> Video</div>
                      
                      <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Direct Link</label>
                        <input type="text" value={currentPost.media?.videoUrl || ''} onChange={e => setCurrentPost({ ...currentPost, media: { ...currentPost.media, videoUrl: e.target.value, imageUrl: '', svgUrl: '' } })} className="bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500" placeholder="https://..." />
                      </div>

                      <div className="flex items-center gap-2 w-full text-slate-600 text-[10px] font-bold uppercase z-10"><hr className="flex-1 border-slate-700" /> OR <hr className="flex-1 border-slate-700" /></div>

                      <label className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors z-10 ${isUploading && uploadTarget === 'video' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading && uploadTarget === 'video' ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                        {isUploading && uploadTarget === 'video' ? 'Uploading...' : 'Upload File'}
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 shrink-0 bg-slate-900/80 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
              
              {/* THE AI COPYWRITER BUTTON */}
              <button 
                onClick={(e) => {
                  const titleText = currentPost.title ? `Title: ${currentPost.title}\n` : '';
                  const contentText = currentPost.content ? `Raw Content:\n${currentPost.content}\n\n` : '';
                  
                  const prompt = `You are an expert copywriter. Please rewrite and format the following news update for the Grindboard dashboard.\n\n` +
                    `1. Fix all grammar, spelling, and phrasing issues to make the English sound professional, clear, and engaging.\n` +
                    `2. Format the rewritten content using basic HTML tags (like <b> for bold emphasis, <ul>/<li> for lists, and <br/> or <p> for spacing) to make it highly readable and visually appealing.\n\n` +
                    `${titleText}${contentText}` +
                    `Return ONLY the final formatted HTML content. Do not wrap it in markdown code blocks (\`\`\`) and do not add any conversational filler.`;

                  navigator.clipboard.writeText(prompt);
                  
                  const btn = e.currentTarget;
                  const originalText = btn.innerHTML;
                  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span class="text-[10px] font-bold uppercase tracking-wider">Copied!</span>`;
                  setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 shadow-sm group"
                title="Copy prompt to fix grammar and format with HTML"
              >
                <FileCode2 size={14} className="group-hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider">AI Fix & Format</span>
              </button>

              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <button onClick={() => setIsEditing(false)} className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl font-bold transition-all text-sm">Cancel</button>
                <button onClick={handleSave} disabled={!currentPost.title || !currentPost.content || !currentPost.broadcastDate || saving || isUploading} className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(37,99,235,0.4)] text-sm">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Deploying...' : 'Deploy Broadcast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main List / Grid View Area */}
      <div className="w-full flex-1 flex flex-col relative min-h-[400px] md:min-h-[500px]">
        {loading ? (
          <div className="flex justify-center h-full items-center">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-slate-500 border-dashed h-full flex-1">
            <div className="p-5 bg-slate-800/50 rounded-full mb-4"><Newspaper size={32} className="opacity-50 text-slate-400" /></div>
            <p className="text-sm font-bold tracking-wide">No posts found matching your criteria.</p>
          </div>
        ) : (
          <div className="absolute inset-0">
            <ScrollableWithArrows className="h-full w-full custom-scrollbar pr-2 md:pr-4">
              <div className="flex flex-col gap-6 w-full pb-10">
                {(() => {
                  const grouped = filteredPosts.reduce((acc, post) => {
                    const d = post.broadcastDate;
                    if (!acc[d]) acc[d] = [];
                    acc[d].push(post);
                    return acc;
                  }, {} as Record<string, NewsPost[]>);

                  const sortedDates = Object.keys(grouped).sort((a, b) => {
                    return sortOrder === 'desc' 
                      ? new Date(b).getTime() - new Date(a).getTime()
                      : new Date(a).getTime() - new Date(b).getTime();
                  });

                  return sortedDates.map(date => {
                    const isFuture = new Date(date).getTime() > Date.now();
                    return (
                      <div key={date} className="flex flex-col rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden shadow-sm">
                        
                        <div className={`flex items-center justify-between px-4 md:px-5 py-3 border-b border-slate-800/80 sticky top-0 z-10 ${isFuture ? 'bg-amber-950/40 backdrop-blur-md' : 'bg-slate-900/80 backdrop-blur-md'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${isFuture ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                              {isFuture ? <Clock size={16} /> : <CalendarIcon size={16} />}
                            </div>
                            <h3 className="text-sm md:text-base font-black text-white tracking-wide">{date}</h3>
                            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:block">
                              {grouped[date].length} Post{grouped[date].length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <button onClick={() => handleDeleteMultiple(grouped[date].map(p => p._id!), `delete all posts for ${date}`)} className="text-[10px] text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/50 px-2.5 py-1.5 rounded-md transition-colors font-bold uppercase tracking-wider">
                            Delete Day
                          </button>
                        </div>

                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                            {grouped[date].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(post => (
                              <div key={post._id} className="flex flex-col rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800/60 transition-colors overflow-hidden group">
                                {(post.media?.imageUrl || post.media?.videoUrl || post.media?.svgUrl) && (
                                  <div className="w-full h-36 bg-black/60 border-b border-slate-700 shrink-0 overflow-hidden relative">
                                    {(() => {
                                      const videoSrc = post.media?.videoUrl || (post.media?.imageUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? post.media.imageUrl : null);
                                      if (videoSrc) {
                                        const parsed = getEmbedVideoUrl(videoSrc);
                                        if (parsed.type === 'iframe') return <iframe src={parsed.embedUrl} title={post.title} className="w-full h-full border-0 object-cover pointer-events-none" />;
                                        return <video src={parsed.embedUrl} muted playsInline className="w-full h-full object-cover" />;
                                      }
                                      if (post.media?.imageUrl) return <img src={post.media.imageUrl} alt={post.title} className="w-full h-full object-cover" />;
                                      if (post.media?.svgUrl) return <img src={post.media.svgUrl} alt={post.title} className="w-full h-full object-contain p-2" />;
                                      return null;
                                    })()}
                                  </div>
                                )}
                                <div className="p-4 flex flex-col flex-1">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="text-white font-black text-sm leading-tight line-clamp-2">{post.title}</h4>
                                    {isFuture && <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1.5 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-widest font-black shrink-0 mt-0.5">Sched</span>}
                                  </div>
                                  <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed mb-4 flex-1">{post.content.replace(/<[^>]*>?/gm, '')}</p>
                                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-700/50">
                                    <button onClick={() => handleEdit(post)} className="flex-1 py-1.5 bg-slate-700/30 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg flex items-center justify-center gap-1.5 border border-slate-700/50 transition-all">
                                      <Edit2 size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(post)} className="flex-1 py-1.5 bg-slate-700/30 hover:bg-red-500/20 hover:text-red-400 active:scale-95 text-slate-500 rounded-lg flex items-center justify-center gap-1.5 border border-slate-700/50 hover:border-red-500/30 transition-all">
                                      <Trash2 size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Drop</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                        <div className="flex flex-col divide-y divide-slate-800/60">
                          {grouped[date].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(post => (
                            <div key={post._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                              
                              {(post.media?.imageUrl || post.media?.videoUrl || post.media?.svgUrl) ? (
                                <div className="w-16 h-12 rounded-lg bg-black/50 border border-slate-700 overflow-hidden shrink-0 hidden sm:block">
                                  {post.media?.imageUrl ? <img src={post.media.imageUrl} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><Video size={16}/></div>}
                                </div>
                              ) : (
                                <div className="w-16 h-12 rounded-lg bg-slate-800/50 border border-slate-700/50 shrink-0 hidden sm:flex items-center justify-center">
                                  <FileCode2 size={16} className="text-slate-600" />
                                </div>
                              )}

                              <div className="flex flex-col min-w-0 flex-1 w-full sm:w-auto pr-4">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-white font-bold text-sm truncate">{post.title}</h4>
                                  {isFuture && <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1.5 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-widest font-black shrink-0">Scheduled</span>}
                                </div>
                                <p className="text-slate-400 text-xs truncate mt-0.5">{post.content.replace(/<[^>]*>?/gm, '')}</p>
                              </div>

                              <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0 w-full sm:w-auto">
                                <button onClick={() => handleEdit(post)} className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/50 flex items-center justify-center">
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                                </button>
                                <button onClick={() => handleDelete(post)} className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors border border-slate-700/50 hover:border-red-500/30 flex items-center justify-center">
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Drop</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </ScrollableWithArrows>
          </div>
        )}
      </div>
    </div>
  );
}
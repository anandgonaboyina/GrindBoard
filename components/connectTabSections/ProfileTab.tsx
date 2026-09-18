'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, ShieldAlert, Eye, EyeOff, Trash } from 'lucide-react';
import Link from 'next/link';

interface ProfileTabProps {
  username: string;
  handleLogout: () => void;
  setConfirmModal: (modal: any) => void;
  setSelectedImageOverlay: (overlay: any) => void;
}

export default function ProfileTab({ username, handleLogout, setConfirmModal, setSelectedImageOverlay }: ProfileTabProps) {
  const [alias, setAlias] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [profilePictureSuccess, setProfilePictureSuccess] = useState('');
  const [aliasLoading, setAliasLoading] = useState(false);
  const [aliasSuccess, setAliasSuccess] = useState('');
  
  // Danger Zone
  const [isAliasUnlocked, setIsAliasUnlocked] = useState(false);
  const [aliasPassword, setAliasPassword] = useState('');
  const [showAliasPassword, setShowAliasPassword] = useState(false);
  const [aliasUnlockLoading, setAliasUnlockLoading] = useState(false);
  const [aliasUnlockError, setAliasUnlockError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const cachedAlias = localStorage.getItem('dashboard_alias');
    const cachedPic = localStorage.getItem('dashboard_profile_picture');
    if (cachedAlias) setAlias(cachedAlias);
    if (cachedPic) setProfilePicture(cachedPic);

    try {
      const token = localStorage.getItem('dashboard_sync_token');
      const res = await fetch('/api/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const storedUsername = localStorage.getItem('dashboard_username');
        const me = data.users.find((u: any) => u.username === storedUsername);
        if (me) {
          if (me.alias) { setAlias(me.alias); localStorage.setItem('dashboard_alias', me.alias); }
          if (me.profilePicture) {
            setProfilePicture(me.profilePicture);
            localStorage.setItem('dashboard_profile_picture', me.profilePicture);
          } else {
            localStorage.removeItem('dashboard_profile_picture');
            setProfilePicture('');
          }
          if (me.isAdmin === true || me.isAdmin === "true") setIsAdminUser(true);
        }
      }
    } catch (err) {}
  };

  const updateProfilePicture = async (url: string) => {
    setProfilePictureLoading(true);
    setProfilePictureSuccess('');
    try {
      const token = localStorage.getItem('dashboard_sync_token');
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profilePicture: url })
      });
      if (res.ok) {
        setProfilePicture(url);
        url ? localStorage.setItem('dashboard_profile_picture', url) : localStorage.removeItem('dashboard_profile_picture');
        setProfilePictureSuccess('Saved!');
        setTimeout(() => setProfilePictureSuccess(''), 3000);
      }
    } catch (err) {}
    setProfilePictureLoading(false);
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setConfirmModal({
          isOpen: true, title: 'Account Deleted', message: 'Your account has been deleted successfully.', hideCancel: true, confirmText: 'Done', onConfirm: handleLogout
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-2.5 md:gap-3 animate-in fade-in slide-in-from-bottom-2">
      {/* Header Card */}
      <div className="flex items-center w-full gap-3 bg-gradient-to-r from-white/5 to-transparent p-2 rounded-2xl border border-white/10 shadow-sm">
        <div onClick={() => { if (profilePicture) setSelectedImageOverlay({ url: profilePicture, title: username }); }} className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold shadow-inner border-2 border-white/10 shrink-0 overflow-hidden ${profilePicture ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all' : ''}`}>
          {profilePicture ? <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" /> : username.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0 w-full">
          <h3 className="text-lg md:text-xl font-bold truncate w-full text-white/90 leading-tight">{username}</h3>
          <div className="flex items-center gap-1.5 mt-1 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
            <span className="text-[9px] md:text-[10px] text-green-400 font-bold tracking-wide uppercase">Sync Active</span>
          </div>
          <div className="flex gap-4 w-full mt-2 pb-1">
            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Sign Out', message: 'Are you sure you want to sign out?', isDestructive: true, onConfirm: handleLogout })} className="flex-1 p-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-colors border border-white/10 font-semibold text-[10px] md:text-xs">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-500/10 border border-white/60 text-white-200 text-[10px] leading-relaxed p-2.5 rounded-xl flex items-start gap-2 w-full shadow-sm">
        <ShieldAlert size={14} className="shrink-0 mt-0.5 text-red-400" />
        <p>Accounts inactive for 90 days are <strong className="text-red-400 font-bold">permanently deleted</strong>. Export your data regularly!</p>
      </div>

      {/* Avatar Settings */}
      <div className="bg-white/5 border border-white/10 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between w-full">
          <label className="text-[10px] md:text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-wider"><UserCircle className="text-blue-400 w-3.5 h-3.5" /> Avatar URL</label>
          {profilePictureSuccess && <span className="text-green-400 text-[10px] font-bold animate-pulse">{profilePictureSuccess}</span>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input type="url" placeholder="https://.../img.png" value={profilePicture} onChange={e => setProfilePicture(e.target.value)} className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors text-[10px] md:text-xs text-white/90 placeholder:text-white/30" />
          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => updateProfilePicture(profilePicture)} disabled={profilePictureLoading} className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold text-[10px] md:text-xs shadow-md">
              {profilePictureLoading ? '...' : 'Save'}
            </button>
            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Remove Avatar', message: 'Remove profile picture?', isDestructive: true, onConfirm: () => updateProfilePicture('') })} disabled={profilePictureLoading || !profilePicture} className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-lg transition-colors font-semibold text-[10px] md:text-xs disabled:opacity-50">
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Alias Settings */}
      <div className="bg-white/5 border border-white/10 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between w-full">
          <label className="text-[10px] md:text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-wider"><ShieldAlert className="text-purple-400 w-3.5 h-3.5" /> Anonymous Alias</label>
          {aliasSuccess && <span className="text-green-400 text-[10px] font-bold animate-pulse">{aliasSuccess}</span>}
        </div>
        <div className="flex gap-1.5 w-full mt-0.5">
          <input type="text" placeholder="Anonymous alias..." value={alias} onChange={e => setAlias(e.target.value)} className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-500 transition-colors text-[10px] md:text-xs text-white/90 placeholder:text-white/30" />
          <button onClick={async () => {
            setAliasLoading(true); setAliasSuccess('');
            const token = localStorage.getItem('dashboard_sync_token');
            const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ alias }) });
            if (res.ok) { setAliasSuccess('Saved!'); setTimeout(() => setAliasSuccess(''), 3000); }
            setAliasLoading(false);
          }} disabled={aliasLoading} className="px-4 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-semibold text-[10px] md:text-xs shadow-md shrink-0">
            {aliasLoading ? 'Wait' : 'Save'}
          </button>
        </div>
        <p className="text-white/40 text-[9px] leading-tight">Shown on the global leaderboard instead of your real username.</p>
      </div>

      {/* Danger Zone */}
      <div className="bg-white/5 border border-white/10 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between w-full">
          <label className="text-[10px] md:text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-wider"><ShieldAlert className={`${isAliasUnlocked ? "text-green-400" : "text-red-400"} w-3.5 h-3.5`} /> Danger Zone</label>
          {isAliasUnlocked && <button onClick={() => setIsAliasUnlocked(false)} className="text-[9px] text-white/40 hover:text-white transition-colors underline underline-offset-2 capitalize">Lock</button>}
        </div>
        {!isAliasUnlocked ? (
          <div className="flex flex-col gap-1.5 w-full">
            <p className="text-white/40 text-[9px] leading-tight">Enter your password to unlock account deletion.</p>
            <div className="flex gap-1.5 w-full mt-0.5 relative">
              <input type={showAliasPassword ? "text" : "password"} placeholder="Enter password..." value={aliasPassword} onChange={e => setAliasPassword(e.target.value)} className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 transition-colors text-[10px] md:text-xs text-white/90 pr-8" />
              <button type="button" onClick={() => setShowAliasPassword(!showAliasPassword)} className="absolute right-[85px] top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                {showAliasPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button onClick={async () => {
                setAliasUnlockLoading(true); setAliasUnlockError('');
                try {
                  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password: aliasPassword }) });
                  if (res.ok) { setIsAliasUnlocked(true); setAliasPassword(''); } else { setAliasUnlockError('Incorrect password'); }
                } catch (err) { setAliasUnlockError('Error'); } finally { setAliasUnlockLoading(false); }
              }} disabled={aliasUnlockLoading || !aliasPassword} className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors font-semibold text-[10px] md:text-xs shrink-0">
                {aliasUnlockLoading ? '...' : 'Unlock'}
              </button>
            </div>
            {aliasUnlockError && <p className="text-red-400 text-[9px] mt-0.5 font-medium">{aliasUnlockError}</p>}
          </div>
        ) : (
          <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Account', message: 'Are you sure you want to delete your account? This action cannot be undone.', isDestructive: true, requireText: 'DELETE', onConfirm: handleDeleteAccount })} className="w-full px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl transition-colors font-bold text-xs flex items-center justify-center gap-2 mt-1">
            <Trash size={14} /> Delete Account Permanently
          </button>
        )}
      </div>

      {isAdminUser && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 rounded-xl w-full flex flex-col gap-2 shadow-sm mt-2">
          <label className="text-[10px] md:text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider"><ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Admin Access</label>
          <Link href="/admin" className="w-full px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-center rounded-xl transition-all font-bold text-xs shadow-[0_0_15px_rgba(99,102,241,0.4)] mt-1">
            Open Admin Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
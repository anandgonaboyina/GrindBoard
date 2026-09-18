'use client';

import React, { useState } from 'react';
import { setAuthTransition } from '@/store/dashboardStore';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function AuthSection() {
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthLoading(true);

    if (authMode === 'forgot') {
      try {
        if (forgotStep === 'email') {
          const res = await fetch('/api/auth/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_otp', email: authEmail })
          });
          const data = await res.json();
          if (res.ok) {
            setAuthSuccessMsg('OTP sent to your email! (Check spam)');
            setForgotStep('reset');
          } else {
            setAuthError(data.error || 'Failed to send OTP');
          }
        } else {
          const res = await fetch('/api/auth/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset_password', email: authEmail, otp: authPin, newPassword: authPassword })
          });
          const data = await res.json();
          if (res.ok) {
            setAuthSuccessMsg('Password reset! Please login.');
            setAuthMode('login');
            setForgotStep('email');
            setAuthPin('');
            setAuthPassword('');
          } else {
            setAuthError(data.error || 'Password reset failed');
          }
        }
      } catch (err) {
        setAuthError('Network error');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    try {
      setAuthTransition(true);
      const bodyPayload = authMode === 'register'
        ? { username: authUsername, email: authEmail, password: authPassword }
        : { username: authUsername, password: authPassword };

      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('dashboard_sync_token', data.token);
        localStorage.setItem('dashboard_username', data.username);

        if (authMode === 'login') {
          localStorage.removeItem('dashboard-storage');
          localStorage.removeItem('dashboard_last_modified');
        }

        fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token, username: data.username })
        }).catch(console.error);

        window.location.reload();
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-h-[80vh] w-full max-w-sm mx-auto p-4 overflow-hidden ">
      <div className="bg-black/40 p-6 rounded-2xl border border-white/10 w-full text-center shadow-2xl backdrop-blur-md">
        <ShieldAlert className="mx-auto text-blue-400 w-10 h-10 mb-3" />
        <h3 className="text-xl font-bold mb-1">Cloud Sync & Connect</h3>
        <p className="text-white/60 mb-5 text-xs">Log in to backup data and connect.</p>

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {authMode === 'forgot' ? (
            <>
              {forgotStep === 'email' ? (
                <input type="email" placeholder="Enter email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm" />
              ) : (
                <>
                  <input type="text" placeholder="6-digit OTP" required value={authPin} onChange={e => setAuthPin(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors tracking-widest text-center text-sm" />
                  <div className="relative w-full">
                    <input type={showPassword ? "text" : "password"} placeholder="New Password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {authMode === 'register' && (
                <input type="email" placeholder="Email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm" />
              )}
              <input type="text" placeholder={authMode === 'login' ? "Username or Email" : "Username"} required value={authUsername} onChange={e => setAuthUsername(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm" />
              <div className="relative w-full">
                <input type={showPassword ? "text" : "password"} placeholder="Password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-colors text-sm pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </>
          )}

          {authError && <p className="text-red-400 text-xs">{authError}</p>}
          {authSuccessMsg && <p className="text-green-400 text-xs">{authSuccessMsg}</p>}

          <button type="submit" disabled={authLoading} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2 text-sm shadow-lg shadow-blue-500/20">
            {authLoading ? 'Wait...' : (authMode === 'login' ? 'Login' : 'Register')}
          </button>

          <div className="flex flex-col gap-2 mt-2">
            {authMode !== 'login' && (
              <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMsg(''); }} className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                Back to Login
              </button>
            )}
            {authMode === 'login' && (
              <>
                <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                  Need an account? Register
                </button>
                <button type="button" onClick={() => { setAuthMode('forgot'); setAuthError(''); }} className="text-white/40 hover:text-white/60 text-xs transition-colors">
                  Forgot Password?
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
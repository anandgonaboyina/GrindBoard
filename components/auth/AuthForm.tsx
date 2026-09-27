'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Loader2, Eye, EyeOff, KeyRound, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function AuthForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=register')) {
      setIsRegisterMode(true);
    }
  }, []);

  // --- MEGA CLEANUP FUNCTION ---
  // Safely wipes all Grindboard local data before logging in a new user
  const wipePreviousLocalData = () => {
    const keysToWipe = [
      'dashboard-storage',
      'dashboard_last_modified',
      'notes-storage',
      'settings-storage',
      'settings_offline_queue',
      'tasks-storage',
      'timer_last_active',
      'dashboard_token',
      'dashboard_sync_token',
      'dashboard_username',
      'dashboard_role',
      'demo_session_start',
    ];
    keysToWipe.forEach(key => localStorage.removeItem(key));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // ==========================================
      // FORGOT PASSWORD FLOW
      // ==========================================
      if (isForgotMode) {
        if (forgotStep === 1) {
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg(data.message);
            setForgotStep(2);
          } else {
            setError(data.error);
          }
        } else if (forgotStep === 2) {
          if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setIsLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
          }
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, resetCode, newPassword: password, confirmPassword })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg('Password successfully reset! You can now log in.');
            setForgotStep(1);
            setIsForgotMode(false);
            setPassword('');
            setConfirmPassword('');
            setResetCode('');
          } else {
            setError(data.error);
          }
        }
        setIsLoading(false);
        return;
      }

      // ==========================================
      // REGISTRATION FLOW
      // ==========================================
      if (isRegisterMode) {
        if (registerStep === 1) {
          const res = await fetch('/api/auth/register/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg(data.message);
            setRegisterStep(2);
          } else {
            setError(data.error);
          }
        } else if (registerStep === 2) {
          if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setIsLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
          }
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, confirmPassword, otp: resetCode })
          });
          const data = await res.json();
          if (res.ok && data.token) {
            setSuccessMsg('Registration successful! Logging you in...');
            setTimeout(() => {
              // PRE-LOGIN CLEANUP
              wipePreviousLocalData();
              localStorage.removeItem('grindboard_has_seen_onboarding');
              localStorage.setItem('dashboard_token', data.token);
              localStorage.setItem('dashboard_sync_token', data.token);
              localStorage.setItem('dashboard_username', data.username || username);
              window.location.href = '/dashboard';
            }, 1000);
          } else {
            setError(data.error || 'Registration failed');
          }
        }
      } 
      // ==========================================
      // STANDARD LOGIN FLOW
      // ==========================================
      else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          // PRE-LOGIN CLEANUP
          wipePreviousLocalData();

          localStorage.setItem('dashboard_token', data.token);
          localStorage.setItem('dashboard_sync_token', data.token);
          localStorage.setItem('dashboard_username', data.username || username);

          if (data.role === 'admin') {
            localStorage.setItem('dashboard_role', 'admin');
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          setError(data.error || 'Invalid credentials');
        }
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-2xl relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] group/form anim-slide-right delay-300">
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none" />

      <div className="flex flex-col items-center justify-center gap-1 mb-4 sm:mb-5 text-center relative z-10 mt-3 sm:mt-1">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-md transition-all duration-300">
          {isForgotMode ? 'Recover Account' : (isRegisterMode ? 'Create Account' : 'Welcome Back')}
        </h2>
        <p className="text-white/50 text-[10px] sm:text-xs font-medium">
          {isForgotMode ? "Reset your password to regain access." : (isRegisterMode ? "Register to securely sync your dashboard." : "Sign in to sync your dashboard data.")}
        </p>
      </div>

      {!isForgotMode && (
        <div className="flex bg-black/40 p-1 rounded-xl w-full mb-5 border border-white/5 relative z-10 shadow-inner">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all duration-300 ${!isRegisterMode ? 'bg-white/10 text-white shadow-md border border-white/10' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setError(''); setSuccessMsg(''); setRegisterStep(1); }}
            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all duration-300 ${isRegisterMode ? 'bg-white/10 text-white shadow-md border border-white/10' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          >
            Register
          </button>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-3 sm:gap-3.5 relative z-10">
        <div key={isRegisterMode ? `reg-${registerStep}` : isForgotMode ? `forgot-${forgotStep}` : 'login'} className="animate-form-enter flex flex-col gap-3 sm:gap-3.5">

          {(error || successMsg) && (
            <div className={`p-2.5 border text-[10px] sm:text-xs rounded-lg text-center font-bold shadow-sm animate-in zoom-in-95 ${successMsg ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
              {error || successMsg}
            </div>
          )}

          {isForgotMode && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left shadow-sm">
              <h3 className="text-xs sm:text-sm font-bold text-blue-300 flex items-center gap-1.5 mb-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Password Recovery
              </h3>
              <p className="text-[10px] sm:text-[11px] text-white/70 leading-relaxed font-medium">
                {forgotStep === 1
                  ? "Enter your registered username below. We'll send a secure 6-digit reset code to your linked email address."
                  : "Check your email inbox for the 6-digit code. Enter it below along with your new password to restore access."}
              </p>
            </div>
          )}

          {(!isRegisterMode || (isRegisterMode && registerStep === 1)) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">{isForgotMode ? 'Account Username' : 'Username'}</label>
              <div className="relative group/input">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`Enter your username ${isForgotMode ? "or registered Email" : ""}`}
                  className="w-full bg-black/40 border border-white/10 focus:bg-black/60 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/30 font-medium shadow-inner"
                  required
                  disabled={isForgotMode && forgotStep === 2}
                />
              </div>
            </div>
          )}

          {isRegisterMode && registerStep === 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative group/input">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-black/40 border border-white/10 focus:bg-black/60 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/30 font-medium shadow-inner"
                  required
                />
              </div>
            </div>
          )}

          {((isForgotMode && forgotStep === 2) || (isRegisterMode && registerStep === 2)) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">6-Digit Verification Code</label>
              <div className="relative group/input">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-black/40 border border-white/10 focus:bg-black/60 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/30 font-mono tracking-widest font-bold shadow-inner"
                  required
                />
              </div>
            </div>
          )}

          {(!isForgotMode || (isForgotMode && forgotStep === 2)) && (!isRegisterMode || (isRegisterMode && registerStep === 2)) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">{isForgotMode ? 'New Password' : 'Password'}</label>
              <div className="relative group/input">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isForgotMode ? 'Enter new password' : 'Enter your password'}
                  className="w-full bg-black/40 border border-white/10 focus:bg-black/60 rounded-xl py-2.5 sm:py-3 pl-10 pr-10 text-xs sm:text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/30 font-medium shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {!isRegisterMode && !isForgotMode && (
                <div className="flex justify-end px-1 mt-0.5">
                  <button type="button" onClick={() => { setIsForgotMode(true); setForgotStep(1); setError(''); setSuccessMsg(''); setUsername(''); }} className="text-[10px] sm:text-[11px] font-bold text-blue-400/80 hover:text-blue-300 transition-colors">
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {((isForgotMode && forgotStep === 2) || (isRegisterMode && registerStep === 2)) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">Confirm Password</label>
              <div className="relative group/input">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-black/40 border border-white/10 focus:bg-black/60 rounded-xl py-2.5 sm:py-3 pl-10 pr-10 text-xs sm:text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/30 font-medium shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 sm:py-3.5 disabled:opacity-50 text-white font-black tracking-wide rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] bg-blue-600/90 hover:bg-blue-500 border border-blue-500/50 shadow-blue-500/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegisterMode ? (registerStep === 1 ? 'Verify Email' : 'Complete Registration') : (isForgotMode ? (forgotStep === 1 ? 'Send Reset Code' : 'Update Password') : 'Secure Login'))}
          </button>

          {isForgotMode && (
            <div className="flex justify-center mt-1">
              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setError(''); setSuccessMsg(''); setForgotStep(1); setPassword(''); setResetCode(''); }}
                className="text-[10px] sm:text-xs font-bold text-white/50 hover:text-white transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </button>
            </div>
          )}

        </div>
      </form>
    </div>
  );
}
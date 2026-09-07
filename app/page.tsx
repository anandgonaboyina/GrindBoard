'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User as UserIcon, Loader2, Eye, EyeOff, BookOpen, ExternalLink, KeyRound, Mail, ArrowLeft } from 'lucide-react';

import FeatureCarousel from '@/components/FeatureCarousel';
import UserManualModal from '@/components/UserManualModal';

export default function CloudLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false); // Kept for logic compatibility, but removed from UI
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // --- NEW: Animated Business Taglines ---
  const taglines = [
    "The Ultimate Dashboard for Deep Work.",
    "Outwork Your Rivals in Real-Time.",
    "Take Absolute Control of Your Schedule.",
    "Manifest Your Biggest Ambitions.",
    "Your Personalized Productivity Hub."
  ];
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 3500); // Cycles every 3.5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    const syncToken = localStorage.getItem('dashboard_sync_token');
    const role = localStorage.getItem('dashboard_role');

    if (token && token !== 'null') {
      if (role === 'admin') {
        router.push('/admin');
      } else if (syncToken && syncToken !== 'null') {
        router.push('/dashboard');
      } else {
        localStorage.removeItem('dashboard_token');
        localStorage.removeItem('dashboard_role');
        localStorage.removeItem('dashboard_username');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
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
              localStorage.removeItem('dashboard-storage');
              localStorage.removeItem('dashboard_last_modified');
              localStorage.setItem('dashboard_token', data.token);
              localStorage.setItem('dashboard_sync_token', data.token);
              localStorage.setItem('dashboard_username', data.username || username);
              localStorage.removeItem('dashboard_role');
              window.location.href = '/dashboard';
            }, 1000);
          } else {
            setError(data.error || 'Registration failed');
          }
        }
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.removeItem('dashboard-storage');
          localStorage.removeItem('dashboard_last_modified');
          localStorage.setItem('dashboard_token', data.token);
          localStorage.setItem('dashboard_sync_token', data.token);
          localStorage.setItem('dashboard_username', data.username || username);

          if (data.role === 'admin') {
            localStorage.setItem('dashboard_role', 'admin');
            window.location.href = '/admin';
          } else {
            localStorage.removeItem('dashboard_role');
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
    <div className="min-h-[100dvh] text-white flex flex-col lg:flex-row items-center justify-center pt-16 sm:pt-20 lg:pt-0 pb-8 px-4 sm:px-6 lg:p-12 font-sans relative overflow-x-hidden overflow-y-auto lg:overflow-hidden gap-6 lg:gap-16 w-full">

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-blob {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(30px, -50px) scale(1.1) rotate(15deg); }
          66% { transform: translate(-40px, 40px) scale(0.9) rotate(-15deg); }
        }
        @keyframes bg-pan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes form-enter {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-bg-pan {
          background-size: 200% 200%;
          animation: bg-pan 20s ease infinite;
        }
        .animate-blob {
          animation: float-blob 20s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-blob-delayed {
          animation: float-blob 25s infinite cubic-bezier(0.4, 0, 0.2, 1) -10s;
        }
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 6s linear infinite;
        }
        .animate-form-enter {
          animation: form-enter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        `
      }} />

      {/* --- RESPONSIVE HIGHLY ANIMATED BACKGROUND --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-br from-[#050b14] via-[#0b1329] to-[#120822] animate-bg-pan">
        <div className="absolute top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/20 rounded-full blur-[100px] sm:blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-1/4 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/20 rounded-full blur-[100px] sm:blur-[120px] mix-blend-screen animate-blob-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]" />
      </div>

      {/* --- APP NAME & BRANDING HEADER --- */}
      <div className="fixed top-3 left-3 lg:absolute lg:top-8 lg:left-12 z-50 flex flex-row items-center gap-2 lg:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg lg:rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-16 lg:h-16 bg-black rounded-lg lg:rounded-2xl border border-white/20 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl">
            <img src="/icon.png" alt="Grind Board" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/icon-192x192.png' }} />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-[17px] sm:text-xl lg:text-4xl font-black tracking-tighter uppercase inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white animate-text-shimmer drop-shadow-lg leading-none">
            Grind Board
          </h1>
          <div className="hidden lg:flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1">
              <Shield className="w-3 h-3" /> AES-256 Cloud Sync
            </span>
          </div>
        </div>
        <div className="fixed top-4 md:top-6 right-2 md:right-8 flex items-center gap-1.5 text-xs md:text-xl font-bold text-rose-200 bg-rose-500/10 border border-rose-500/25 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md">
          <span>Made with</span>
          <span className="text-rose-500 animate-pulse text-sm">❤️</span>
          <span>by <strong className="text-white font-extrabold tracking-wide">Anand</strong></span>
        </div>
      </div>

      {/* Feature Carousel & Dynamic Taglines (Hero Section) */}
      <div className="w-full lg:w-1/2 max-w-full lg:max-w-xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col justify-center gap-1 shrink-0 mt-4 lg:mt-16 relative">

        <div className="w-full flex justify-center lg:justify-start h-8 sm:h-10 lg:h-16 mb-4 lg:mb-6 relative  text-center lg:text-left">
          <h2
            key={taglineIndex}
            className="absolute text-lg sm:text-2xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 animate-in slide-in-from-bottom-5 fade-in duration-500 w-full drop-shadow-md"
          >
            {taglines[taglineIndex]}
          </h2>
        </div>

        <FeatureCarousel />
      </div>

      {/* Form Container */}
      <div className="w-full max-w-[400px] bg-white/[0.02] border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-2xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700 shrink-0 mx-auto lg:mx-0 lg:mt-16 group/form">

        {/* Form Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center gap-1 mb-4 sm:mb-5 text-center relative z-10 mt-3 sm:mt-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-md transition-all duration-300">
            {isForgotMode ? 'Recover Account' : (isRegisterMode ? 'Create Account' : 'Welcome Back')}
          </h2>
          <p className="text-white/50 text-[10px] sm:text-xs font-medium">
            {isForgotMode ? "Reset your password to regain access." : (isRegisterMode ? "Register to securely sync your dashboard." : "Sign in to sync your dashboard data.")}
          </p>
        </div>

        {/* Toggle Buttons (Login / Register) */}
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

          {/* Animated wrapper for form fields switching */}
          <div key={isRegisterMode ? `reg-${registerStep}` : isForgotMode ? `forgot-${forgotStep}` : 'login'} className="animate-form-enter flex flex-col gap-3 sm:gap-3.5">

            {(error || successMsg) && (
              <div className={`p-2.5 border text-[10px] sm:text-xs rounded-lg text-center font-bold shadow-sm animate-in zoom-in-95 ${successMsg ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                {error || successMsg}
              </div>
            )}

            {/* --- FORGOT PASSWORD INFO BANNER --- */}
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

                {/* Forgot Password Link strictly in Login View under password */}
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

            {/* Back to login button inside Forgot Mode */}
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
    </div>
  );
}
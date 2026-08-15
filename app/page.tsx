'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User as UserIcon, Loader2, Eye, EyeOff, Target, Calendar, ListTodo, Cloud, Trophy, Pin } from 'lucide-react';

import FeatureCarousel from '@/components/FeatureCarousel';
import UserManualModal from '@/components/UserManualModal';
import { BookOpen } from 'lucide-react';



export default function CloudLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const router = useRouter();

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
          if (isAdminMode && data.role !== 'admin') {
            setError('Access Denied: Account is not an administrator.');
            return;
          }
          if (!isAdminMode && data.role === 'admin') {
            setError('Please switch to the Admin Panel tab to log in.');
            return;
          }

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
    <div className="min-h-[100dvh] bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white flex flex-col lg:flex-row items-center justify-center pt-8 sm:pt-12 lg:pt-0 pb-12 px-4 sm:px-6 lg:p-12 font-sans relative overflow-x-hidden overflow-y-auto lg:overflow-hidden gap-8 lg:gap-16 w-full">

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-pink-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none z-0"></div>

      {/* Feature Carousel (Hero Section) */}
      {!isAdminMode && (
        <div className="w-full lg:w-1/2 max-w-full -mt-4 lg:max-w-xl z-10 animate-slide-up duration-700 flex flex-col justify-center shrink-0">
          <FeatureCarousel />
        </div>
      )}

      {/* Form Container */}
      <div className={`w-full max-w-md bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-8 backdrop-blur-xl relative z-10 shadow-2xl animate-zoom-in shrink-0 mx-auto lg:mx-0`}>

        <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-6 text-center">
          <div className="animate-slide-up delay-300">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{isAdminMode ? 'Admin Access' : (isRegisterMode ? 'Create Account' : (isForgotMode ? 'Reset Password' : 'Grind Board'))}</h1>
            </div>
            <p className="text-white/70 text-xs sm:text-sm mt-1">
              {isAdminMode ? 'Sign in to access the Global Admin Panel.' : (isRegisterMode ? 'Register to sync your dashboard data.' : (isForgotMode ? 'Recover your account access.' : 'Sign in to sync your dashboard data.'))}
            </p>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 text-center animate-slide-up delay-300">
          <button
            onClick={() => setIsUserManualOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 hover:text-white transition-all text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          >
            <BookOpen className="w-4 h-3 text-blue-400" /> New here? View User Manual
          </button>
        </div>

        <div className="flex bg-black/30 p-1 rounded-xl w-full mb-4 sm:mb-6 border border-white/10 animate-slide-up delay-500">
          <button
            type="button"
            onClick={() => { setIsAdminMode(false); setIsRegisterMode(false); setIsForgotMode(false); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${!isAdminMode && !isRegisterMode && !isForgotMode ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/90'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsAdminMode(false); setIsRegisterMode(true); setIsForgotMode(false); setError(''); setSuccessMsg(''); setRegisterStep(1); }}
            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${!isAdminMode && isRegisterMode ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/90'}`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setIsAdminMode(true); setIsRegisterMode(false); setIsForgotMode(false); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${isAdminMode ? 'bg-red-500/40 text-white shadow-sm' : 'text-white/50 hover:text-white/90'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-2 animate-slide-up delay-700">
          {(error || successMsg) && (
            <div className={`p-2 sm:p-3 border text-xs sm:text-sm rounded-xl text-center ${successMsg ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' : 'bg-red-500/20 border-red-500/30 text-red-100'}`}>
              {error || successMsg}
            </div>
          )}

          {(!isRegisterMode || (isRegisterMode && registerStep === 1)) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs sm:text-sm font-medium text-white/80 ml-1">{isForgotMode || (!isRegisterMode && !isAdminMode) ? 'Username or Email' : 'Username'}</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isForgotMode || (!isRegisterMode && !isAdminMode) ? "Enter your username or email" : "Enter your username"}
                  className="w-full bg-black/20 border border-white/20 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm outline-none focus:border-white/50 transition-colors placeholder:text-white/40"
                  required
                  disabled={isForgotMode && forgotStep === 2}
                />
              </div>
            </div>
          )}

          {isRegisterMode && !isAdminMode && registerStep === 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs sm:text-sm font-medium text-white/80 ml-1">Email</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-black/20 border border-white/20 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm outline-none focus:border-white/50 transition-colors placeholder:text-white/40"
                  required
                />
              </div>
            </div>
          )}

          {((isForgotMode && forgotStep === 2) || (isRegisterMode && registerStep === 2)) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs sm:text-sm font-medium text-white/80 ml-1">6-Digit Verification Code</label>
              <div className="relative">
                <Lock className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter code from email"
                  className="w-full bg-black/20 border border-white/20 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm outline-none focus:border-white/50 transition-colors placeholder:text-white/40 font-mono tracking-widest"
                  required
                />
              </div>
            </div>
          )}

          {(!isForgotMode || (isForgotMode && forgotStep === 2)) && (!isRegisterMode || (isRegisterMode && registerStep === 2)) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs sm:text-sm font-medium text-white/80 ml-1">{isForgotMode ? 'New Password' : 'Password'}</label>
              <div className="relative">
                <Lock className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isForgotMode ? 'Enter new password' : 'Enter your password'}
                  className="w-full bg-black/20 border border-white/20 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-11 pr-10 sm:pr-12 text-sm outline-none focus:border-white/50 transition-colors placeholder:text-white/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {((isForgotMode && forgotStep === 2) || (isRegisterMode && registerStep === 2)) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs sm:text-sm font-medium text-white/80 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-black/20 border border-white/20 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-11 pr-10 sm:pr-12 text-sm outline-none focus:border-white/50 transition-colors placeholder:text-white/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 py-3 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${isAdminMode ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'}`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAdminMode ? 'Login as Admin' : (isRegisterMode ? (registerStep === 1 ? 'Verify Email' : 'Complete Registration') : (isForgotMode ? (forgotStep === 1 ? 'Send Reset Code' : 'Update Password') : 'Secure Login')))}
          </button>

          {!isAdminMode && !isRegisterMode && !isForgotMode && (
            <div className="flex justify-center mt-1">
              <button type="button" onClick={() => { setIsForgotMode(true); setForgotStep(1); setError(''); setSuccessMsg(''); setUsername(''); }} className="text-xs text-white/60 hover:text-white transition-colors">
                Forgot your password?
              </button>
            </div>
          )}
          {isForgotMode && (
            <div className="flex justify-center mt-1">
              <button type="button" onClick={() => { setIsForgotMode(false); setError(''); setSuccessMsg(''); setForgotStep(1); setPassword(''); setResetCode(''); }} className="text-xs text-white/60 hover:text-white transition-colors">
                Back to Login
              </button>
            </div>
          )}
        </form>

      </div>

      <UserManualModal isOpen={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} />
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ChevronDown, Maximize, Minimize, X } from 'lucide-react';

import FeatureCarousel from '@/components/landing/FeatureCarousel';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import ConfirmationModal from '@/components/ConfirmationModal';
import AuthForm from '@/components/auth/AuthForm'; // <-- Our newly extracted component
import { useIsMobile } from '@/hooks';

export default function CloudLogin() {
  const router = useRouter();
  const isMobileView = useIsMobile();

  const [isLoading, setIsLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoAuthData, setDemoAuthData] = useState<{token: string, username: string} | null>(null);

  // -- Video Expand State & Hydration Fix ---
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false); 

  // --- Animated Business Taglines ---
  const taglines = [
    "The Ultimate Dashboard for Deep Work.",
    "Outwork Your Rivals in Real-Time.",
    "Take Absolute Control of Your Schedule.",
    "Chase Yourself Every Day and Own Your Pace.",
    "Crush Your Daily Rhythm and Outwork Yesterday.",
    "Master Your Focus, Month by Month, Day by Day.",
    "The Ultimate Engine to Measure and Beat Your Best Self.",
    "Build Relentless Discipline and Dominate Your Schedule.",
    "Your Personalized Productivity Hub.",
    "Manifest Your Biggest Ambitions."
  ];

  const [taglineIndex, setTaglineIndex] = useState(0);

  // Prevent background scrolling when video is expanded
  useEffect(() => {
    setIsMounted(true);
    if (isVideoExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isVideoExpanded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [taglines.length]);

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

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay blocked or failed:", err);
      });
    }
  }, [isMounted]);

  const handleDemoLogin = async () => {
    setShowDemoModal(true);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDemo: true })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        setDemoAuthData({ token: data.token, username: data.username });
      } else {
        setShowDemoModal(false);
      }
    } catch (err) {
      setShowDemoModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="text-white font-sans relative w-full h-[100dvh] overflow-x-hidden overflow-y-auto custom-scrollbar">

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
        @keyframes slide-in-left {
          0% { opacity: 0; transform: translateX(-60px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          0% { opacity: 0; transform: translateX(60px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-down {
          0% { opacity: 0; transform: translateY(-60px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes form-enter {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        .animate-bg-pan { background-size: 200% 200%; animation: bg-pan 20s ease infinite; }
        .animate-blob { animation: float-blob 20s infinite cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-blob-delayed { animation: float-blob 25s infinite cubic-bezier(0.4, 0, 0.2, 1) -10s; }
        .animate-text-shimmer { background-size: 200% auto; animation: text-shimmer 6s linear infinite; }
        .animate-form-enter { animation: form-enter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .anim-slide-left { animation: slide-in-left 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .anim-slide-right { animation: slide-in-right 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .anim-slide-down { animation: slide-in-down 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        `
      }} />

      {/* --- RESPONSIVE HIGHLY ANIMATED BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-[#050b14] via-[#0b1329] to-[#120822] animate-bg-pan">
        <div className="absolute top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/20 rounded-full blur-[100px] sm:blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-1/4 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/20 rounded-full blur-[100px] sm:blur-[120px] mix-blend-screen animate-blob-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]" />
      </div>

      {/* --- FIXED BRANDING HEADER --- */}
      <div className="fixed top-3 left-3 lg:top-8 lg:left-8 z-50 flex flex-row items-center gap-2 lg:gap-4 anim-slide-down delay-100 mix-blend-plus-lighter pointer-events-none">
        <div className="relative group pointer-events-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg lg:rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-16 lg:h-16 bg-black rounded-lg lg:rounded-2xl border border-white/20 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl">
            <img src="/icon.png" alt="Grind Board" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/icon-192x192.png' }} />
          </div>
        </div>
        <div>
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
        </div>
      </div>

      <div className="fixed top-4 md:top-6 right-2 anim-slide-right delay-100 flex items-center gap-1.5 text-xs md:text-xl font-bold text-rose-200 bg-rose-500/10 border border-rose-500/25 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md z-50 pointer-events-none">
        <span>Made with</span>
        <span className="text-rose-500 animate-pulse text-sm">❤️</span>
        <span>by <strong className="text-white font-extrabold tracking-wide">Anand</strong></span>
      </div>
      {/* SECTION 1: HERO LOGIN / REGISTER */}
      <section className="min-h-[80dvh] md:min-h-[100dvh] flex flex-col lg:flex-row items-center justify-center pt-20 sm:pt-24 lg:pt-2 pb-12 md:pb-20 px-4 sm:px-6 lg:px-24 relative z-10 gap-4 md:gap-8 w-full">
        
        {/* Feature Carousel & Dynamic Taglines */}
        <div className="w-full lg:w-1/2 max-w-full lg:max-w-xl flex flex-col justify-center gap-1 shrink-0 relative anim-slide-left delay-200 order-1 lg:order-1 z-20">
          <div className="w-full flex justify-center lg:justify-start h-8 sm:h-10 lg:h-16 mb-4 lg:mb-6 relative text-center lg:text-left">
            <h2
              key={taglineIndex}
              className="absolute text-lg sm:text-2xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 animate-in slide-in-from-right-8 fade-in duration-500 w-full drop-shadow-md"
            >
              {taglines[taglineIndex]}
            </h2>
          </div>
          {isMobileView || <FeatureCarousel />}
        </div>

        {/* Form and Demo Button Wrapper */}
        <div className="flex flex-col gap-3 w-full max-w-[400px] shrink-0 mx-auto lg:mx-0 z-20 order-2 lg:order-2">
          
          {/*  Completely Replaced with our extracted AuthForm component */}
          <AuthForm />

          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-3 sm:py-3.5 rounded-2xl font-black text-sm tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 border border-emerald-400/50 anim-slide-up delay-400"
          >
            <Shield className="w-5 h-5" /> Explore Demo
          </button>
        </div>

        {/*  Scroll Indicator Hint */}
        <div className=" flex absolute bottom-1 md:bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1 animate-bounce text-white/40 hover:text-white transition-colors cursor-pointer"
             onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className="text-[10px] font-bold uppercase tracking-widest sm:block">Scroll for Features</span>
          <ChevronDown className="w-5 h-5" />
        </div>

      </section>

      {/* --- INTRO VIDEO (Click to expand overlay) --- */}
      <div
      id={isMobileView ? "features-section" : ""} 
      className={`
        transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${isVideoExpanded 
          ? 'fixed inset-0 z-[9999] bg-[#050b14]/95 backdrop-blur-2xl p-4 md:p-6 flex flex-col items-center justify-center m-0 rounded-none' 
          : 'w-full max-w-[400px] mx-auto lg:fixed lg:bottom-8 lg:left-6 lg:w-[320px] lg:m-0 z-40 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] anim-slide-left delay-500 mt-4 mb-10 lg:mt-0 order-3 lg:order-none'
        }
      `}>
        
        {isVideoExpanded && (
          <button 
            onClick={() => setIsVideoExpanded(false)} 
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all z-[10000]"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className={`flex flex-col gap-1.5 px-1 transition-all duration-700 ${isVideoExpanded ? 'mb-6 text-center items-center scale-110' : 'mb-2'}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Grindboard Mobile Intro
            </h3>
          </div>
          <p className="text-[10px] text-white/50 font-medium">
            See our seamless mobile web app experience in action.
          </p>
        </div>
        
        <div 
          onClick={() => setIsVideoExpanded(!isVideoExpanded)}
          className={`overflow-hidden border border-white/5 relative bg-black/50 shadow-inner group cursor-pointer flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] w-full
            ${isVideoExpanded ? 'h-full max-h-[85vh] rounded-3xl' : 'aspect-video rounded-2xl'}
          `}
        >
          {isMounted && (
            <video 
            ref={videoRef}
              src="/branding/grindboard-mobile-app-promo.mp4" 
              preload="auto"
              autoPlay 
              loop 
              muted 
              playsInline
              controls={isVideoExpanded}
              className={`w-full h-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isVideoExpanded ? 'object-contain' : 'object-cover'}`}
            />
          )}
          
          <div className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/90 rounded-xl text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xl">
            {isVideoExpanded ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </div>
        </div>
      </div>
      { isMobileView &&
        <div className="relative z-10 py-6">
            <FeatureCarousel />
        </div>
      }
      {/* ========================================================================= */}
      {/* SECTION 2: NEW FEATURE SHOWCASE COMPONENT */}
      {/* ========================================================================= */}
      <section id={isMobileView ? "": "features-section"} className="w-full relative z-10 bg-black/20 border-t border-white/5 backdrop-blur-md">
        <FeatureShowcase />
      </section>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDemoModal}
        onClose={() => 
        {
          // 1. Define all keys your app uses
          const myAppKeys = [
            'theme',
            'user_session',
            'userSettings',
            'dashboardLayout'
          ];
          // 2. Loop and remove only your app's keys
          myAppKeys.forEach(key => localStorage.removeItem(key));
          setShowDemoModal(false)
        }
        }
        isLoading={isLoading}
        confirmDisabled={!demoAuthData}
        onConfirm={() => {
          if (demoAuthData) {
            const demoState = {
              state: {
                wallpaper: "https://static.toiimg.com/photo/imgsize-23456,msid-122440968,resizemode-4/naruto-vs-sasuke.jpg",
                bgIndex: 1,
                peekModeWallpaper: "https://i.pinimg.com/736x/07/bd/cb/07bdcb605727348d60ac19d4e8215e06.jpg",
                panicWallpaperSwitch: true,
                customDesktopWallpapers: [
                  "https://static.toiimg.com/photo/imgsize-23456,msid-122440968,resizemode-4/naruto-vs-sasuke.jpg",
                  "https://images4.alphacoders.com/140/1402795.mp4",
                  "https://images4.alphacoders.com/476/thumb-1920-47698.png",
                  "https://i.pinimg.com/736x/07/bd/cb/07bdcb605727348d60ac19d4e8215e06.jpg"
                ],
                activeDesktopCustomIndex: 0,
                isHidden: false,
                isPanicHidden: false
              },
              version: 0
            };
            localStorage.setItem('dashboard-storage', JSON.stringify(demoState));
            localStorage.removeItem('dashboard_last_modified');
            localStorage.setItem('dashboard_token', demoAuthData.token);
            localStorage.setItem('dashboard_sync_token', demoAuthData.token);
            localStorage.setItem('dashboard_username', demoAuthData.username);
            localStorage.setItem('demo_session_start', Date.now().toString());
            localStorage.removeItem('dashboard_role');
            window.location.href = '/dashboard';
          }
        }}
        title="Welcome to the Demo!"
        message={
          <div className="flex flex-col gap-4 text-sm mt-2">
            {isLoading ? (
              <p className="font-semibold text-emerald-500 animate-pulse">
                Provisioning your demo environment...
              </p>
            ) : (
              <p className="font-semibold text-emerald-500">
                Demo environment is ready!
              </p>
            )}
            <p className="opacity-90">
              You're about to explore the app using demo credentials. You will be automatically logged out when the <strong>25-minute</strong> demo period expires.
            </p>
            <div className="opacity-80">
              <p className="font-bold mb-2">Here is what you can do:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and complete tasks in the <strong>Task Manager</strong></li>
                <li>Write markdown-formatted notes in the <strong>Notes</strong> app</li>
                <li>Use the <strong>Timer</strong> and <strong>Stopwatch</strong> to track focus time</li>
                <li>Add countdowns and check deadlines</li>
                <li>Interact with the <strong>Groups</strong> and <strong>Global Chat</strong> (Connect Tab)</li>
                <li>Customize backgrounds and shortcuts in <strong>Settings</strong></li>
              </ul>
            </div>
            <p className="text-xs opacity-60 italic mt-2">
              Note: Changes made in demo mode will not be permanently saved.
            </p>
          </div>
        }
        hideCancel={true}
        confirmText={isLoading ? "Setting up..." : "Understood, Let's Go!"}
      />
    </main>
  );
}
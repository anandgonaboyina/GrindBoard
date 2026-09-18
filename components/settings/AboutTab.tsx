'use client';

import React, { useState, memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BadgeCheck, Send, Briefcase, Heart, Sparkles, Coffee } from 'lucide-react';

export default memo(function AboutTab() {
  const upiId = 'gonaboyinaanandkumar@ybl';
  const [donationAmount, setDonationAmount] = useState<number | null>(100);
  const [isWaving, setIsWaving] = useState(false);

  const handleWave = () => {
    if (isWaving) return;
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 2500);
  };

  return (
    <div className="flex flex-col gap-3 pb-2 w-full">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gradient-xy {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradient-xy 4s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes wave {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-8deg); }
          40% { transform: rotate(14deg); }
          50% { transform: rotate(-4deg); }
          60% { transform: rotate(10deg); }
          70% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wave {
          animation: wave 2.5s ease-in-out;
          transform-origin: 70% 70%;
        }
      `}} />

      {/* =========================================
          1. CREATOR PROFILE CARD
      ========================================= */}
      <div 
        onClick={handleWave}
        className="relative rounded-2xl p-[1px] overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.15)] cursor-pointer group/creator"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 animate-gradient-xy opacity-50 group-hover/creator:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-[#0f111a] h-full w-full rounded-2xl flex flex-col overflow-hidden z-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-0.5 z-20 shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            <span className="text-[7.5px] md:text-[8.5px] font-bold text-white/80 uppercase tracking-widest">Building Grind Board</span>
          </div>

          <div className="p-3 md:p-4 flex flex-col z-10">
            <div className="flex flex-row items-center gap-4 w-full">
              <div className="relative shrink-0 animate-float">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 opacity-50 blur-md group-hover/creator:opacity-80 transition-opacity duration-500" />
                <div className="w-20 h-20 md:w-28 md:h-28 relative rounded-full overflow-hidden border-2 border-slate-800 shadow-2xl bg-black">
                  <img
                    src="/branding/author.jpeg"
                    alt="Gonaboyina Anand kumar"
                    className="w-full h-full object-cover transform group-hover/creator:scale-110 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </div>

              <div className="flex flex-col flex-1 items-start text-left min-w-0 pt-1">
                <div className="flex items-center gap-1 w-full mb-0.5">
                  <h2 className="text-base md:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 break-words drop-shadow-sm">
                    Gonaboyina Anand
                  </h2>
                  <BadgeCheck className="text-blue-400 shrink-0 w-4 h-4 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                </div>
                <p className="text-blue-300 font-bold uppercase tracking-wider text-[8.5px] md:text-[10px] flex items-center gap-1">
                  Full Stack Developer
                </p>
              </div>
            </div>

            <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-sm relative">
              <div className={`absolute -top-3 -right-2 text-xl drop-shadow-lg transition-transform ${isWaving ? 'animate-wave inline-block' : 'opacity-0'}`}>
                👋
              </div>
              <p className="text-[9.5px] md:text-[11px] text-white/80 leading-snug break-words font-medium">
                <span className="text-white font-bold">Hey there!</span> I built this dashboard out of my own frustration with distractions. I wanted a clean, powerful workspace to lock in and get things done.
              </p>
              <p className="text-[8.5px] md:text-[9.5px] text-blue-300/80 mt-1.5 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Tap card to say hi!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 w-full mt-2.5">
              <a href="https://www.linkedin.com/in/anand-kumar-gonaboyina-b63946378" target="_blank" rel="noreferrer" 
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center justify-center gap-1.5 bg-[#0077b5]/10 border border-[#0077b5]/30 rounded-lg p-2 active:scale-[0.96] transition-transform duration-200 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0077b5] w-3.5 h-3.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                <span className="font-bold text-[9px] md:text-[10px] text-white/90">LinkedIn</span>
              </a>

              <a href="https://t.me/gAnandKumar" target="_blank" rel="noreferrer" 
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center justify-center gap-1.5 bg-[#0088cc]/10 border border-[#0088cc]/30 rounded-lg p-2 active:scale-[0.96] transition-transform duration-200 shadow-sm"
              >
                <Send className="text-[#0088cc] w-3.5 h-3.5" />
                <span className="font-bold text-[9px] md:text-[10px] text-white/90">Telegram</span>
              </a>

              <a href="https://gonaboyina-anand-kumar-portfolio.vercel.app/" target="_blank" rel="noreferrer" 
                onClick={(e) => e.stopPropagation()} 
                className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 active:scale-[0.96] transition-transform duration-200 shadow-sm"
              >
                <Briefcase className="text-emerald-400 w-3.5 h-3.5" />
                <span className="font-bold text-[9.5px] md:text-[11px] text-white/90 leading-tight">View My Portfolio Projects</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          2. HOLOGRAPHIC DONATION MODULE
      ========================================= */}
      <div className="relative rounded-2xl p-[1px] overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.15)] mt-1">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 animate-gradient-xy opacity-40" />
        
        <div className="relative bg-[#0f0a0f] h-full w-full rounded-2xl flex flex-col items-center p-4 z-10 overflow-hidden text-center">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-500/20 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-1.5 mb-1.5 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full shadow-inner">
            <Coffee className="w-3 h-3 text-pink-400" />
            <h3 className="text-[9px] font-black text-pink-300 uppercase tracking-widest">Support the App</h3>
          </div>
          
          <p className="text-[9px] md:text-[10px] text-white/70 max-w-xs mx-auto mb-3.5 leading-snug break-words font-medium">
            Built out of necessity, fueled by coffee. If this dashboard keeps you in the zone, consider dropping a tip to help me buy a short custom URL domain for the app and keep the updates flowing! <Heart className="w-2.5 h-2.5 inline text-pink-500 animate-pulse fill-pink-500" />
          </p>

          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {[
              { amt: 50, label: 'Coffee' }, { amt: 100, label: 'Lunch' },
              { amt: 200, label: 'Domain' }, { amt: 500, label: 'Sponsor' },
              { amt: null, label: 'Any' }
            ].map(d => (
              <button
                key={d.label}
                onClick={() => setDonationAmount(d.amt)}
                className={`relative px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black tracking-wide border transition-all active:scale-[0.92] overflow-hidden ${
                  donationAmount === d.amt 
                  ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] transform -translate-y-0.5' 
                  : 'bg-black/60 text-white/50 border-white/10 hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-white'
                }`}
              >
                {donationAmount === d.amt && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
                <span className="relative z-10">{d.amt ? `₹${d.amt}` : 'Any'} <span className="opacity-60 font-semibold hidden sm:inline ml-0.5">({d.label})</span></span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/60 p-3 rounded-xl border border-white/10 w-full sm:w-auto shadow-inner relative">
            <div className="relative p-2.5 bg-white rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.2)] overflow-hidden">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-4 border-l-4 border-pink-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-4 border-r-4 border-pink-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-4 border-l-4 border-pink-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-4 border-r-4 border-pink-500 rounded-br-xl" />
              
              <div className="absolute left-1 right-1 h-[2px] bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,1)] z-20 animate-scanline pointer-events-none" />
              
              <QRCodeSVG
                value={`upi://pay?pa=${upiId}&pn=Anand%20Kumar&cu=INR${donationAmount ? `&am=${donationAmount}` : ''}`}
                size={90}
                className="w-[90px] h-[90px] md:w-[110px] md:h-[110px] relative z-10"
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            
            <div className="flex flex-col text-center sm:text-left min-w-0 gap-1.5">
              <div>
                <p className="text-[8px] md:text-[9px] text-pink-400 uppercase font-black tracking-widest mb-0.5">Scan to Pay</p>
                <p className="font-black text-xl md:text-2xl text-white break-words drop-shadow-md leading-none">{donationAmount ? `₹${donationAmount}` : 'Any Amount'}</p>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent sm:via-white/20 sm:from-white/20 sm:to-transparent my-0.5 hidden sm:block" />
              <div className="min-w-0">
                <p className="text-[7.5px] md:text-[8px] text-white/40 uppercase font-bold tracking-widest mb-0.5">UPI ID</p>
                <p className="text-[9.5px] md:text-[10px] text-pink-300 font-mono font-bold select-all bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded inline-block shadow-inner w-fit mx-auto sm:mx-0">
                  {upiId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          3. CREDITS / TESTERS (Humble & Funny)
      ========================================= */}
      <div className="bg-[#050f0c] border border-emerald-500/20 rounded-3xl p-4 md:p-5 mt-1 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <BadgeCheck className="text-emerald-400 w-5 h-5 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <h3 className="text-sm md:text-base font-black text-white/90 uppercase tracking-wider">
            Credits & Bug Reporters
          </h3>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-sm relative overflow-hidden mb-2.5">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/20 blur-xl rounded-full" />
          <p className="text-[9px] md:text-[10px] text-emerald-100/90 font-medium leading-snug break-words relative z-10">
            This dashboard was built on 99% caffeine, 1% sheer panic, and countless late nights wondering why a single missing comma broke the entire universe.
          </p>
          <p className="text-[8.5px] md:text-[9.5px] text-emerald-300/80 leading-snug italic font-bold break-words relative z-10">
            "A massive shoutout to these two for happily reporting bugs and then peacefully going to sleep, leaving me to drive myself crazy trying to fix them at 4 AM!"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 relative z-10">
          {/* Sathish Kumar */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/40">
              <img src="/sathish.jpeg" alt="Sathish" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h4 className="text-[11px] font-black text-emerald-50 truncate">Sathish Kumar</h4>
              <p className="text-[7.5px] text-emerald-400/80 font-black uppercase tracking-wider mt-0.5">EEE • NIT Patna</p>
              <p className="text-[8.5px] text-white/50 mt-1 leading-tight line-clamp-2">   I am deeply grateful for your vital feedback and dedication as both a beta tester and an end-user.</p>
            </div>
          </div>

          {/* Jyothir Ganesh */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/40">
              <img src="/jyothir.png" alt="Jyothir" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h4 className="text-[11px] font-black text-emerald-50 truncate">Jyothir Ganesh</h4>
              <p className="text-[7.5px] text-teal-400/80 font-black uppercase tracking-wider mt-0.5">ECE • Vishnu Inst.</p>
              <p className="text-[8.5px] text-white/50 mt-1 leading-tight line-clamp-2">  My strongest pillar of support. Always provides grounded, factual advice.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
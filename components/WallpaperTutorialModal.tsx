'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Download, ExternalLink, Sparkles, MonitorPlay, CheckCircle2, Eye } from 'lucide-react';

export interface WallpaperTutorialStep {
  step: number;
  title: string;
  image: string;
  badge: string;
  description: string;
}

export const WALLPAPER_TUTORIAL_STEPS: WallpaperTutorialStep[] = [
  {
    step: 1,
    title: '1. Open Lively & Click "+"',
    image: '/wallpaper-tutorial/step-1.png',
    badge: 'Step 1 of 6',
    description: 'After installing Lively Wallpaper, click the "+" (Add Wallpaper) button. Note the Settings gear icon (⚙️) in the top right—you will configure crucial performance settings there in Step 4-6.',
  },
  {
    step: 2,
    title: '2. Enter GrindBoard URL',
    image: '/wallpaper-tutorial/step-2.png',
    badge: 'Step 2 of 6',
    description: 'Under "Enter URL", type or paste the GrindBoard web app URL (https://wallpaper-dashboard-cloud.vercel.app/) and click the right arrow (→) button to load.',
  },
  {
    step: 3,
    title: '3. Title & Save Wallpaper',
    image: '/wallpaper-tutorial/step-3.png',
    badge: 'Step 3 of 6',
    description: 'Enter any title for your live desktop background (e.g., "GrindBoard") and click OK to apply.',
  },
  {
    step: 4,
    title: '4. General Settings Setup',
    image: '/wallpaper-tutorial/step-4.png',
    badge: 'Step 4 of 6',
    description: 'In Lively Settings (⚙️) ➔ General: Ensure "Start with Windows" is toggled ON so GrindBoard launches automatically whenever your PC boots.',
  },
  {
    step: 5,
    title: '5. Performance Rules Setup',
    image: '/wallpaper-tutorial/step-5.png',
    badge: 'Step 5 of 6',
    description: 'In Lively Settings (⚙️) ➔ Performance: Match the pause rules shown in this screenshot for optimal CPU/GPU efficiency while gaming or studying.',
  },
  {
    step: 6,
    title: '6. Web Engine & Audio Settings',
    image: '/wallpaper-tutorial/step-6.png',
    badge: 'Step 6 of 6',
    description: 'In Lively Settings (⚙️) ➔ Wallpaper: Set Web Browser Engine to Edge (WebView2). Click ⚙️ next to WebView2 and set Cache Directory to Disk (prevents data resets). Untick "Play audio only when desktop is focused" so timer alarms ring anytime!',
  },
];

interface WallpaperTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}

export default function WallpaperTutorialModal({ isOpen, onClose, initialStep = 0 }: WallpaperTutorialModalProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(initialStep);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  const currentStepData = WALLPAPER_TUTORIAL_STEPS[activeStepIndex] || WALLPAPER_TUTORIAL_STEPS[0];
  const isFirst = activeStepIndex === 0;
  const isLast = activeStepIndex === WALLPAPER_TUTORIAL_STEPS.length - 1;

  const handlePrev = () => {
    if (!isFirst) setActiveStepIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (!isLast) setActiveStepIndex((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99995] flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="relative z-[100000] bg-[#10131d] border border-blue-500/30 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-[0_0_60px_rgba(59,130,246,0.25)] flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto custom-scrollbar text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  {currentStepData.badge}
                </span>
                <a
                  href="https://drive.google.com/file/d/1TJWAWPTtTbKNMaNVAwz2GwbSb04NO-J5/view?usp=drivesdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full transition-all"
                >
                  <Download size={11} /> Download Lively
                </a>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white truncate mt-0.5">
                {currentStepData.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-red-300 border border-white/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
            title="Close Tutorial"
          >
            <X size={18} />
          </button>
        </div>

        {/* Screenshot Viewport Container with Left/Right Arrows */}
        <div className="relative group bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center min-h-[220px] sm:min-h-[300px] shadow-inner">
          <img
            src={currentStepData.image}
            alt={currentStepData.title}
            className={`w-full h-auto max-h-[380px] object-contain transition-transform duration-300 ${isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={() => setIsZoomed(!isZoomed)}
          />

          {/* Zoom Hint Badge */}
          <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md border border-white/20 px-2 py-1 rounded-lg text-[10px] font-semibold text-white/80 flex items-center gap-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            <Eye size={11} className="text-blue-400" />
            <span>{isZoomed ? 'Click to Reset Zoom' : 'Click Image to Zoom'}</span>
          </div>

          {/* Left Arrow Navigation Button */}
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-2xl bg-black/75 hover:bg-blue-600 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              isFirst ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'opacity-90 hover:opacity-100 hover:scale-105'
            }`}
            title="Previous Step"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Right Arrow Navigation Button */}
          <button
            onClick={handleNext}
            disabled={isLast}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-2xl bg-black/75 hover:bg-blue-600 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              isLast ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'opacity-90 hover:opacity-100 hover:scale-105'
            }`}
            title="Next Step"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Step Description Callout Box */}
        <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl flex flex-col gap-2 text-xs text-white/90 leading-relaxed backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-300 text-xs sm:text-sm flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>Step Instructions:</span>
            </span>
            <span className="text-[11px] text-white/50 font-mono">
              Step {activeStepIndex + 1} of {WALLPAPER_TUTORIAL_STEPS.length}
            </span>
          </div>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Dots Navigation */}
        <div className="flex items-center justify-center gap-1.5 py-0.5">
          {WALLPAPER_TUTORIAL_STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStepIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeStepIndex
                  ? 'w-7 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]'
                  : 'w-2 bg-white/20 hover:bg-white/50'
              }`}
              title={`Jump to Step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
          <a
            href="https://drive.google.com/file/d/1TJWAWPTtTbKNMaNVAwz2GwbSb04NO-J5/view?usp=drivesdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Download Lively App</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-white/10 transition-all ${
                isFirst ? 'opacity-40 cursor-not-allowed text-white/40' : 'text-white hover:bg-white/10 cursor-pointer'
              }`}
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>

            {isLast ? (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Done</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

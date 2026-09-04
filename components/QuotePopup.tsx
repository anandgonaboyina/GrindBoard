'use client';
import { useEffect, useState } from 'react';
import { X, Quote as QuoteIcon, Copy, Check } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { fetchQuote } from '@/utils/quoteEngine';
import DraggableWidget from './DraggableWidget';
import Tooltip from './Tooltip';

export default function QuotePopup() {
  const { currentQuote, isQuotePopupOpen, hideQuotePopup, showQuotePopup, currentBgSrc, updateWidgetOffset, useCustomQuotes } = useDashboardStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isQuotePopupOpen) {
      fetchQuote().then(q => showQuotePopup(q));
    }
  }, [useCustomQuotes]);

  // Force clear any saved offsets for the quote so it snaps perfectly under the notch
  useEffect(() => {
    if (currentBgSrc) {
      updateWidgetOffset(currentBgSrc, 'quote', 0, 0);
    }
  }, [currentBgSrc, updateWidgetOffset]);

  const handleNextQuote = async () => {
    const q = await fetchQuote();
    showQuotePopup(q);
  };

  const handleCopy = (e: any) => {
    e.stopPropagation(); // Prevents the quote from changing when copying
    navigator.clipboard.writeText(`"${currentQuote?.text}" — ${currentQuote?.author || 'Unknown'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isQuotePopupOpen || !currentQuote) return null;

  return (
    <div className="fixed top-12 md:top-14 left-1/2 -translate-x-1/2 z-[1] w-full pointer-events-none px-2 animate-in slide-in-from-top-10 fade-in duration-500 flex justify-center">
      <div className="relative py-2.5 px-4 text-white group text-center drop-shadow-2xl bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl max-w-[90vw] mx-auto mb-4 md:mb-0">
        <div
          className="relative z-10 cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto inline-block w-full select-none"
          onClick={handleNextQuote}
        >
          {/* Compact, narrow, and thin text formatting */}
          <p className="text-xs sm:text-sm tracking-tighter md:tracking-widest leading-snug italic text-white break-words text-wrap">
            "{currentQuote.text}"
          </p>

          {/* Author and Copy Button Wrapper */}
          <div className="mt-1 flex items-center justify-center gap-1.5 opacity-70">
            <p className="text-[10px] sm:text-xs font-normal tracking-tight text-blue-300 uppercase break-words">
              — {currentQuote.author || 'Unknown'}
            </p>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-white/20 rounded-md transition-colors flex items-center justify-center"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-blue-300" />}
              <Tooltip text="Click to copy quote" position="left" />
            </button>
          </div>
        </div>
        <Tooltip text="Click for another quote" position="bottom" />
      </div>
    </div>
  );
}
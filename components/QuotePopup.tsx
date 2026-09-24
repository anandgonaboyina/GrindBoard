'use client';
import { useEffect, useState } from 'react';
import { X, Quote as QuoteIcon, Copy, Check } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { fetchQuote } from '@/utils/quoteEngine';
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
      {/* QUOTE PILL / MOBILE PARAGRAPH CARD */}
      <div className="relative py-2 px-3 sm:py-2 sm:px-5 text-white group text-center drop-shadow-2xl bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-full max-w-[92%] sm:max-w-fit mx-auto mb-4 md:mb-0 transition-all pointer-events-auto">
        <div
          className="relative z-10 cursor-pointer hover:opacity-90 transition-opacity flex flex-col items-center justify-center w-full select-none"
          onClick={handleNextQuote}
        >
          {/* Quote Text - Added drop-shadow and font-medium for visibility against transparent bg */}
          <p className="text-[11px] sm:text-sm tracking-tighter md:tracking-widest leading-snug italic text-white font-medium drop-shadow-md break-words whitespace-normal max-w-full sm:max-w-[500px] md:max-w-[700px]">
            "{currentQuote.text}"
          </p>

          {/* Author and Copy Button Wrapper */}
          <div className="mt-1 flex items-center justify-center gap-1.5 opacity-90">
            <span className="text-[10px] sm:text-xs font-normal tracking-tight text-blue-300 uppercase break-words drop-shadow-md">
              — {currentQuote.author || 'Unknown'}
            </span>
            
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-white/20 rounded-md transition-colors flex items-center justify-center"
              title="Copy quote"
            >
              {copied ? <Check size={12} className="text-green-400 drop-shadow-md" /> : <Copy size={12} className="text-blue-300 drop-shadow-md" />}
            </button>
          </div>
        </div>
        
        <Tooltip text="Click for another quote" position="bottom" />
      </div>
    </div>
  );
}
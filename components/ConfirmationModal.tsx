"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val?: string) => void;
  onCancel?: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requireText?: string;
  isPrompt?: boolean;
  promptPlaceholder?: string;
  hideCancel?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  requireText,
  isPrompt = false,
  promptPlaceholder = "Enter text...",
  onCancel,
  hideCancel = false,
}: ConfirmationModalProps) {
  const theme = useDashboardStore((state) => state.theme);
  const [inputText, setInputText] = useState("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setInputText("");
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isConfirmed = requireText 
    ? inputText === requireText 
    : (isPrompt ? inputText.trim().length > 0 : true);

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm(isPrompt ? inputText : undefined);
      onClose();
    }
  };

  const isDark = theme === "dark";

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (onCancel) onCancel();
          onClose();
        }}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 ${
          isDark 
            ? "bg-black/60 border-white/10 shadow-black/50" 
            : "bg-white/70 border-white/40 shadow-xl"
        } backdrop-blur-xl`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-white/10" : "border-black/5"}`}>
          <div className="flex items-center gap-2">
            {isDestructive && <AlertTriangle className="w-5 h-5 text-red-500" />}
            <h3 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-800"}`}>
              {title}
            </h3>
          </div>
          <button 
            onClick={() => {
              if (onCancel) onCancel();
              onClose();
            }}
            className={`p-1 rounded-full transition-colors ${
              isDark 
                ? "text-white/50 hover:bg-white/10 hover:text-white" 
                : "text-slate-500 hover:bg-black/5 hover:text-slate-800"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`p-4 ${isDark ? "text-white/80" : "text-slate-600"} text-sm leading-relaxed`}>
          {message}

          {requireText && !isPrompt && (
            <div className="mt-4">
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                Please type <strong className={isDark ? "text-white" : "text-slate-800"}>{requireText}</strong> to confirm.
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={requireText}
                className={`w-full px-3 py-2 rounded-lg outline-none transition-colors border ${
                  isDark 
                    ? "bg-black/40 border-white/10 focus:border-blue-500/50 text-white placeholder:text-white/30" 
                    : "bg-white/50 border-slate-200 focus:border-blue-400 text-slate-800 placeholder:text-slate-400"
                }`}
              />
            </div>
          )}

          {isPrompt && (
            <div className="mt-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={promptPlaceholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isConfirmed) {
                    handleConfirm();
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg outline-none transition-colors border ${
                  isDark 
                    ? "bg-black/40 border-white/10 focus:border-blue-500/50 text-white placeholder:text-white/30" 
                    : "bg-white/50 border-slate-200 focus:border-blue-400 text-slate-800 placeholder:text-slate-400"
                }`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 p-4 pt-2`}>
          {!hideCancel && (
            <button
              onClick={() => {
                if (onCancel) onCancel();
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isDark 
                  ? "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white" 
                  : "bg-black/5 hover:bg-black/10 text-slate-600 hover:text-slate-800"
              }`}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center justify-center ${
              !isConfirmed 
                ? (isDark ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-black/5 text-slate-400 cursor-not-allowed")
                : isDestructive
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

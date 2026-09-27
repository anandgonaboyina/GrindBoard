"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val?: string) => void | Promise<void>;
  onCancel?: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requireText?: string;
  isPrompt?: boolean;
  promptPlaceholder?: string;
  inputType?: string;
  inputFooter?: React.ReactNode;
  hideCancel?: boolean;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  closeOnConfirm?: boolean; // <-- ADDED: Allows parent to prevent auto-close
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
  inputType = "text",
  inputFooter,
  onCancel,
  hideCancel = false,
  isLoading = false,
  confirmDisabled = false,
  closeOnConfirm = true, // <-- Defaults to true for old modals
}: ConfirmationModalProps) {
  const theme = useDashboardStore((state) => state.theme);
  const [inputText, setInputText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) setInputText("");
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isConfirmed = requireText
    ? inputText === requireText
    : (isPrompt ? inputText.trim().length > 0 : true);

  const handleConfirm = async () => {
    // Prevent triggering if already loading
    if (isConfirmed && !isLoading && !confirmDisabled) {
      try {
        const result = onConfirm(isPrompt ? inputText : undefined);
        if (result instanceof Promise) {
          await result;
        }
        // Only auto-close if the parent didn't tell us to wait
        if (closeOnConfirm) {
          onClose();
        }
      } catch (error) {
        // If the promise rejects (like a wrong password), stay open!
      }
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Don't allow closing while verifying
    onCancel?.();
    onClose();
  };

  const isDark = theme === "dark";
  const needsInput = requireText || isPrompt;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${isLoading ? 'cursor-not-allowed' : ''}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl ${isDark ? "bg-black/60 border-white/10 shadow-black/50" : "bg-white/70 border-white/40 shadow-xl"
          }`}
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
            onClick={handleClose}
            disabled={isLoading}
            className={`p-1 rounded-full transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-black/5 hover:text-slate-800"
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`p-4 ${isDark ? "text-white/80" : "text-slate-600"} text-sm leading-relaxed`}>
          {message}

          {needsInput && (
            <div className="mt-4">
              {requireText && !isPrompt && (
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                  Please type <strong className={isDark ? "text-white" : "text-slate-800"}>{requireText}</strong> to confirm.
                </label>
              )}
              <input
                type={inputType}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isPrompt ? promptPlaceholder : requireText}
                autoFocus={isPrompt}
                disabled={isLoading} // Lock input while verifying
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isConfirmed && !isLoading && !confirmDisabled) {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg outline-none transition-colors border ${isDark
                  ? "bg-black/40 border-white/10 focus:border-blue-500/50 text-white placeholder:text-white/30"
                  : "bg-white/50 border-slate-200 focus:border-blue-400 text-slate-800 placeholder:text-slate-400"
                  } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {inputFooter && (
                <div className="mt-2">
                  {inputFooter}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 pt-2">
          {!hideCancel && (
            <button
              onClick={handleClose}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white" : "bg-black/5 hover:bg-black/10 text-slate-600 hover:text-slate-800"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading || confirmDisabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2 ${(!isConfirmed || confirmDisabled) && !isLoading
              ? (isDark ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-black/5 text-slate-400 cursor-not-allowed")
              : isDestructive
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
              } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
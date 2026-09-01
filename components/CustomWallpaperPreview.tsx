import React from 'react';
import { BadgeCheck, AlertCircle } from 'lucide-react';
import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';

interface CustomWallpaperPreviewProps {
  url: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  label: string;
  onShowAlert?: (title: string, message: string) => void;
  aspectClass?: string;
}

export const CustomWallpaperPreview = ({ url, isActive, onClick, onDelete, label, onShowAlert, aspectClass = "aspect-video" }: CustomWallpaperPreviewProps) => {
  const { resolvedUrl, isVideo, isMissing } = useWallpaperUrl(url);
  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg overflow-hidden cursor-pointer group border-2 transition-all ${isActive ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-white/10 hover:border-white/30'} ${aspectClass} bg-black/40`}
    >
      <div className="absolute inset-0 pointer-events-none">
        {isMissing ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center bg-red-950/70 border border-red-500/30 text-red-200">
            <AlertCircle className="w-4 h-4 mb-0.5 text-red-400 animate-pulse" />
            <span className="text-[8px] font-bold leading-tight">File On Other Device</span>
          </div>
        ) : resolvedUrl ? (
          isVideo ? (
            <video src={resolvedUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop autoPlay playsInline />
          ) : (
            <img src={resolvedUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Custom wp" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/40 bg-black/20">Loading...</div>
        )}
      </div>
      <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none">
        <div className="flex justify-end w-full">
          {isActive && <div className="bg-amber-500/90 rounded-full p-0.5"><BadgeCheck className="text-black w-3 h-3" /></div>}
        </div>
        <div className="flex justify-between items-end w-full">
          <div className={`text-[8px] md:text-[8px] px-1 py-0.5 backdrop-blur-md rounded border text-white/90 max-w-[70%] truncate ${isMissing ? 'bg-red-900/80 border-red-400/50 text-red-200' : 'bg-black/70 border-white/10'}`}>
            {isMissing ? 'Other Device' : label}
          </div>
          <div className="flex gap-1 pointer-events-auto">
            {!url.startsWith('custom-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(url);
                  if (onShowAlert) onShowAlert('Copied', 'URL copied to clipboard!');
                }}
                className="p-1 bg-black/70 border border-white/10 text-white/80 hover:text-blue-400 rounded transition-colors"
                title="Copy URL"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-1 bg-black/70 border border-white/10 text-white/80 hover:text-red-400 rounded transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

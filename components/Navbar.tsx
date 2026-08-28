'use client';
import { Globe, StickyNote, Sparkles, MessageCircle, Send, Phone } from 'lucide-react';

interface DockProps {
    onOpenNotes: () => void;
}

export default function Dock({ onOpenNotes }: DockProps) {
    return (
        <div id="nav-dock" className="relative flex items-end justify-center gap-4 px-4 pb-2 pt-4 rounded-3xl glass-panel before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:bg-gradient-to-b before:from-white/10 before:to-transparent pointer-events-auto">
            {/* Google Translate */}
            <button
                onClick={() => window.open('https://translate.google.com', '_blank')}
                className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ffffff] text-[#4285F4] shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                title="Google Translate"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
                </svg>
            </button>

            {/* Google Keep */}
            <button
                onClick={() => {
                    const isAndroid = /Android/i.test(navigator.userAgent);
                    if (isAndroid) {
                        window.location.href = 'intent://keep.google.com#Intent;scheme=https;package=com.google.android.keep;S.browser_fallback_url=https%3A%2F%2Fkeep.google.com;end';
                    } else {
                        window.open('https://keep.google.com', '_blank');
                    }
                }}
                className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-[#FFBB00] to-[#E5A800] text-white shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                title="Google Keep"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-8 h-8 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C8.8 12.16 8 10.66 8 9c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.66-.8 3.16-2.15 4.1z" />
                </svg>
            </button>

            {/* Dialer (Mobile Only) */}
            <button
                onClick={() => {
                    window.location.href = 'tel:';
                }}
                className="group relative flex sm:hidden items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-[#34A853] to-[#2E7D32] text-white shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                title="Phone / Dialer"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-7 h-7 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
            </button>

            {/* Gemini (Desktop Only) */}
            <button
                onClick={() => {
                    const isAndroid = /Android/i.test(navigator.userAgent);
                    if (isAndroid) {
                        window.location.href = 'intent://gemini.google.com#Intent;scheme=https;package=com.google.android.apps.bard;S.browser_fallback_url=https%3A%2F%2Fgemini.google.com;end';
                    } else {
                        window.open('https://gemini.google.com', '_blank');
                    }
                }}
                className="group relative hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-[#131314] text-transparent shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl border border-white/15 cursor-pointer"
                title="Google Gemini"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-8 h-8" viewBox="0 0 24 24" fill="none">
                    <defs>
                        <linearGradient id="gemini-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1B72E8" />
                            <stop offset="35%" stopColor="#8E24AA" />
                            <stop offset="70%" stopColor="#D81B60" />
                            <stop offset="100%" stopColor="#F9AB00" />
                        </linearGradient>
                    </defs>
                    <path d="M12 2C12 7.523 16.477 12 22 12C16.477 12 12 16.477 12 22C12 16.477 7.523 12 2 12C7.523 12 12 7.523 12 2Z" fill="url(#gemini-sparkle-grad)" />
                    <path d="M19 2C19 3.657 20.343 5 22 5C20.343 5 19 6.343 19 8C19 6.343 17.657 5 16 5C17.657 5 19 3.657 19 2Z" fill="url(#gemini-sparkle-grad)" />
                </svg>
            </button>

            {/* WhatsApp */}
            <button
                onClick={() => {
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    if (isMobile) {
                        const isAndroid = /Android/i.test(navigator.userAgent);
                        if (isAndroid) {
                            window.location.href = 'whatsapp://send?text=%20';
                        } else {
                            window.location.href = 'whatsapp://app';
                        }
                    } else {
                        window.open('whatsapp://', '_blank');
                    }
                }}
                className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-[#25D366] to-[#128C7E] text-white shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                title="WhatsApp"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-8 h-8 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
            </button>

            {/* Telegram */}
            <button
                onClick={() => window.open('tg://', '_blank')}
                className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-[#24A1DE] text-white shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                title="Telegram"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-8 h-8 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                    <path d="M9.78 18.65l.28-4.2 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.17-3.07-2.01 1.94c-.23.23-.42.42-.83.42z" />
                </svg>
            </button>

            {/* VS Code */}
            <button
                onClick={() => window.open('vscode://', '_blank')}
                className="group relative hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-[#007ACC] text-white shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                title="VS Code"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-8 h-8 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                    <path d="M23.15 2.587l-6.27-3.013a1.44 1.44 0 0 0-1.34.12L.416 11.23a.96.96 0 0 0 .023 1.543l4.57 3.513-4.17 3.208a.96.96 0 0 0-.023 1.543l15.124 11.536a1.44 1.44 0 0 0 1.34.12l6.27-3.013A1.44 1.44 0 0 0 24 20.437V3.563a1.44 1.44 0 0 0-.85-1.313zM16.8 19.5L8.4 12l8.4-7.5v15z" />
                </svg>
            </button>

            {/* Antigravity */}
            <button
                onClick={() => window.open('antigravity://', '_blank')}
                className="group relative hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-gray-800 to-black text-white shadow-lg transition-all duration-300 hover:scale-[1.2] hover:-translate-y-2 hover:shadow-2xl border border-white/10 cursor-pointer"
                title="Antigravity"
            >
                <svg className="group-hover:scale-125 transition-transform duration-300 w-8 h-8" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 21H7.5L9.5 16H14.5L16.5 21H21L12 2ZM10.5 13L12 9L13.5 13H10.5Z" fill="currentColor" />
                    <circle cx="12" cy="7" r="2" fill="#F5A623" />
                </svg>
            </button>
        </div>
    );
}

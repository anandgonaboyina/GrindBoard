"use client";
import React, { useState, useRef } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { manualData } from './manualData';
import ScrollableWithArrows from './ScrollableWithArrows';

export default function UserManualModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
    const [isMobileDetailView, setIsMobileDetailView] = useState(false);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-6xl h-[80vh] md:h-[75vh] flex flex-col md:flex-row rounded-2xl md:rounded-3xl bg-slate-950 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100/20 font-sans">

                {/* Left Sidebar (List) */}
                <div className={`${isMobileDetailView ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 md:max-w-[320px] h-full bg-slate-900/50 border-r border-slate-100/10 flex-col shrink-0`}>
                    <div className="p-3 md:p-4 border-b border-slate-100/10 flex justify-between items-center bg-slate-950/40 shrink-0">
                        <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                            <BookOpen className="text-blue-400 w-5 h-5" /> User Manual
                        </h2>
                        <button
                            onClick={onClose}
                            className="md:hidden p-1.5 text-slate-100/60 hover:text-slate-100 hover:bg-slate-100/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <ScrollableWithArrows className="flex-1 p-2 md:p-3 flex flex-col gap-1 pb-10">
                        {manualData.map((section, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setActiveSectionIdx(idx);
                                    setIsMobileDetailView(true);
                                }}
                                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${activeSectionIdx === idx
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-md'
                                    : 'text-slate-100/70 hover:bg-slate-100/5 border border-transparent hover:text-slate-100'}`}
                            >
                                <span className="text-sm font-medium truncate pr-2">{section.title}</span>
                                <ChevronRight className={`w-4 h-4 shrink-0 ${activeSectionIdx === idx ? 'text-blue-400' : 'text-slate-100/20'}`} />
                            </button>
                        ))}
                    </ScrollableWithArrows>
                </div>

                {/* Right Content Area */}
                <div className={`${!isMobileDetailView ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-slate-950 min-h-0 w-full`}>

                    {/* Content Header */}
                    <div className="flex items-center justify-between p-3 md:p-5 border-b border-slate-100/10 shrink-0 bg-slate-950/20">
                        <div className="flex items-center gap-3 w-full min-w-0">
                            <button
                                onClick={() => setIsMobileDetailView(false)}
                                className="md:hidden p-1.5 bg-slate-100/5 border border-slate-100/10 rounded-lg text-slate-100/60 hover:text-slate-100 transition-colors shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-base md:text-2xl font-bold text-slate-100 truncate">
                                {manualData[activeSectionIdx]?.title}
                            </h1>
                        </div>

                        <button
                            onClick={onClose}
                            className="hidden md:flex p-2 text-slate-100/40 hover:text-slate-100 hover:bg-slate-100/10 rounded-xl transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Markdown Content */}
                    <ScrollableWithArrows 
                        className="flex-1 p-4 md:p-8 bg-slate-900/30"
                    >
                        <div className="prose prose-invert prose-sm md:prose-base max-w-3xl mx-auto prose-headings:text-blue-300 prose-a:text-blue-400 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-table:border-collapse prose-th:border prose-th:border-slate-100/20 prose-th:bg-slate-100/5 prose-th:p-2 prose-td:border prose-td:border-slate-100/10 prose-td:p-2 prose-tr:border-b-0 text-slate-200 pb-10">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {manualData[activeSectionIdx]?.content || ''}
                            </ReactMarkdown>
                        </div>
                    </ScrollableWithArrows>

                </div>

            </div>
        </div>
    );
}

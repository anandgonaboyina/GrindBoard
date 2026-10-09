import React, { useState } from 'react';
import { 
  ChevronLeft, Calendar, ChevronDown, EyeOff, 
  ChevronRight, ListChecks, Eye, Lock, Trash2, Plus, X 
} from 'lucide-react';
import ScrollableWithArrows from '@/components/ScrollableWithArrows'; 
import {KeywordInput} from './TimetableStatsModal';

interface Category {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  exceptions: string[];
  isIgnored?: boolean;
}

interface ColorOption {
  hex: string;
  name: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  uniqueSubjects: any[];
  uncategorizedSubjects: any[];
  setShowUncategorized: (val: boolean) => void;
  categories: Category[];
  handleUpdateCategories: (categories: Category[]) => void;
  COLORS: ColorOption[];
  setMatchedCatId: (id: string) => void;
  subjectsByCategory: Record<string, any[]>;
  setCategoryToDelete: (id: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isDark,
  uniqueSubjects,
  uncategorizedSubjects,
  setShowUncategorized,
  categories,
  handleUpdateCategories,
  COLORS,
  setMatchedCatId,
  subjectsByCategory,
  setCategoryToDelete
}: SettingsModalProps) {
  // Local state for the "How auto-tagging works" dropdown
  const [showDropDown, setShowDropDown] = useState<number | null>(null);

  // If modal is not open, don't render it (or render it with opacity-0 for transition)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className={`w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl flex flex-col relative transition-transform duration-300 transform scale-100 shadow-2xl ${isDark ? 'bg-[#0f0f13]' : 'bg-slate-50'} md:rounded-3xl overflow-hidden`}>
        
        {/* Header - Very compact on mobile */}
        <div className={`flex items-center gap-2 md:gap-3 px-2 py-2 md:px-6 md:py-4 border-b shrink-0 ${isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-white/50'}`}>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-[12px] md:text-base leading-tight break-words whitespace-normal ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Category Rules & Auto-Tagging
            </h3>
            <p className={`text-[9px] md:text-xs leading-tight break-words whitespace-normal ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              Map timetable subjects to overarching categories
            </p>
          </div>
        <button 
            onClick={onClose} 
            className={`p-1.5 md:p-2 rounded-xl transition-all active:scale-95 shrink-0 bg-red-600`}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Body content */}
          <ScrollableWithArrows>
        <div className="flex-1 overflow-y-auto p-2 md:p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-1.5 md:space-y-2 pb-[40px]">
              
              {/* How it works section */}
              <div className={`p-2.5 md:p-4 rounded-xl md:rounded-3xl border text-[10px] md:text-sm leading-relaxed flex flex-col gap-1.5 shadow-sm ${isDark ? 'bg-sky-500/5 border-sky-500/20 text-sky-200' : 'bg-sky-50/50 border-sky-200 text-sky-800'}`}>
                <button 
                  onClick={() => setShowDropDown(s => s === 1 ? null : 1)}
                  className="w-full flex items-center justify-between focus:outline-none transition-colors"
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Calendar size={16} className="shrink-0" />
                    <strong className="text-[11px] md:text-sm break-words whitespace-normal text-left">How auto-tagging works:</strong>
                  </div>
                  <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${showDropDown === 1 ? 'rotate-180' : ''} ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                </button>
                
                {showDropDown === 1 && (
                  <ul className="list-disc pl-4 space-y-1.5 opacity-90 text-[10px] md:text-sm whitespace-normal break-words mt-1">
                    <li>Create categories and assign comma-separated keywords.</li>
                    <li>If a timetable block contains a keyword (e.g. "DSA"), its time is mapped to that category.</li>
                    <li><strong>Exceptions:</strong> Add words to prevent false matching (e.g., Exception "PE" stops it from matching if you meant to catch "PE Study").</li>
                    <li><strong>Specifics Win:</strong> If multiple categories match, the <em>longest keyword</em> wins (e.g., "PE Study" beats "PE").</li>
                    <li><strong>Exclusions:</strong> Click the <EyeOff size={12} className="inline mx-0.5 align-sub" /> icon to mark a category as ignored. Ignored categories won't count towards your <em>Planned</em> or <em>Time Done</em> tracking targets.</li>
                  </ul>
                )}
              </div>

              {/* Uncategorized Subjects Button */}
              {uniqueSubjects.length > 0 && (
                <div className={`p-2 md:p-4 rounded-xl md:rounded-3xl border text-[10px] md:text-sm leading-relaxed flex flex-col gap-1 shadow-sm ${isDark ? 'bg-sky-500/5 border-sky-500/20 text-sky-200' : 'bg-sky-50/50 border-sky-200 text-sky-800'}`}>
                  <button
                    onClick={() => setShowUncategorized(true)}
                    className="w-full flex items-center justify-between focus:outline-none transition-colors"
                  >
                    <h4 className={`text-[9px] md:text-xs uppercase tracking-widest font-bold break-words whitespace-normal text-left ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      Uncategorized Subjects ({uncategorizedSubjects.length})
                    </h4>
                    <ChevronRight size={16} className={`shrink-0 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                  </button>
                </div>
              )}

              {/* Categories Mapping */}
              
                {categories.map((cat, idx) => {
                  const isIgnoredCat = cat.id === 'ignored';

                  return (
                    <div key={cat.id} className={`p-2 md:p-5 rounded-xl md:rounded-3xl border flex flex-col gap-2.5 md:gap-4 transition-all hover:shadow-md ${isDark ? 'bg-white/[0.03] border-white/20 hover:bg-white/[0.05]' : 'bg-white border-blue-600/80 shadow-sm hover:border-black/20'}`}>
                      
                      <div className="flex items-center justify-between gap-1.5 md:gap-3 w-full flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="relative shrink-0">
                            {!isIgnoredCat && (
                              <select 
                                value={cat.color}
                                onChange={(e) => {
                                  const newCats = [...categories];
                                  newCats[idx].color = e.target.value;
                                  handleUpdateCategories(newCats);
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              >
                                {COLORS.map((c) => <option key={c.hex} value={c.hex}>{c.name}</option>)}
                              </select>
                            )}
                            <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-white/20 shadow-md ${!isIgnoredCat ? 'transition-transform hover:scale-110 cursor-pointer' : 'opacity-80'}`} style={{ backgroundColor: cat.color }} />
                          </div>
                          
                          <input 
                            type="text" 
                            value={cat.name}
                            placeholder="e.g. Academics"
                            disabled={isIgnoredCat}
                            onChange={(e) => {
                              if (isIgnoredCat) return;
                              const newCats = [...categories];
                              newCats[idx].name = e.target.value;
                              handleUpdateCategories(newCats);
                            }}
                            className={`font-bold text-[12px] md:text-lg outline-none bg-transparent w-full border-b-2 transition-colors pb-0.5 md:pb-1 ${isDark ? 'border-white/20 text-white focus:border-violet-400' : 'border-black/10 text-slate-800 focus:border-violet-500'} ${isIgnoredCat ? 'opacity-80 border-transparent focus:border-transparent' : ''}`}
                          />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0 mt-0 md:mt-1 sm:mt-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => setMatchedCatId(cat.id)}
                            className={`flex items-center gap-1 px-1.5 md:px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold transition-all active:scale-95 whitespace-normal break-words text-center ${isDark ? 'text-violet-300 bg-violet-500/10 hover:bg-violet-500/20' : 'text-violet-700 bg-violet-100 hover:bg-violet-200'}`}
                            title="Show subjects matched by this category"
                          >
                            <ListChecks size={12} className="md:w-[14px] md:h-[14px]" /> 
                            <span>Matched ({(subjectsByCategory[cat.id] || []).length})</span>
                          </button>

                          <button 
                            disabled={isIgnoredCat}
                            onClick={() => {
                              if (isIgnoredCat) return; 
                              const newCats = [...categories];
                              newCats[idx].isIgnored = !newCats[idx].isIgnored;
                              handleUpdateCategories(newCats);
                            }} 
                            className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all shrink-0 ${isIgnoredCat ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'} ${cat.isIgnored ? (isDark ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-amber-600 bg-amber-100 hover:bg-amber-200') : (isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-black/5')}`}
                          >
                            {cat.isIgnored ? <EyeOff size={14} className="md:w-4 md:h-4" /> : <Eye size={14} className="md:w-4 md:h-4" />}
                          </button>

                          {isIgnoredCat ? (
                            <div className={`p-1.5 md:p-2 opacity-40 shrink-0 ${isDark ? 'text-white' : 'text-slate-500'}`}>
                              <Lock size={14} className="md:w-4 md:h-4" />
                            </div>
                          ) : (
                            <button onClick={() => setCategoryToDelete(cat.id)} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all shrink-0 active:scale-95 ${isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100 bg-rose-50'}`}>
                              <Trash2 size={14} className="md:w-4 md:h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Keywords & Exceptions Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 w-full">
                        <div className="flex flex-col gap-0.5 md:gap-1 w-full relative min-w-0">
                          <span className={`text-[9px] md:text-[10px] uppercase font-bold tracking-wider ml-1 whitespace-normal break-words ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                            Keywords to Match
                          </span>
                          <KeywordInput 
                            keywords={cat.keywords} 
                            isDark={isDark}
                            placeholder="e.g. Math, DSA, Code..."
                            onUpdate={(newKeywords: string[]) => {
                              const newCats = [...categories];
                              newCats[idx].keywords = newKeywords;
                              newCats.forEach((c, i) => {
                                if (i !== idx) {
                                  c.keywords = c.keywords.filter(k => !newKeywords.some(nk => nk.toLowerCase() === k.toLowerCase()));
                                }
                              });
                              handleUpdateCategories(newCats);
                            }} 
                          />
                        </div>
                        
                        <div className="flex flex-col gap-0.5 md:gap-1 w-full relative min-w-0">
                          <span className={`text-[9px] md:text-[10px] uppercase font-bold tracking-wider ml-1 whitespace-normal break-words ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                            Exceptions to Ignore
                          </span>
                          <KeywordInput 
                            keywords={cat.exceptions || []} 
                            isDark={isDark} 
                            placeholder="e.g. Free, Break..."
                            onUpdate={(newExceptions: string[]) => {
                              const newCats = [...categories];
                              newCats[idx].exceptions = newExceptions;
                              handleUpdateCategories(newCats);
                            }} 
                          />
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              

              <button 
                onClick={() => handleUpdateCategories([...categories, { id: Date.now().toString(), name: '', color: COLORS[0].hex, keywords: [], exceptions: [] }])}
                className={`fixed bottom-1 left-1/2 -translate-x-1/2  min-w-1/2 py-2.5 md:py-4 rounded-xl md:rounded-3xl border-2 border-red-300 flex items-center justify-center gap-1.5 md:gap-2 text-[11px] md:text-sm font-bold transition-all active:scale-95 mt-2 md:mt-4 bg-blue-600 text-white`}
              >
                <Plus size={16} strokeWidth={2.5} className="md:w-[18px] md:h-[18px]" /> 
                <span className="whitespace-normal break-words">Add New Category</span>
              </button>
              
            </div>
        </div>
          </ScrollableWithArrows>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, Copy, Check, Download, X, Bot, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ConfirmationModal from '@/components/ConfirmationModal'; // Adjust path if needed
import ScrollableWithArrows from '@/components/ScrollableWithArrows'; // Adjust path if needed

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newRoadmap: any) => void;
}

export default function AIAssistantModal({ isOpen, onClose, onImport }: AIAssistantModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    syllabus: '',
    availableTime: '',
    studyHours: '',
    userLevel: '',
    priority: '',
    context: '',
  });

  const [jsonInput, setJsonInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
// --- UNIFIED MODAL STATE ---
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    onConfirm: (val?: string) => void; // <-- FIXED: Required function matching the modal props
  }>({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} // <-- FIXED: Default empty function
  });

  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Helper to trigger the modal easily
  const showModalAlert = (
    title: string, 
    message: React.ReactNode, 
    confirmText = 'Got it', 
    onConfirm: (val?: string) => void = () => setDialog(prev => ({ ...prev, isOpen: false }))
  ) => {
    setDialog({ isOpen: true, title, message, confirmText, onConfirm });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    handleChange(e);
  };

  const generatePrompt = () => {
    return `{
  "id": "7f3a9c21-64d8-4b52-a817-93e5c6042f71",
  "name": "${formData.subject || '[SUBJECT_NAME]'}",
  "nodes": [
    {
      "id": "c81e4a72-35f9-46b0-9d13-57a2e6c80491",
      "title": "[MAIN_TOPIC_1] — [DURATION_1] Hours",
      "status": "pending",
      "subItems": [
        {
          "id": "a52d7e94-18c3-4f61-b820-63e9d5072416",
          "title": "[SUBTOPIC_1A] — [HOURS]",
          "status": "pending",
          "subItems": [],
          "description": "[SHORT_REVISION_NOTE_1A]"
        }
      ],
      "description": "[MAIN_TOPIC_1_AIM_AND_REVISION_STRATEGY]"
    }
  ]
}

Create a complete study roadmap for:

SUBJECT:
${formData.subject || '[SUBJECT_NAME]'}

USER_GOAL:
${formData.goal || 'General Mastery'}

SPECIFIC_SYLLABUS_OR_TOPICS_TO_COVER:
${formData.syllabus || 'None explicitly provided. Deduce standard topics based on the subject.'}
CRITICAL INSTRUCTION: If a syllabus or specific topics are provided above, your generated roadmap MUST be heavily structured around those specific topics. Do not ignore them.

AVAILABLE_TIME:
${formData.availableTime || 'Not specified'}

STUDY_HOURS:
${formData.studyHours || 'Not specified'}

USER_LEVEL:
${formData.userLevel || 'Not specified'}

PRIORITY_FOCUS:
${formData.priority || 'General Learning'}

Generate a structured roadmap that is practical and appropriately paced for the given available time.

IMPORTANT OUTPUT RULES:
1. Return ONLY pure, valid JSON.
2. DO NOT return Markdown. DO NOT wrap the JSON in \`\`\`json or any code fences.
3. DO NOT escape brackets (e.g. do not use \\[ or \\]).
4. DO NOT add trailing backslashes at the end of lines.
5. Follow the exact schema below. Do NOT add any new root-level keys.
6. Every object must contain valid JSON syntax.
7. Every "id" must be a unique valid UUID.
8. Use "pending" as the default status for every generated item.
9. Use "subItems": [] for every leaf item.
10. Break the subject into a sensible, logical number of main nodes depending on the scope of the subject and time available.
11. Add realistic hours to main-topic titles and subtopic titles.
12. Each subtopic description must be a short practical revision note.
13. Order topics logically from fundamentals to advanced concepts.

EXACT JSON SCHEMA:
{
  "id": "UNIQUE_UUID",
  "name": "${formData.subject || '[SUBJECT_NAME]'}",
  "nodes": [
    {
      "id": "UNIQUE_UUID",
      "title": "[MAIN_TOPIC] — [DURATION] Hours",
      "status": "pending",
      "subItems": [
        {
          "id": "UNIQUE_UUID",
          "title": "[SUBTOPIC] — [HOURS]",
          "status": "pending",
          "subItems": [],
          "description": "[SHORT_REVISION_NOTE]"
        }
      ],
      "description": "[MAIN_TOPIC_AIM_AND_REVISION_STRATEGY]"
    }
  ]
}

The schema above is mandatory.
Do not create additional nesting deeper than: nodes -> subItems.
The final response must be parseable directly using JSON.parse().`;
  };

  const handleCopyPrompt = async () => {
    // --- Custom Error Modal for Missing Subject ---
    if (!formData.subject.trim()) {
      showModalAlert(
        "Missing Subject ⚠️",
        <p className="text-sm text-slate-300 font-medium">Please enter at least a <b>Target Subject</b> before generating your blueprint prompt.</p>
      );
      return;
    }
    
    try {
      await navigator.clipboard.writeText(generatePrompt());
      setIsCopied(true);
      
      // --- Custom Success Modal with Next Steps ---
      showModalAlert(
        "Prompt Ready! 🚀",
        <div className="flex flex-col gap-3 text-[11px] sm:text-xs text-slate-300 mt-2 font-medium leading-relaxed">
          <p>Your highly structured prompt is now copied to your clipboard!</p>
          <div className="flex flex-col gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg shadow-inner">
            <p className="flex gap-2">
              <span className="text-indigo-400 font-black">1.</span> Open your preferred AI (ChatGPT, Claude, Gemini, etc.).
            </p>
            <p className="flex gap-2">
              <span className="text-indigo-400 font-black">2.</span> Paste the prompt and hit enter.
            </p>
            <p className="flex gap-2">
              <span className="text-emerald-400 font-black">3.</span> Copy the <b>JSON code block</b> it generates for you.
            </p>
            <p className="flex gap-2">
              <span className="text-emerald-400 font-black">4.</span> Come back here and paste it into <b>Step 2</b>!
            </p>
          </div>
        </div>,
        "Got it, let's go!",
        () => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          setTimeout(() => {
            pasteAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      );
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      showModalAlert("Error", <p>Failed to copy to clipboard.</p>);
    }
  };

  const sanitizeRoadmapIds = (roadmap: any) => {
    const newRoadmap = { ...roadmap, id: uuidv4() };
    if (Array.isArray(newRoadmap.nodes)) {
      newRoadmap.nodes = newRoadmap.nodes.map((node: any) => ({
        ...node,
        id: uuidv4(),
        subItems: Array.isArray(node.subItems) ? node.subItems.map((sub: any) => ({
          ...sub,
          id: uuidv4()
        })) : []
      }));
    }
    return newRoadmap;
  };

  const handleImport = () => {
    // --- Custom Error Modal for Empty JSON Field ---
    if (!jsonInput.trim()) {
      showModalAlert(
        "Missing Data ⚠️",
        <p className="text-sm text-slate-300 font-medium">Please paste the JSON output from your AI before trying to build the roadmap.</p>
      );
      return;
    }

    try {
      let cleaned = jsonInput.trim();
      cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
      cleaned = cleaned.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
      cleaned = cleaned.replace(/\\{/g, '{').replace(/\\}/g, '}');
      cleaned = cleaned.replace(/\\\s*\n/g, '\n');
      cleaned = cleaned.replace(/\\"/g, '"');

      const parsedData = JSON.parse(cleaned);

      if (!parsedData.name || !Array.isArray(parsedData.nodes)) {
        throw new Error('Invalid Schema');
      }

      const sanitizedData = sanitizeRoadmapIds(parsedData);
      onImport(sanitizedData);
      
      setJsonInput('');
      setFormData({ subject: '', goal: '', syllabus: '', availableTime: '', studyHours: '', userLevel: '', priority: '', context: '' });
      onClose();
    } catch (err: any) {
      console.error("JSON Parse Error:", err);
      // --- Custom Error Modal for Invalid/Broken JSON ---
      showModalAlert(
        "Invalid AI Output ❌",
        <div className="flex flex-col gap-2">
          <p className="text-sm text-rose-300 font-medium">The text you pasted is not a valid JSON structure.</p>
          <p className="text-xs text-slate-400">Make sure you copied the <b>entire block</b> starting from <code className="text-white bg-black/50 px-1 rounded">{'{'}</code> and ending with <code className="text-white bg-black/50 px-1 rounded">{'}'}</code> from your AI tool.</p>
        </div>,
        "Try Again"
      );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
        <div 
          className="w-full h-full sm:h-auto max-w-3xl bg-slate-900 border-none sm:border border-slate-700 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[100vh] sm:max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 shrink-0 mt-8 sm:mt-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">AI Roadmap Generator</h2>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Build your custom battle plan</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-1.5 sm:p-2 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <ScrollableWithArrows>
            <div ref={scrollRef} className="p-3 sm:p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar scroll-smooth h-full">
              
              <div className="flex flex-col gap-3">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="bg-indigo-500 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px]">1</span>
                  Configure Your Parameters
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Target Subject *</label>
                    <textarea name="subject" value={formData.subject} onChange={handleAutoResize} rows={1} placeholder="e.g. Master Data Structures & Algorithms" className="w-full bg-black/40 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors resize-none overflow-hidden" />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Specific Goal (Optional)</label>
                    <textarea name="goal" value={formData.goal} onChange={handleAutoResize} rows={1} placeholder="e.g. Crack FAANG Interviews, Pass Midterms..." className="w-full bg-black/40 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors resize-none overflow-hidden" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Current Level (Optional)</label>
                    <input name="userLevel" value={formData.userLevel} onChange={handleChange} placeholder="e.g. Total Beginner, 2nd Year Student..." className="w-full bg-black/40 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Priority Focus (Optional)</label>
                    <input name="priority" value={formData.priority} onChange={handleChange} placeholder="e.g. Interview Prep, Final Exams..." className="w-full bg-black/40 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Time Available (Optional)</label>
                    <input name="availableTime" value={formData.availableTime} onChange={handleChange} placeholder="e.g. 3 Months, 4 Weeks..." className="w-full bg-black/40 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Study Hours (Optional)</label>
                    <input name="studyHours" value={formData.studyHours} onChange={handleChange} placeholder="e.g. 2 hours/day..." className="w-full bg-black/40 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Known Syllabus / Topics (Highly Recommended)</label>
                    <textarea name="syllabus" value={formData.syllabus} onChange={handleAutoResize} rows={2} placeholder="Paste your college syllabus, required topics, or chapter names here so the AI builds exactly what you need..." className="w-full bg-black/40 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors resize-none overflow-hidden" />
                  </div>
                </div>

                <button
                  onClick={handleCopyPrompt}
                  className={`mt-2 flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${
                    isCopied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? 'Copied Successfully!' : 'Generate & Copy Prompt'}
                </button>
              </div>

              <div className="w-full h-px bg-slate-800" />

              <div ref={pasteAreaRef} className="flex flex-col gap-3 pb-8 sm:pb-4 scroll-mt-6">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="bg-emerald-500 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px]">2</span>
                  Import AI Blueprint
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium px-1 leading-snug">
                  Paste the generated prompt into ChatGPT or Claude. Copy their raw JSON output and paste it below.
                </p>
                
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste the { JSON } output here..."
                  className="w-full h-40 sm:h-48 bg-black/40 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 sm:p-4 text-[10px] sm:text-[11px] text-slate-300 font-mono outline-none transition-colors resize-none custom-scrollbar shadow-inner"
                  spellCheck={false}
                />
              </div>
            </div>
          </ScrollableWithArrows>

          <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-slate-800 bg-slate-800/50 flex justify-between items-center shrink-0 mb-6 sm:mb-0">
            <div className="flex items-center gap-1.5 animate-bounce text-[9px] sm:text-[10px] text-white/90 font-bold uppercase tracking-wider hidden sm:flex">
              <Bot className="w-3.5 h-3.5" /> Direct API Integration Coming Soon
            </div>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              Build Roadmap
            </button>
          </div>

        </div>
      </div>

      {/* --- UNIFIED CONFIRMATION MODAL (HANDLES ERRORS & SUCCESS) --- */}
      <ConfirmationModal
        isOpen={dialog.isOpen}
        onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        hideCancel={true}
        onConfirm={dialog.onConfirm}
      />
    </>
  );
}
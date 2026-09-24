'use client';

import React, { useState, useCallback } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { MessageSquare, Sparkles, X, Code, Trash2, Plus, FileJson, AlertCircle, Copy, Check } from 'lucide-react';
import ScrollableWithArrows from '../ScrollableWithArrows';

interface QuotesTabProps {
  showAlertModal: (title: string, message: React.ReactNode, onConfirm?: () => void) => void;
}

export default React.memo(function QuotesTab({ showAlertModal }: QuotesTabProps) {
  const {
    customQuotes, setCustomQuotes,
    useCustomQuotes, setUseCustomQuotes,
    manifestationCustomQuotes, setManifestationCustomQuotes,
    addManifestationCustomQuote, deleteManifestationCustomQuote
  } = useDashboardStore();

  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkQuotesJson, setBulkQuotesJson] = useState('');

  const [newManifestationQuoteText, setNewManifestationQuoteText] = useState('');
  const [showBulkAddManifestation, setShowBulkAddManifestation] = useState(false);
  const [bulkManifestationInput, setBulkManifestationInput] = useState('');

  // Copy to clipboard states
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyJsonExample = useCallback(() => {
    const example = '[\n  {"text": "Stay hungry, stay foolish.", "author": "Steve Jobs"}\n]';
    navigator.clipboard.writeText(example);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }, []);

  const handleCopyTextExample = useCallback(() => {
    const example = 'I am focused and ready\nEvery small step counts\nI will achieve my goals today';
    navigator.clipboard.writeText(example);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }, []);

  const handleAddManifestationQuote = useCallback(() => {
    if (!newManifestationQuoteText.trim()) return;
    const current = manifestationCustomQuotes || [];
    if (current.length >= 30) return showAlertModal('Limit Reached', 'Maximum 30 affirmations allowed.');
    addManifestationCustomQuote(newManifestationQuoteText.trim());
    setNewManifestationQuoteText('');
  }, [newManifestationQuoteText, manifestationCustomQuotes, addManifestationCustomQuote, showAlertModal]);

  const handleBulkAddManifestationQuotes = useCallback(() => {
    if (!bulkManifestationInput.trim()) return;
    let quotesToAdd: string[] = [];

    const raw = bulkManifestationInput.trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          quotesToAdd = parsed.map((q: any) => (typeof q === 'string' ? q : q.text || '')).filter(Boolean);
        }
      } catch (err) {
        quotesToAdd = raw.split('\n').map((line: string) => line.trim()).filter(Boolean);
      }
    } else {
      quotesToAdd = raw.split('\n').map((line: string) => line.trim()).filter(Boolean);
    }

    if (quotesToAdd.length === 0) {
      showAlertModal('Invalid Input', 'No valid quotes found in input.');
      return;
    }

    const current = manifestationCustomQuotes || [];
    const remaining = 30 - current.length;

    if (remaining <= 0) {
      showAlertModal('Limit Reached', 'You already have 30 quotes (maximum limit).');
      return;
    }

    const newEntries = quotesToAdd.slice(0, remaining);
    setManifestationCustomQuotes([...current, ...newEntries]);
    setBulkManifestationInput('');
    setShowBulkAddManifestation(false);
    showAlertModal('Success', `Added ${newEntries.length} new quote(s) to your Vision Board!`);
  }, [bulkManifestationInput, manifestationCustomQuotes, setManifestationCustomQuotes, showAlertModal]);

  const handleDeleteAllManifestationQuotes = useCallback(() => {
    showAlertModal('Clear All Quotes', 'Are you sure you want to delete all vision board quotes? This cannot be undone.', () => {
      setManifestationCustomQuotes([]);
    });
  }, [setManifestationCustomQuotes, showAlertModal]);

  const handleAddQuote = useCallback(() => {
    if (!newQuoteText.trim()) return;
    const author = newQuoteAuthor.trim() || 'Unknown';
    if (customQuotes.length >= 50) return showAlertModal('Limit Reached', 'Maximum 50 custom quotes allowed.');
    setCustomQuotes([...customQuotes, { text: newQuoteText.trim(), author }]);
    setNewQuoteText('');
    setNewQuoteAuthor('');
  }, [newQuoteText, newQuoteAuthor, customQuotes, setCustomQuotes, showAlertModal]);

  const handleBulkAddQuotes = useCallback(() => {
    try {
      const parsed = JSON.parse(bulkQuotesJson);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of objects.');
      const validQuotes = parsed.filter((q: any) => q.text && typeof q.text === 'string').map((q: any) => ({
        text: q.text.trim(),
        author: (q.author && typeof q.author === 'string' ? q.author.trim() : 'Unknown')
      }));
      if (validQuotes.length === 0) return showAlertModal('Import Failed', 'No valid quotes found in JSON.');
      const newQuotes = [...customQuotes, ...validQuotes].slice(0, 50);
      setCustomQuotes(newQuotes);
      setShowBulkAddModal(false);
      setBulkQuotesJson('');
      showAlertModal('Quotes Imported', `Successfully added ${validQuotes.length} quotes! (Max 50)`);
    } catch (err) {
      showAlertModal('Invalid Format', 'Invalid JSON format. Please provide an array of objects like: [{"text": "Quote", "author": "Author"}]');
    }
  }, [bulkQuotesJson, customQuotes, setCustomQuotes, showAlertModal]);

  const handleDeleteQuote = useCallback((index: number) => {
    setCustomQuotes(customQuotes.filter((_, i) => i !== index));
  }, [customQuotes, setCustomQuotes]);

  const handleDeleteAllQuotes = useCallback(() => {
    showAlertModal('Clear All Quotes', 'Are you sure you want to delete all custom quotes? This cannot be undone.', () => {
      setCustomQuotes([]);
    });
  }, [setCustomQuotes, showAlertModal]);

  return (
    <div className="flex flex-col gap-3 md:gap-4 min-h-[50vh] animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-white/90 tracking-tight">Quotes Settings</h3>
          <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Manage your custom motivational quotes for the dashboard.</p>
        </div>
      </div>

      {/* Main Toggle */}
      <div 
        className="group flex flex-row items-center justify-between p-2.5 md:p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 gap-3 shadow-sm transition-colors cursor-pointer"
        onClick={() => setUseCustomQuotes(!useCustomQuotes)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-lg border shrink-0 transition-colors ${useCustomQuotes ? 'bg-pink-500/20 border-pink-500/30' : 'bg-white/5 border-white/10 group-hover:bg-white/10'}`}>
            <MessageSquare className={`w-4 h-4 transition-colors ${useCustomQuotes ? 'text-pink-400' : 'text-white/40 group-hover:text-white/60'}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[11px] md:text-xs text-white/90 break-words">Use Custom Quotes</span>
            <span className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Show your custom list instead of system defaults</span>
          </div>
        </div>
        <button
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 outline-none ${useCustomQuotes ? 'bg-pink-500' : 'bg-white/10 group-hover:bg-white/20'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${useCustomQuotes ? 'translate-x-4.5' : 'translate-x-1'}`} />
        </button>
      </div>

      {useCustomQuotes && (
        <div className="flex flex-col gap-2.5 p-2.5 md:p-3 rounded-xl bg-black/20 border border-white/5 animate-in slide-in-from-top-2 duration-200">
          {/* Add new quote form */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 md:p-3 flex flex-col gap-2 shadow-inner">
            <h4 className="text-[10px] md:text-[11px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-1.5">
              <Plus className="w-3 h-3 text-pink-400" /> Add New Quote
            </h4>
            <input
              type="text"
              placeholder="Quote text..."
              value={newQuoteText}
              onChange={(e) => setNewQuoteText(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/30 text-white font-medium shadow-inner transition-colors"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Author (optional)"
                value={newQuoteAuthor}
                onChange={(e) => setNewQuoteAuthor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddQuote();
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/30 text-white font-medium shadow-inner transition-colors"
              />
              <button 
                onClick={handleAddQuote} 
                disabled={!newQuoteText.trim() || customQuotes.length >= 50}
                className="bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-500/20 text-pink-300 hover:text-white px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all active:scale-95 shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5 mt-1">
            <span className="text-[10px] md:text-[11px] font-bold text-white/70">Your Quotes ({customQuotes.length}/50)</span>
            <div className="flex gap-2">
              {customQuotes.length > 0 && (
                <button 
                  onClick={handleDeleteAllQuotes} 
                  className="flex items-center gap-1 text-[9px] md:text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded border border-red-500/20 transition-all hover:scale-105"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
              <button 
                onClick={() => setShowBulkAddModal(true)} 
                className="flex items-center gap-1 text-[9px] md:text-[10px] text-pink-400 hover:text-white font-bold bg-pink-500/10 hover:bg-pink-500/30 px-2 py-1.5 rounded border border-pink-500/20 transition-all hover:scale-105"
              >
                <FileJson className="w-3 h-3" /> Bulk Add JSON
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 h-[25vh] md:h-[30vh]">
            <ScrollableWithArrows className="custom-scrollbar pr-1">
              <div className="flex flex-col gap-1.5">
                {customQuotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-white/30 bg-black/20 rounded-xl border border-white/5 px-2">
                    <MessageSquare className="w-6 h-6 opacity-20" />
                    <span className="text-[10px] md:text-xs italic text-center">No custom quotes added.<br/>Add some above!</span>
                  </div>
                ) : (
                  customQuotes.map((q, idx) => (
                    <div key={idx} className="group flex items-start justify-between p-3 bg-black/30 border border-white/5 hover:border-white/10 rounded-xl gap-3 transition-colors shadow-sm">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] md:text-[11px] text-white/90 break-words leading-snug font-medium transition-colors group-hover:text-white">"{q.text}"</span>
                        <span className="text-[8px] md:text-[9px] text-pink-300/80 font-bold tracking-wide mt-1.5">- {q.author || 'Unknown'}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteQuote(idx)} 
                        className="p-1.5 text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Quote"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollableWithArrows>
          </div>
        </div>
      )}

      {/* VISION BOARD AFFIRMATIONS */}
      <div className="flex flex-col gap-2.5 mt-1 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 md:p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/5 pb-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-[11px] md:text-xs text-amber-300 break-words tracking-tight">Vision Board Affirmations</h4>
              <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Phrases and goals you want to remember on your vision board (max 30).</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {(manifestationCustomQuotes || []).length > 0 && (
              <button 
                onClick={handleDeleteAllManifestationQuotes} 
                className="flex items-center gap-1 text-[9px] md:text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded border border-red-500/20 transition-all hover:scale-105 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
            <button
              onClick={() => setShowBulkAddManifestation(!showBulkAddManifestation)}
              className="flex items-center gap-1 text-[9px] md:text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1.5 rounded hover:bg-amber-500/20 font-bold transition-all hover:scale-105 cursor-pointer"
            >
              <FileJson className="w-3 h-3" /> {showBulkAddManifestation ? 'Hide Bulk' : 'Bulk Add'}
            </button>
            <span className="text-[9px] md:text-[10px] font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 rounded border border-white/10 shadow-inner">
              {(manifestationCustomQuotes || []).length}/30
            </span>
          </div>
        </div>

        {showBulkAddManifestation && (
          <div className="bg-black/40 border border-amber-500/20 rounded-xl p-3 flex flex-col gap-2.5 shadow-inner animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center">
              <span className="text-[10px] md:text-[11px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                <Plus className="w-3 h-3" /> Bulk Import Text
              </span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleCopyTextExample}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] md:text-[10px] font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all active:scale-95"
                >
                  {copiedText ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedText ? <span className="text-green-400">Copied!</span> : 'Copy Example'}
                </button>
                <button onClick={() => setShowBulkAddManifestation(false)} className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[8.5px] md:text-[9.5px] text-white/50 leading-tight break-words flex items-start gap-1">
              <AlertCircle className="w-3 h-3 shrink-0 text-amber-500/50" />
              Paste multiple lines (one phrase per line) or use a JSON array format.
            </p>
            <textarea
              value={bulkManifestationInput}
              onChange={(e) => setBulkManifestationInput(e.target.value)}
              rows={4}
              placeholder="I am focused and ready&#10;Every small step counts&#10;I will achieve my goals today"
              className="w-full bg-black/40 border border-amber-500/20 rounded-lg p-2.5 text-[10px] md:text-xs font-mono text-amber-100/90 outline-none focus:border-amber-500/50 resize-none placeholder:text-amber-500/20 custom-scrollbar shadow-inner transition-colors"
            />
            <div className="flex justify-end mt-1">
              <button
                onClick={handleBulkAddManifestationQuotes}
                disabled={!bulkManifestationInput.trim()}
                className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500 disabled:opacity-50 text-amber-200 hover:text-black px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Import Now
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5 shadow-inner focus-within:border-amber-500/30 transition-colors">
          <input
            type="text"
            placeholder="Type affirmation or goal to remember..."
            value={newManifestationQuoteText}
            onChange={(e) => setNewManifestationQuoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddManifestationQuote();
              }
            }}
            className="flex-1 bg-transparent px-2.5 py-1 text-[10px] md:text-xs outline-none placeholder:text-white/30 text-white font-medium"
          />
          <button
            onClick={handleAddManifestationQuote}
            disabled={!newManifestationQuoteText.trim() || (manifestationCustomQuotes || []).length >= 30}
            className="bg-amber-500/20 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-500/20 text-amber-300 hover:text-black px-4 py-1.5 rounded-md text-[10px] font-bold transition-all shrink-0 border border-amber-500/30 hover:border-amber-500 shadow-sm active:scale-95"
          >
            Add
          </button>
        </div>

        {(manifestationCustomQuotes || []).length > 0 && (
          <p className="text-[8.5px] md:text-[9.5px] text-amber-300/60 font-medium italic px-1 break-words">
            ✨ These phrases are active and sync across your devices!
          </p>
        )}

        <div className="flex flex-col gap-1.5 max-h-[22vh] overflow-y-auto custom-scrollbar pr-1 mt-1">
          {(manifestationCustomQuotes || []).length === 0 ? (
            <div className="text-center py-6 text-[10px] md:text-[11px] text-white/40 italic bg-black/20 rounded-xl border border-white/5 px-2 break-words">
              No custom affirmations added. Default vision board quotes will show.
            </div>
          ) : (
            (manifestationCustomQuotes || []).map((q, idx) => (
              <div key={idx} className="group flex justify-between items-center p-2.5 bg-black/30 border border-white/5 hover:border-amber-500/30 hover:bg-black/50 rounded-xl gap-3 transition-colors shadow-sm">
                <span className="text-[10px] md:text-[11px] text-amber-100/90 group-hover:text-amber-100 font-medium italic break-words leading-snug transition-colors">
                  "{q}"
                </span>
                <button
                  onClick={() => deleteManifestationCustomQuote(idx)}
                  className="p-1.5 text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Affirmation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bulk Add Quotes JSON Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setShowBulkAddModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-black/90 border border-white/10 rounded-2xl flex flex-col p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-2.5">
                <Code className="text-pink-400 w-4 h-4" />
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/90">Bulk Import JSON</h4>
              </div>
              <button 
                onClick={() => setShowBulkAddModal(false)} 
                className="p-1.5 text-white/50 hover:text-white bg-black/40 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[10px] md:text-[11px] text-white/60 mb-2 px-1 break-words">Format must be valid JSON matching this exact structure:</p>
            
            {/* Copy Example Box */}
            <div className="flex items-center justify-between bg-black/60 px-3 py-2.5 rounded-lg border border-white/5 mb-3">
              <code className="text-pink-300 text-[9px] md:text-[10px] font-mono break-all pr-2">
                {`[{"text": "Stay hungry, stay foolish.", "author": "Steve Jobs"}]`}
              </code>
              <button 
                onClick={handleCopyJsonExample}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] md:text-[10px] font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all active:scale-95 shrink-0"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedJson ? <span className="text-green-400">Copied!</span> : 'Copy Format'}
              </button>
            </div>

            <textarea
              value={bulkQuotesJson}
              onChange={(e) => setBulkQuotesJson(e.target.value)}
              className="w-full h-48 bg-black/40 border border-pink-500/20 rounded-xl p-3 md:p-4 text-[10px] md:text-xs font-mono outline-none focus:border-pink-500/50 text-pink-100/80 resize-none custom-scrollbar shadow-inner transition-colors"
              placeholder='[&#10;  {"text": "Stay hungry, stay foolish.", "author": "Steve Jobs"}&#10;]'
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowBulkAddModal(false)} 
                className="px-5 py-2.5 rounded-xl text-[11px] md:text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkAddQuotes} 
                disabled={!bulkQuotesJson.trim()}
                className="bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-[11px] md:text-xs font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-95"
              >
                Import JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
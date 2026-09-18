'use client';

import React, { useState, useCallback } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { MessageSquare, Sparkles, X, Code, Trash2 } from 'lucide-react';
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

  const handleAddManifestationQuote = useCallback(() => {
    if (!newManifestationQuoteText.trim()) return;
    const current = manifestationCustomQuotes || [];
    if (current.length >= 30) return showAlertModal('Limit Reached', 'Maximum 30 custom manifestation quotes allowed.');
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
      showAlertModal('Limit Reached', 'You already have 30 custom quotes (maximum limit).');
      return;
    }

    const newEntries = quotesToAdd.slice(0, remaining);
    setManifestationCustomQuotes([...current, ...newEntries]);
    setBulkManifestationInput('');
    setShowBulkAddManifestation(false);
    showAlertModal('Success', `Added ${newEntries.length} new quote(s) to your Manifestation Board!`);
  }, [bulkManifestationInput, manifestationCustomQuotes, setManifestationCustomQuotes, showAlertModal]);

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

  return (
    <div className="flex flex-col gap-3 md:gap-4 min-h-[50vh]">
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-white/90">Quotes Settings</h3>
          <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Manage your custom motivational quotes for the dashboard.</p>
        </div>
      </div>

      <div className="flex flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 gap-3 shadow-sm">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 bg-pink-500/10 rounded-lg border border-pink-500/20 shrink-0">
            <MessageSquare className="text-pink-400 w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[11px] md:text-xs text-white/90 break-words">Use Custom Quotes</span>
            <span className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Show your custom list instead of system defaults</span>
          </div>
        </div>
        <button
          onClick={() => setUseCustomQuotes(!useCustomQuotes)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${useCustomQuotes ? 'bg-pink-500' : 'bg-white/20'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${useCustomQuotes ? 'translate-x-4.5' : 'translate-x-1'}`} />
        </button>
      </div>

      {useCustomQuotes && (
        <div className="flex flex-col gap-2.5 p-2.5 md:p-3 rounded-xl bg-black/20 border border-white/5">
          {/* Add new quote form */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex flex-col gap-2">
            <h4 className="text-[10px] md:text-[11px] font-bold text-white/80 uppercase tracking-wider">Add New Quote</h4>
            <input
              type="text"
              placeholder="Quote text..."
              value={newQuoteText}
              onChange={(e) => setNewQuoteText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/30 text-white font-medium shadow-inner"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Author (optional)"
                value={newQuoteAuthor}
                onChange={(e) => setNewQuoteAuthor(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/30 text-white font-medium shadow-inner"
              />
              <button onClick={handleAddQuote} className="bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500 text-pink-300 hover:text-white px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all active:scale-95 shrink-0">
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5 mt-1">
            <span className="text-[10px] md:text-[11px] font-bold text-white/70">Your Quotes ({customQuotes.length}/50)</span>
            <button onClick={() => setShowBulkAddModal(true)} className="text-[9px] md:text-[10px] text-pink-400 hover:text-pink-300 font-bold bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20 transition-colors">
              Bulk Add JSON
            </button>
          </div>

          <div className="flex flex-col gap-2 h-[25vh] md:h-[30vh]">
            <ScrollableWithArrows className="custom-scrollbar pr-1">
              <div className="flex flex-col gap-1.5">
                {customQuotes.length === 0 ? (
                  <div className="text-center py-6 text-[10px] md:text-xs text-white/40 italic bg-black/30 rounded-xl border border-white/5 break-words px-2">
                    No custom quotes added. Add some above!
                  </div>
                ) : (
                  customQuotes.map((q, idx) => (
                    <div key={idx} className="flex items-start justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl gap-2 hover:bg-black/60 transition-colors">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] md:text-[11px] text-white/90 break-words leading-snug font-medium">"{q.text}"</span>
                        <span className="text-[8px] md:text-[9px] text-pink-300/80 font-bold tracking-wide mt-1">- {q.author || 'Unknown'}</span>
                      </div>
                      <button onClick={() => handleDeleteQuote(idx)} className="p-1.5 text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
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

      {/* MANIFESTATION BOARD QUOTES */}
      <div className="flex flex-col gap-2.5 mt-1 bg-white/[0.03] border border-white/10 rounded-xl p-2.5 md:p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/5 pb-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-[11px] md:text-xs text-amber-300 break-words">Manifestation Board Quotes</h4>
              <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Add custom phrases (max 30) for your vision board overlay.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setShowBulkAddManifestation(!showBulkAddManifestation)}
              className="text-[9px] md:text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded hover:bg-amber-500/20 font-bold transition-colors cursor-pointer"
            >
              {showBulkAddManifestation ? 'Hide Bulk' : 'Bulk Add'}
            </button>
            <span className="text-[9px] md:text-[10px] font-mono font-bold text-amber-300 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
              {(manifestationCustomQuotes || []).length}/30
            </span>
          </div>
        </div>

        {showBulkAddManifestation && (
          <div className="bg-black/60 border border-amber-500/20 rounded-xl p-2.5 flex flex-col gap-2 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[10px] md:text-[11px] font-bold text-amber-300 uppercase tracking-wider">Bulk Import Text</span>
              <button onClick={() => setShowBulkAddManifestation(false)} className="p-0.5 text-white/40 hover:text-white bg-white/5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[8px] md:text-[9px] text-white/50 leading-tight break-words">
              Paste multiple lines or a JSON array <code>{`["Quote 1", "Quote 2"]`}</code>.
            </p>
            <textarea
              value={bulkManifestationInput}
              onChange={(e) => setBulkManifestationInput(e.target.value)}
              rows={4}
              placeholder="Line 1: I am focused&#10;Line 2: Every small step counts"
              className="w-full bg-black/40 border border-amber-500/20 rounded-lg p-2 text-[10px] md:text-xs font-mono text-amber-100/90 outline-none focus:border-amber-500/50 resize-none placeholder:text-white/20 custom-scrollbar"
            />
            <div className="flex justify-end mt-0.5">
              <button
                onClick={handleBulkAddManifestationQuotes}
                className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500 text-amber-200 hover:text-black px-4 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
              >
                Import Now
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
          <input
            type="text"
            placeholder="Type manifestation quote..."
            value={newManifestationQuoteText}
            onChange={(e) => setNewManifestationQuoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddManifestationQuote();
              }
            }}
            className="flex-1 bg-transparent px-2 text-[10px] md:text-xs outline-none placeholder:text-white/30 text-white font-medium"
          />
          <button
            onClick={handleAddManifestationQuote}
            disabled={(manifestationCustomQuotes || []).length >= 30}
            className="bg-amber-500/20 hover:bg-amber-500 disabled:opacity-30 text-amber-300 hover:text-black px-3 py-1.5 rounded-md text-[10px] font-bold transition-all shrink-0 border border-amber-500/30 hover:border-amber-500"
          >
            Add
          </button>
        </div>

        {(manifestationCustomQuotes || []).length > 0 && (
          <p className="text-[8.5px] md:text-[9.5px] text-amber-300/70 italic px-1 break-words">
            ✨ Custom quotes are active and sync across devices!
          </p>
        )}

        <div className="flex flex-col gap-1.5 max-h-[22vh] overflow-y-auto custom-scrollbar pr-1 mt-1">
          {(manifestationCustomQuotes || []).length === 0 ? (
            <div className="text-center py-4 text-[10px] md:text-[11px] text-white/40 italic bg-black/20 rounded-xl border border-white/5 px-2 break-words">
              No custom quotes added. Default vision board quotes will show.
            </div>
          ) : (
            (manifestationCustomQuotes || []).map((q, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 md:p-2.5 bg-black/40 border border-amber-500/10 hover:border-amber-500/20 rounded-xl gap-2 transition-colors">
                <span className="text-[10px] md:text-[11px] text-amber-100/90 font-medium italic break-words leading-snug">
                  "{q}"
                </span>
                <button
                  onClick={() => deleteManifestationCustomQuote(idx)}
                  className="p-1.5 text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl z-50 flex flex-col p-4 md:p-6 md:rounded-r-3xl animate-in fade-in">
          <div className="flex justify-between items-center mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <Code className="text-pink-400 w-4 h-4" />
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/90">Bulk Import JSON</h4>
            </div>
            <button onClick={() => setShowBulkAddModal(false)} className="p-1.5 text-white/50 hover:text-white bg-black/40 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-[9px] md:text-[10px] text-white/60 mb-2 px-1 break-words">Format must be valid JSON: <code>{`[{"text": "Quote here", "author": "Author Name"}]`}</code></p>
          <textarea
            value={bulkQuotesJson}
            onChange={(e) => setBulkQuotesJson(e.target.value)}
            className="flex-1 w-full bg-black/50 border border-pink-500/20 rounded-xl p-3 md:p-4 text-[10px] md:text-xs font-mono outline-none focus:border-pink-500/50 text-pink-100/80 resize-none custom-scrollbar shadow-inner"
            placeholder='[&#10;  {"text": "Stay hungry, stay foolish.", "author": "Steve Jobs"}&#10;]'
          />
          <div className="flex justify-end mt-3">
            <button onClick={handleBulkAddQuotes} className="bg-pink-500 hover:bg-pink-400 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg active:scale-95">Import JSON</button>
          </div>
        </div>
      )}
    </div>
  );
});
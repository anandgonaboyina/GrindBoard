// Pure helpers for TimetableStatsModal (no React, no stores)

export type Slot = { start: number; end: number }; // minutes from midnight (may exceed 1440 for post-midnight slots)

export const formatDuration = (minutes: number) => {
  if (!minutes || minutes == 0) return '0m';
  if (minutes < 0) minutes *= -1;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Maps durations to exact keys from your Timetable
export const formatTimeKey = (totalMins: number) => {
  let h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// "09:00 AM" -> "9:00AM" (compact, for slot chips)
export const formatClock = (totalMins: number) => formatTimeKey(totalMins).replace(/^0/, '').replace(' ', '');

export const getLocalStr = (d: Date) => {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

// Monday = 0 ... Sunday = 6
export const getTodayIndex = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};

export const getNowMinutes = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

export const normalizeTitle = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ');

interface MatcherCategory {
  id: string;
  keywords: string[];
  exceptions?: string[];
}

// Words only: lower-case letters/digits of any language. Spaces, "-", "_", ".", "/", brackets... all act as separators,
// so "DSA_Practice", "DSA - Practice" and "dsa  practice" are the same words.
const tokenize = (str: string): string[] => str.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

const hasPhrase = (nameTokens: string[], phraseTokens: string[]) => {
  if (phraseTokens.length === 0 || phraseTokens.length > nameTokens.length) return false;
  for (let i = 0; i <= nameTokens.length - phraseTokens.length; i++) {
    if (phraseTokens.every((t, j) => nameTokens[i + j] === t)) return true;
  }
  return false;
};

const SYMBOLIC = /[+#]/; // keywords like "C++" / "C#" must keep exact matching, tokenizing would turn them into "c"

// True when the keyword appears in the subject as full word(s)
const phraseMatches = (nameL: string, nameTokens: string[], raw: string) => {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return false;
  if (!SYMBOLIC.test(cleaned) && hasPhrase(nameTokens, tokenize(cleaned))) return true;
  const escaped = cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, 'i').test(nameL) || nameL === cleaned;
};

// Smart matcher: a keyword matches when it is a FULL word (or word sequence) of the subject.
// A category's Exceptions are checked first (same full-word rule) and skip that category only.
// If several categories match, the longest keyword wins. No match anywhere = 'uncategorized'.
export const makeCategoryMatcher = (categories: MatcherCategory[]) => (subjName: string): string => {
  const nameL = subjName.trim().toLowerCase();
  const nameTokens = tokenize(nameL);
  let bestMatchCatId = 'uncategorized';
  let longestMatchLength = 0;

  for (const cat of categories) {
    if ((cat.exceptions || []).some((exc: string) => phraseMatches(nameL, nameTokens, exc))) continue;

    for (const kw of cat.keywords) {
      const len = kw.trim().length;
      if (len > longestMatchLength && phraseMatches(nameL, nameTokens, kw)) {
        longestMatchLength = len;
        bestMatchCatId = cat.id;
      }
    }
  }
  return bestMatchCatId;
};

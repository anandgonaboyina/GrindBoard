// components/stats/utils.ts

export interface WeekdayStat {
  dayName: string;
  dayShort: string;
  avgMins: number;
  totalMins: number;
  count: number;
}

export interface SmoothnessAnalysis {
  score: number;            // 0 - 100
  avgMins: number;
  standardDeviation: number;
  status: 'Steady Flow' | 'Flexible Wave' | 'Volatile';
  description: string;
}

const getLocalStr = (d: Date): string => {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

// 1. Weekday Blueprint Analyzer
export function calculateWeekdayAverages(
  history: Record<string, number>,
  daysBack: number = 30,
  customEndDate: Date = new Date()
): WeekdayStat[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const aggregates = Array.from({ length: 7 }, (_, i) => ({
    dayName: dayNames[i],
    dayShort: dayShorts[i],
    totalMins: 0,
    count: 0,
  }));

  for (let i = 0; i < daysBack; i++) {
    const target = new Date(customEndDate);
    target.setDate(customEndDate.getDate() - i);
    const dateStr = getLocalStr(target);
    const dayOfWeek = target.getDay();

    const mins = history[dateStr] || 0;
    aggregates[dayOfWeek].totalMins += mins;
    aggregates[dayOfWeek].count += 1;
  }

  // Reorder so Monday is first (index 1 -> 6, then index 0 Sunday)
  const orderedIndices = [1, 2, 3, 4, 5, 6, 0];

  return orderedIndices.map((idx) => {
    const item = aggregates[idx];
    return {
      dayName: item.dayName,
      dayShort: item.dayShort,
      totalMins: item.totalMins,
      count: item.count,
      avgMins: item.count > 0 ? Math.round(item.totalMins / item.count) : 0,
    };
  });
}

// 2. Smoothness Score (Coefficient of Variation)
export function calculateSmoothnessScore(
  history: Record<string, number>,
  daysBack: number = 30,
  customEndDate: Date = new Date()
): SmoothnessAnalysis {
  const dailyValues: number[] = [];

  for (let i = 0; i < daysBack; i++) {
    const target = new Date(customEndDate);
    target.setDate(customEndDate.getDate() - i);
    const dateStr = getLocalStr(target);
    dailyValues.push(history[dateStr] || 0);
  }

  const n = dailyValues.length;
  if (n === 0) {
    return { score: 100, avgMins: 0, standardDeviation: 0, status: 'Steady Flow', description: 'No data recorded yet.' };
  }

  const sum = dailyValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  if (mean === 0) {
    return { score: 100, avgMins: 0, standardDeviation: 0, status: 'Steady Flow', description: 'Zero baseline.' };
  }

  // Population Variance & Standard Deviation
  const variance = dailyValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);

  // Coefficient of Variation: CV = stdDev / mean
  const cv = standardDeviation / mean;

  // Map CV to a 0-100 score:
  // CV = 0 (identical days) -> 100
  // CV = 1 (stdDev equals mean) -> 50
  // CV >= 2 (extreme binging/crashing) -> ~0
  const rawScore = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-0.7 * cv))));

  let status: 'Steady Flow' | 'Flexible Wave' | 'Volatile' = 'Flexible Wave';
  let description = 'Daily focus fluctuates naturally across work and weekends.';

  if (rawScore >= 75) {
    status = 'Steady Flow';
    description = 'Effort is steady and sustainable. Minimal risk of crash.';
  } else if (rawScore < 50) {
    status = 'Volatile';
    description = 'High peak days followed by steep drop-offs. Guard against fatigue.';
  }

  return {
    score: rawScore,
    avgMins: Math.round(mean),
    standardDeviation: Math.round(standardDeviation),
    status,
    description,
  };
}
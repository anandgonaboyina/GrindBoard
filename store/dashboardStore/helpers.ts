export const filterActiveDeadlines = (deadlines: any[]) => {
  if (!Array.isArray(deadlines)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deadlines.filter((d: any) => {
    if (!d || !d.date) return false;
    const parts = String(d.date).split('-');
    if (parts.length < 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    const dDate = new Date(year, month - 1, day);
    dDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
};

export const getSyncToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('dashboard_sync_token') || localStorage.getItem('token');
  }
  return null;
};

export const getSyncLastModified = () => {
  if (typeof window !== 'undefined') {
    return Number(localStorage.getItem('dashboard_last_modified') || '0');
  }
  return 0;
};

export const setSyncLastModified = (timestamp: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboard_last_modified', timestamp.toString());
  }
};

export const mergeDailyTimes = (localDailyTimes: Record<string, any> = {}, cloudDailyTimes: Record<string, any> = {}) => {
  const merged: Record<string, any> = { ...cloudDailyTimes };
  for (const date in localDailyTimes) {
    if (!merged[date]) {
      merged[date] = localDailyTimes[date];
    } else {
      merged[date] = {
        ...cloudDailyTimes[date],
        ...localDailyTimes[date],
      };
      ['wakeupTime', 'workStartedTime', 'sleepTime', 'bedTime'].forEach((field) => {
        const localVal = localDailyTimes[date]?.[field];
        const cloudVal = cloudDailyTimes[date]?.[field];
        if (localVal && !cloudVal) {
          merged[date][field] = localVal;
        } else if (cloudVal && !localVal) {
          merged[date][field] = cloudVal;
        } else if (localVal && cloudVal) {
          merged[date][field] = localVal;
        }
      });
    }
  }
  return merged;
};

export const mergeArraysById = (localArr: any[] = [], cloudArr: any[] = []) => {
  if (!Array.isArray(localArr)) localArr = [];
  if (!Array.isArray(cloudArr)) cloudArr = [];
  if (localArr.length === 0 && cloudArr.length > 0) return cloudArr;
  if (cloudArr.length === 0 && localArr.length > 0) return localArr;
  const map = new Map();
  cloudArr.forEach((item) => {
    if (item && item.id !== undefined) map.set(item.id, item);
  });
  localArr.forEach((item) => {
    if (item && item.id !== undefined) {
      const existing = map.get(item.id);
      if (existing) {
        map.set(item.id, { ...existing, ...item });
      } else {
        map.set(item.id, item);
      }
    }
  });
  return Array.from(map.values());
};

export const deduplicateTasks = (tasks: any[]) => {
  if (!Array.isArray(tasks)) return [];
  const map = new Map();
  tasks.forEach(t => {
    if (t && t.id) map.set(t.id, t);
  });
  return Array.from(map.values());
};

export const mergeStringArrays = (localArr: any, cloudArr: any, baseArr: any = null, cloudIsNewer: boolean = false) => {
  if (!Array.isArray(localArr)) localArr = [];
  if (!Array.isArray(cloudArr)) cloudArr = [];

  const sanitizedCloudArr = cloudArr.filter((item: any) => typeof item === 'string' && !item.startsWith('data:'));
  const localOnlyItems = localArr.filter((item: any) => typeof item === 'string' && item.startsWith('custom-'));

  if (cloudIsNewer) {
    return Array.from(new Set([...sanitizedCloudArr, ...localOnlyItems]));
  }

  if (cloudArr.length === 0) return localArr;
  if (localArr.length === 0) return cloudArr;

  const localSet = new Set(localArr);
  const result = [...localArr];
  for (const item of sanitizedCloudArr) {
    if (!localSet.has(item)) {
      result.push(item);
    }
  }
  return result;
};
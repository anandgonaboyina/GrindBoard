export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('dashboard_device_id');
  if (!deviceId) {
    deviceId = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('dashboard_device_id', deviceId);
  }
  return deviceId;
};

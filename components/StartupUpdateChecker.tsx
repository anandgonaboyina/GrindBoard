import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

export default function StartupUpdateChecker() {
  const [updateMsg, setUpdateMsg] = useState('');
  const toggleSettings = useDashboardStore(state => state.toggleSettings);

  useEffect(() => {
    // Check session storage so it only runs once per browser/Lively session
    // (A manual right-click "Reload" will keep session storage, preventing annoyance)
    const hasChecked = sessionStorage.getItem('hasCheckedUpdateV2');
    if (hasChecked) return;

    sessionStorage.setItem('hasCheckedUpdateV2', 'true');

    // Wait 8 seconds after dashboard loads before checking, so we don't slow down boot
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check' })
        });
        const data = await res.json();
        if (data.updateAvailable) {
          // Extract just the basic message, not the full instructions since we provide a button
          const shortMsg = data.message.split('\n')[0] || 'An update is available!';
          setUpdateMsg(shortMsg);
        }
      } catch (err) {
        // Silently fail on startup check if no internet
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  if (!updateMsg) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] bg-black/60 backdrop-blur-2xl border border-blue-500/50 text-white px-8 py-6 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.4)] flex items-center gap-6 animate-in slide-in-from-top-10 zoom-in-95 duration-500 min-w-[450px]">
      <div className="bg-blue-500/20 p-4 rounded-full shrink-0">
        <RefreshCw size={32} className="text-blue-400" />
      </div>
      <div className="flex flex-col gap-2 pr-8 w-full">
        <h4 className="font-bold text-xl text-blue-100">Grind Board Update</h4>
        <p className="text-sm text-white/70 mb-2 leading-relaxed">{updateMsg}</p>
        <button
          onClick={() => {
            setUpdateMsg('');
            const store = useDashboardStore.getState();
            if (!store.isSettingsOpen) {
              store.toggleSettings();
            }
            store.setSettingsActiveTab('update');
          }}
          className="self-start text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 border border-blue-500 hover:scale-105"
        >
          View Update Details
        </button>
      </div>
      <button
        onClick={() => setUpdateMsg('')}
        className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        title="Dismiss"
      >
        <X size={20} />
      </button>
    </div>
  );
}

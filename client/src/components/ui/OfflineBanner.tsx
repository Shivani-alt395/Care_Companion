import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { getOfflineQueue, removeFromQueue } from '../../offline/offlineQueue';
import { api } from '../../services/api';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function syncQueue() {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    for (const item of queue) {
      try {
        if (item.type === 'DOSE_TAKEN') {
          await api.post(`/doses/${item.payload.doseId}/take`);
        } else if (item.type === 'CHECKIN') {
          await api.post('/checkin', item.payload);
        }
        await removeFromQueue(item.id);
      } catch {
        // Keep in queue for next sync
      }
    }
    setSyncing(false);
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 3000);
  }

  if (isOnline && !syncing && !justSynced) return null;

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>You&apos;re offline. Actions will sync when connected.</span>
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-teal-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <Wifi className="w-4 h-4 flex-shrink-0 animate-pulse" aria-hidden="true" />
        <span>Back online! Syncing saved actions...</span>
      </div>
    );
  }

  if (justSynced) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>Synced ✓</span>
      </div>
    );
  }

  return null;
}

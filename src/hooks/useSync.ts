import { useEffect, useRef } from 'react';
import { useNetwork } from './useNetwork';
import { getUnsyncedPreferences, markPreferencesSynced } from '../database/database';
import { apiSyncPreferences } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useSync = () => {
  const { isOnline } = useNetwork();
  const { isAuthenticated } = useAuthStore();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isOnline || !isAuthenticated) {
      hasSynced.current = false;
      return;
    }

    // Only sync once per "came back online" event
    if (hasSynced.current) return;

    const sync = async () => {
      try {
        const pending = await getUnsyncedPreferences();
        if (pending.length === 0) return;

        await apiSyncPreferences(
          pending.map((p) => ({ car_id: p.car_id, action: p.action }))
        );

        await markPreferencesSynced(pending.map((p) => p.car_id));
        console.log(`Synced ${pending.length} offline preferences.`);
        hasSynced.current = true;
      } catch (err) {
        console.warn('Sync failed, will retry next time online:', err);
      }
    };

    sync();
  }, [isOnline, isAuthenticated]);

  return { isOnline };
};

import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export const useNetwork = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsOnline(!!state.isConnected && !!state.isInternetReachable);
      } catch {
        setIsOnline(false);
      }
    };

    check();
    interval = setInterval(check, 5000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline };
};

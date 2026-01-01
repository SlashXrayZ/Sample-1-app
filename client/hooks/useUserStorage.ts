import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

const GUEST_USER_ID = "guest";

export function useUserStorage() {
  const { user } = useAuth();

  const getUserId = useCallback(() => {
    if (user) {
      return `${user.provider}:${user.id}`;
    }
    return GUEST_USER_ID;
  }, [user]);

  const getStorageKey = useCallback(
    (baseKey: string) => {
      const userId = getUserId();
      return `${baseKey}_${userId}`;
    },
    [getUserId]
  );

  const getItem = useCallback(
    async <T>(baseKey: string): Promise<T | null> => {
      try {
        const key = getStorageKey(baseKey);
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          return JSON.parse(stored) as T;
        }
        return null;
      } catch {
        return null;
      }
    },
    [getStorageKey]
  );

  const setItem = useCallback(
    async <T>(baseKey: string, value: T): Promise<void> => {
      try {
        const key = getStorageKey(baseKey);
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silent fail
      }
    },
    [getStorageKey]
  );

  const removeItem = useCallback(
    async (baseKey: string): Promise<void> => {
      try {
        const key = getStorageKey(baseKey);
        await AsyncStorage.removeItem(key);
      } catch {
        // Silent fail
      }
    },
    [getStorageKey]
  );

  return {
    userId: getUserId(),
    getStorageKey,
    getItem,
    setItem,
    removeItem,
  };
}

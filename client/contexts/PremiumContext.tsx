import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREMIUM_KEY = "@gpa_premium_unlocked";

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  unlockPremium: () => Promise<void>;
  lockPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPremiumStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem(PREMIUM_KEY);
        if (stored === "true") {
          setIsPremium(true);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };
    loadPremiumStatus();
  }, []);

  const unlockPremium = useCallback(async () => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, "true");
      setIsPremium(true);
    } catch {
      // Silent fail
    }
  }, []);

  const lockPremium = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PREMIUM_KEY);
      setIsPremium(false);
    } catch {
      // Silent fail
    }
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, unlockPremium, lockPremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
}

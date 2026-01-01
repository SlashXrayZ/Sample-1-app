import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const PREMIUM_KEY = "@gpa_premium_subscriptions";

const TEST_DISABLE_PREMIUM = false;

interface SubscriptionData {
  isActive: boolean;
  expiryDate: string | null;
  willRenew: boolean;
  purchaseDate: string | null;
}

interface SubscriptionInfo {
  isActive: boolean;
  expiryDate: Date | null;
  willRenew: boolean;
}

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  subscriptionInfo: SubscriptionInfo;
  unlockPremium: (expiryDate?: Date, willRenew?: boolean) => Promise<void>;
  lockPremium: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

function getUserKey(userId: string, provider: string): string {
  return `${provider}:${userId}`;
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    isActive: false,
    expiryDate: null,
    willRenew: true,
  });

  const loadSubscriptionsMap = async (): Promise<Record<string, SubscriptionData>> => {
    try {
      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {};
  };

  const saveSubscriptionsMap = async (subscriptions: Record<string, SubscriptionData>) => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(subscriptions));
    } catch {}
  };

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setSubscriptionInfo({
        isActive: false,
        expiryDate: null,
        willRenew: false,
      });
      setIsLoading(false);
      return;
    }

    try {
      const subscriptions = await loadSubscriptionsMap();
      const userKey = getUserKey(user.id, user.provider);
      const subscription = subscriptions[userKey];

      if (subscription && subscription.isActive) {
        let isActive = true;
        let expiryDate: Date | null = null;

        if (subscription.expiryDate) {
          expiryDate = new Date(subscription.expiryDate);
          isActive = expiryDate > new Date();
        }

        if (isActive) {
          setIsPremium(true);
          setSubscriptionInfo({
            isActive: true,
            expiryDate,
            willRenew: subscription.willRenew,
          });
        } else {
          setIsPremium(false);
          setSubscriptionInfo({
            isActive: false,
            expiryDate,
            willRenew: false,
          });
        }
      } else {
        setIsPremium(false);
        setSubscriptionInfo({
          isActive: false,
          expiryDate: null,
          willRenew: false,
        });
      }
    } catch {
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const unlockPremium = useCallback(async (expiryDate?: Date, willRenew: boolean = true) => {
    if (!user) {
      console.error("Cannot unlock premium: User not authenticated");
      return;
    }

    try {
      const subscriptions = await loadSubscriptionsMap();
      const userKey = getUserKey(user.id, user.provider);

      const defaultExpiry = new Date();
      defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);

      subscriptions[userKey] = {
        isActive: true,
        expiryDate: (expiryDate || defaultExpiry).toISOString(),
        willRenew,
        purchaseDate: new Date().toISOString(),
      };

      await saveSubscriptionsMap(subscriptions);
      setIsPremium(true);
      setSubscriptionInfo({
        isActive: true,
        expiryDate: expiryDate || defaultExpiry,
        willRenew,
      });
    } catch {}
  }, [user]);

  const lockPremium = useCallback(async () => {
    if (!user) return;

    try {
      const subscriptions = await loadSubscriptionsMap();
      const userKey = getUserKey(user.id, user.provider);
      delete subscriptions[userKey];
      await saveSubscriptionsMap(subscriptions);
      setIsPremium(false);
      setSubscriptionInfo({
        isActive: false,
        expiryDate: null,
        willRenew: false,
      });
    } catch {}
  }, [user]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const subscriptions = await loadSubscriptionsMap();
      const userKey = getUserKey(user.id, user.provider);
      const subscription = subscriptions[userKey];

      if (subscription && subscription.isActive) {
        const expiryDate = subscription.expiryDate ? new Date(subscription.expiryDate) : null;
        if (!expiryDate || expiryDate > new Date()) {
          setIsPremium(true);
          setSubscriptionInfo({
            isActive: true,
            expiryDate,
            willRenew: subscription.willRenew,
          });
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [user]);

  const effectiveIsPremium = __DEV__ && TEST_DISABLE_PREMIUM ? false : isPremium;

  return (
    <PremiumContext.Provider
      value={{
        isPremium: effectiveIsPremium,
        isLoading,
        subscriptionInfo,
        unlockPremium,
        lockPremium,
        restorePurchases,
        checkSubscriptionStatus,
      }}
    >
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

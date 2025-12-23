import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { usePremium } from "@/contexts/PremiumContext";
import { useTheme } from "@/hooks/useTheme";

interface PremiumGateProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export function PremiumGate({ children, fallback }: PremiumGateProps) {
  const { isPremium, isLoading } = usePremium();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isPremium) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PremiumFeatureProps {
  children: React.ReactNode;
  lockedContent?: React.ReactNode;
}

export function PremiumFeature({ children, lockedContent }: PremiumFeatureProps) {
  const { isPremium, isLoading } = usePremium();

  if (isLoading) {
    return null;
  }

  if (!isPremium) {
    return lockedContent ? <>{lockedContent}</> : null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

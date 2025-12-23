import React from "react";
import { View, StyleSheet, ScrollView, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FeatureItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.featureItem, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
      <View style={[styles.featureIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon} size={24} color={theme.primary} />
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText style={[styles.featureDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

export default function UnlockPremiumScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleUnlock = async () => {
    triggerHaptic();

    // If already premium, go to unlocked screen
    if (isPremium) {
      navigation.replace("PremiumUnlocked");
      return;
    }

    // If not authenticated, go to login first
    if (!user) {
      navigation.navigate("Login");
      return;
    }

    // If authenticated but not premium, go to paywall
    navigation.navigate("Paywall");
  };

  const features = [
    {
      icon: "award" as const,
      title: "Weighted GPA",
      description: "Mark subjects as AP/Honours with custom weight multipliers",
    },
    {
      icon: "layers" as const,
      title: "Multiple Semesters",
      description: "Track and manage multiple semesters with cumulative GPA",
    },
    {
      icon: "trending-up" as const,
      title: "GPA Prediction",
      description: "Project your future GPA with expected grades",
    },
    {
      icon: "share" as const,
      title: "Export & Share",
      description: "Export your GPA summary as PDF or shareable image",
    },
    {
      icon: "bar-chart-2" as const,
      title: "Visual Analytics",
      description: "View GPA trends with interactive charts",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="star" size={48} color={theme.primary} />
        </View>
        <ThemedText style={styles.title}>GPA Calculator Premium</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Unlock all features with a monthly subscription
        </ThemedText>
      </View>

      <View
        style={[
          styles.priceCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, { color: theme.primary }]}>$1.99</ThemedText>
          <ThemedText style={[styles.period, { color: theme.textSecondary }]}>/month</ThemedText>
        </View>
        <ThemedText style={[styles.priceNote, { color: theme.textSecondary }]}>
          Cancel anytime
        </ThemedText>
      </View>

      <View style={styles.features}>
        {features.map((feature, index) => (
          <FeatureItem
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button onPress={handleUnlock} style={styles.unlockButton}>
          {isPremium ? "View Premium" : user ? "Subscribe Now" : "Sign In to Subscribe"}
        </Button>
        <ThemedText style={[styles.note, { color: theme.textSecondary }]}>
          Auto-renewable subscription. Cancel anytime in Settings.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  priceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 44,
  },
  period: {
    fontSize: 18,
    marginLeft: Spacing.xs,
  },
  priceNote: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  features: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    gap: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  unlockButton: {
    width: "100%",
  },
  note: {
    fontSize: 12,
    textAlign: "center",
  },
});

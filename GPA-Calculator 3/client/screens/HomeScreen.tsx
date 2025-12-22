import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { usePremium } from "@/contexts/PremiumContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  isPremium?: boolean;
  isLocked?: boolean;
}

function MenuItem({ icon, title, description, onPress, isPremium: isPremiumFeature, isLocked }: MenuItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: theme.primary + "15" }]}>
        <Feather name={icon} size={24} color={theme.primary} />
      </View>
      <View style={styles.menuContent}>
        <View style={styles.menuTitleRow}>
          <ThemedText style={styles.menuTitle}>{title}</ThemedText>
          {isPremiumFeature ? (
            <View style={[styles.premiumBadge, { backgroundColor: isLocked ? theme.textSecondary : theme.primary }]}>
              <Feather name={isLocked ? "lock" : "star"} size={10} color="#FFFFFF" />
              <ThemedText style={styles.premiumBadgeText}>
                {isLocked ? "Locked" : "Premium"}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText style={[styles.menuDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const handleNavigate = (screen: string, requiresPremium: boolean = false) => {
    if (requiresPremium && !isPremium) {
      navigation.navigate("UnlockPremium");
    } else {
      navigation.navigate(screen);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <ThemedText style={styles.sectionLabel}>Free Features</ThemedText>
        <View style={styles.section}>
          <MenuItem
            icon="hash"
            title="Quick Calculator"
            description="Calculate your GPA for a single semester"
            onPress={() => navigation.navigate("GPACalculator")}
          />
        </View>

        <ThemedText style={styles.sectionLabel}>Premium Features</ThemedText>
        <View style={styles.section}>
          <MenuItem
            icon="layers"
            title="Multiple Semesters"
            description="Track and manage multiple semesters"
            onPress={() => handleNavigate("Semesters", true)}
            isPremium
            isLocked={!isPremium}
          />
          <MenuItem
            icon="trending-up"
            title="GPA Prediction"
            description="Project your future GPA"
            onPress={() => handleNavigate("Prediction", true)}
            isPremium
            isLocked={!isPremium}
          />
          <MenuItem
            icon="bar-chart-2"
            title="Analytics"
            description="View GPA trends and statistics"
            onPress={() => handleNavigate("Analytics", true)}
            isPremium
            isLocked={!isPremium}
          />
          <MenuItem
            icon="share"
            title="Export & Share"
            description="Export your GPA as PDF or image"
            onPress={() => handleNavigate("Export", true)}
            isPremium
            isLocked={!isPremium}
          />
        </View>

        {!isPremium ? (
          <Pressable
            onPress={() => navigation.navigate("UnlockPremium")}
            style={[styles.unlockCard, { backgroundColor: theme.primary + "15", borderColor: theme.primary }]}
          >
            <Feather name="star" size={24} color={theme.primary} />
            <View style={styles.unlockContent}>
              <ThemedText style={[styles.unlockTitle, { color: theme.primary }]}>
                Unlock Premium
              </ThemedText>
              <ThemedText style={[styles.unlockDescription, { color: theme.textSecondary }]}>
                Get access to all features with a one-time unlock
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.primary} />
          </Pressable>
        ) : (
          <View style={[styles.premiumCard, { backgroundColor: theme.primary + "15", borderColor: theme.primary }]}>
            <Feather name="check-circle" size={24} color={theme.primary} />
            <ThemedText style={[styles.premiumText, { color: theme.primary }]}>
              Premium Unlocked
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    opacity: 0.6,
  },
  section: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  premiumBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  menuDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  unlockCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  unlockContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  unlockDescription: {
    fontSize: 13,
  },
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  premiumText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

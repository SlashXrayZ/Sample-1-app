import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const SUBSCRIPTION_SKU = "com.gpacalculator.app.premium.monthly";

interface FeatureItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
}

function FeatureItem({ icon, title }: FeatureItemProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.featureItem}>
      <Feather name="check-circle" size={20} color={theme.primary} />
      <ThemedText style={styles.featureText}>{title}</ThemedText>
    </View>
  );
}

export default function PaywallScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { unlockPremium, isPremium } = usePremium();
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isPremium) {
      navigation.replace("PremiumUnlocked");
    }
  }, [isPremium]);

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSubscribe = async () => {
    if (isLoading) return;
    setIsLoading(true);
    triggerHaptic();

    try {
      // In production with react-native-iap:
      // 1. Initialize IAP connection
      // 2. Fetch subscription products
      // 3. Request purchase with SKU
      // 4. Verify receipt on backend
      // 5. Unlock premium on success

      // For development/testing, simulate successful purchase
      if (Platform.OS === "web") {
        // Simulate purchase for web testing
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await unlockPremium();
        navigation.replace("PremiumUnlocked");
      } else {
        // On iOS, this would trigger the actual IAP flow
        // react-native-iap requires a development build, not Expo Go
        if (Platform.OS === "ios") {
          Alert.alert(
            "App Store Purchase",
            "In-App Purchases require a production build. For testing, the premium features will be unlocked.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Unlock for Testing",
                onPress: async () => {
                  await unlockPremium();
                  navigation.replace("PremiumUnlocked");
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      if (Platform.OS === "web") {
        window.alert("Purchase failed. Please try again.");
      } else {
        Alert.alert("Purchase Failed", "Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    triggerHaptic();

    try {
      // In production with react-native-iap:
      // 1. Call restorePurchases()
      // 2. Verify restored receipts
      // 3. Unlock premium if valid subscription found

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (Platform.OS === "web") {
        window.alert("No previous purchases found.");
      } else {
        Alert.alert("Restore Purchases", "No previous purchases found.");
      }
    } catch (error) {
      console.error("Restore failed:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigation.replace("Login");
  };

  const features = [
    "Weighted GPA calculation (AP/Honours)",
    "Multiple semesters with cumulative GPA",
    "GPA prediction tool",
    "Export to PDF and images",
    "Visual analytics and trends",
    "Unlimited course tracking",
  ];

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
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="star" size={48} color={theme.primary} />
          </View>
          <ThemedText style={styles.title}>GPA Calculator Premium</ThemedText>
          {user?.name ? (
            <ThemedText style={[styles.welcomeText, { color: theme.textSecondary }]}>
              Welcome, {user.name}
            </ThemedText>
          ) : null}
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
            Auto-renewable subscription
          </ThemedText>
        </View>

        <View style={styles.features}>
          <ThemedText style={styles.featuresTitle}>What you get:</ThemedText>
          {features.map((feature, index) => (
            <FeatureItem key={index} icon="check-circle" title={feature} />
          ))}
        </View>

        <View style={styles.buttons}>
          <Button
            onPress={handleSubscribe}
            style={styles.subscribeButton}
            disabled={isLoading || isRestoring}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              "Subscribe Now"
            )}
          </Button>

          <Button
            onPress={handleRestorePurchases}
            variant="ghost"
            disabled={isLoading || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              "Restore Purchases"
            )}
          </Button>
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.legalText, { color: theme.textSecondary }]}>
            Payment will be charged to your Apple ID account at confirmation of purchase.
            Subscription automatically renews unless canceled at least 24 hours before the
            end of the current period. You can manage and cancel your subscriptions in your
            App Store account settings.
          </ThemedText>

          <Button onPress={handleSignOut} variant="ghost" style={styles.signOutButton}>
            <ThemedText style={[styles.signOutText, { color: theme.textSecondary }]}>
              Sign Out
            </ThemedText>
          </Button>
        </View>
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
    gap: Spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: Spacing.sm,
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
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 14,
  },
  priceCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
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
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  buttons: {
    gap: Spacing.md,
  },
  subscribeButton: {
    height: 54,
  },
  footer: {
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legalText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  signOutButton: {
    alignSelf: "center",
  },
  signOutText: {
    fontSize: 14,
  },
});

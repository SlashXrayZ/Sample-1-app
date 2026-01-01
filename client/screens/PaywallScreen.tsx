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
const SUBSCRIPTION_PRICE = "$1.99";
const SUBSCRIPTION_PERIOD = "month";

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
  const { unlockPremium, isPremium, restorePurchases } = usePremium();
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
      if (Platform.OS === "ios" || Platform.OS === "android") {
        if (__DEV__) {
          Alert.alert(
            "Development Mode",
            "In-App Purchases require a production build. Premium features will be unlocked for testing.",
            [
              { text: "Cancel", style: "cancel", onPress: () => setIsLoading(false) },
              {
                text: "Unlock for Testing",
                onPress: async () => {
                  const expiryDate = new Date();
                  expiryDate.setMonth(expiryDate.getMonth() + 1);
                  await unlockPremium(expiryDate, true);
                  navigation.replace("PremiumUnlocked");
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Coming Soon",
            "Subscriptions will be available when this app is published to the App Store.",
            [{ text: "OK", onPress: () => setIsLoading(false) }]
          );
        }
        return;
      }

      if (Platform.OS === "web") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        await unlockPremium(expiryDate, true);
        navigation.replace("PremiumUnlocked");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      if (Platform.OS === "web") {
        window.alert("Purchase failed. Please try again.");
      } else {
        Alert.alert("Purchase Failed", "Please try again.");
      }
    } finally {
      if (Platform.OS === "web") {
        setIsLoading(false);
      }
    }
  };

  const handleRestorePurchases = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    triggerHaptic();

    try {
      const restored = await restorePurchases();
      
      if (restored) {
        navigation.replace("PremiumUnlocked");
      } else {
        if (Platform.OS === "web") {
          window.alert("No previous purchases found.");
        } else {
          Alert.alert("Restore Purchases", "No previous purchases found. If you have an active subscription, please ensure you're signed in with the same Apple ID used for the original purchase.");
        }
      }
    } catch (error) {
      console.error("Restore failed:", error);
      if (Platform.OS === "web") {
        window.alert("Failed to restore purchases. Please try again.");
      } else {
        Alert.alert("Restore Failed", "Please try again.");
      }
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
            <ThemedText style={[styles.price, { color: theme.primary }]}>{SUBSCRIPTION_PRICE}</ThemedText>
            <ThemedText style={[styles.period, { color: theme.textSecondary }]}>/{SUBSCRIPTION_PERIOD}</ThemedText>
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
            end of the current period. Your account will be charged for renewal within 24 hours
            prior to the end of the current period. You can manage and cancel your subscriptions
            by going to your App Store account settings after purchase.
          </ThemedText>

          <View style={styles.linksRow}>
            <Button onPress={() => navigation.navigate("Legal", { type: "terms" })} variant="ghost" style={styles.linkButton}>
              <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                Terms of Use
              </ThemedText>
            </Button>
            <ThemedText style={[styles.linkSeparator, { color: theme.textSecondary }]}>|</ThemedText>
            <Button onPress={() => navigation.navigate("Legal", { type: "privacy" })} variant="ghost" style={styles.linkButton}>
              <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                Privacy Policy
              </ThemedText>
            </Button>
          </View>

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
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkButton: {
    paddingHorizontal: Spacing.xs,
  },
  linkText: {
    fontSize: 12,
  },
  linkSeparator: {
    fontSize: 12,
  },
  signOutButton: {
    alignSelf: "center",
  },
  signOutText: {
    fontSize: 14,
  },
});

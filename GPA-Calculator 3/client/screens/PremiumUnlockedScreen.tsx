import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withSequence,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function PremiumUnlockedScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(-30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    iconScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    iconRotate.value = withSequence(
      withSpring(15, { damping: 8 }),
      withSpring(0, { damping: 10 })
    );

    contentOpacity.value = withDelay(300, withSpring(1));
    contentTranslateY.value = withDelay(300, withSpring(0, { damping: 15 }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  const features = [
    { icon: "award", label: "Weighted GPA" },
    { icon: "layers", label: "Multiple Semesters" },
    { icon: "trending-up", label: "GPA Prediction" },
    { icon: "folder", label: "Course Profiles" },
    { icon: "share", label: "Export & Share" },
    { icon: "bar-chart-2", label: "Visual Analytics" },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing["3xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Animated.View style={[styles.iconWrapper, iconAnimatedStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
          <Feather name="check" size={64} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        <ThemedText style={styles.title}>Premium Unlocked!</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          You now have access to all premium features
        </ThemedText>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureChip,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather
                name={feature.icon as keyof typeof Feather.glyphMap}
                size={16}
                color={theme.primary}
              />
              <ThemedText style={styles.featureLabel}>{feature.label}</ThemedText>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, contentAnimatedStyle]}>
        <Button onPress={handleContinue} style={styles.continueButton}>
          Get Started
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  iconWrapper: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    marginTop: Spacing["3xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    paddingTop: Spacing.xl,
  },
  continueButton: {
    width: "100%",
  },
});

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { RouteProp, useRoute } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type LoginScreenRouteProp = RouteProp<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<LoginScreenRouteProp>();
  const { signInWithApple, signInWithGoogle, user } = useAuth();
  const { restorePurchases } = usePremium();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasHandledUser = useRef(false);
  
  const isSwitchMode = route.params?.mode === "switch";

  useEffect(() => {
    checkAppleAvailability();
  }, []);

  useEffect(() => {
    if (user && !hasHandledUser.current) {
      hasHandledUser.current = true;
      handlePostSignIn();
    }
  }, [user]);

  const handlePostSignIn = async () => {
    if (isSwitchMode) {
      try {
        await restorePurchases();
      } catch {}
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } else {
      navigation.replace("Paywall");
    }
  };

  const checkAppleAvailability = async () => {
    if (Platform.OS === "ios") {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    }
  };

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAppleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    triggerHaptic();

    try {
      const success = await signInWithApple();
      if (!success) {
        setIsLoading(false);
      }
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert("Sign in failed. Please try again.");
      } else {
        Alert.alert("Sign In Failed", "Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    triggerHaptic();

    try {
      const success = await signInWithGoogle();
      if (!success) {
        setIsLoading(false);
      }
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert("Sign in failed. Please try again.");
      } else {
        Alert.alert("Sign In Failed", "Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    triggerHaptic();
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl * 2,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name={isSwitchMode ? "users" : "user"} size={48} color={theme.primary} />
          </View>
          <ThemedText style={styles.title}>
            {isSwitchMode ? "Switch Account" : "Sign In"}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isSwitchMode 
              ? "Sign in to a different account to access your purchases and data"
              : "Sign in to subscribe to premium features or restore your purchases"
            }
          </ThemedText>
        </View>

        <View style={styles.buttons}>
          {Platform.OS === "ios" && isAppleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={
                theme.backgroundRoot === "#000000"
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={BorderRadius.sm}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          ) : (
            <Button
              onPress={handleAppleSignIn}
              style={[styles.signInButton, { backgroundColor: "#000" }]}
              disabled={isLoading}
            >
              <View style={styles.buttonContent}>
                <Feather name="smartphone" size={20} color="#fff" />
                <ThemedText style={[styles.buttonText, { color: "#fff" }]}>
                  Sign in with Apple
                </ThemedText>
              </View>
            </Button>
          )}

          <Button
            onPress={handleGoogleSignIn}
            variant="outline"
            style={styles.signInButton}
            disabled={isLoading}
          >
            <View style={styles.buttonContent}>
              <Feather name="mail" size={20} color={theme.text} />
              <ThemedText style={styles.buttonText}>Continue with Google</ThemedText>
            </View>
          </Button>

          {isSwitchMode ? (
            <Button
              onPress={handleSkip}
              variant="ghost"
              style={styles.skipButton}
              disabled={isLoading}
            >
              <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
                Continue without signing in
              </ThemedText>
            </Button>
          ) : null}
        </View>

        <ThemedText style={[styles.terms, { color: theme.textSecondary }]}>
          {isSwitchMode
            ? "Your app data is stored separately for each account"
            : "By continuing, you agree to our Terms of Service and Privacy Policy"
          }
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xl * 2,
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
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  buttons: {
    gap: Spacing.md,
  },
  appleButton: {
    height: 50,
    width: "100%",
  },
  signInButton: {
    height: 50,
  },
  skipButton: {
    marginTop: Spacing.sm,
  },
  skipText: {
    fontSize: 14,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  terms: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
});

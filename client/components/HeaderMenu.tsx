import React from "react";
import { Platform, Linking, Alert, ActionSheetIOS } from "react-native";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { useTheme } from "@/hooks/useTheme";

export function HeaderMenu() {
  const { theme } = useTheme();
  const { user, signOut, savedAccountsCount } = useAuth();
  const { isPremium, restorePurchases } = usePremium();
  const navigation = useNavigation<any>();

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRestorePurchases = async () => {
    triggerHaptic();

    if (!user) {
      if (Platform.OS === "web") {
        window.alert("Please sign in to restore purchases.");
      } else {
        Alert.alert("Sign In Required", "Please sign in to restore your purchases.");
      }
      return;
    }

    try {
      const restored = await restorePurchases();

      if (restored) {
        if (Platform.OS === "web") {
          window.alert("Purchases restored successfully!");
        } else {
          Alert.alert("Success", "Your purchases have been restored.");
        }
      } else {
        if (Platform.OS === "web") {
          window.alert("No previous purchases found.");
        } else {
          Alert.alert("No Purchases Found", "No previous purchases were found for this account.");
        }
      }
    } catch {
      if (Platform.OS === "web") {
        window.alert("Failed to restore purchases. Please try again.");
      } else {
        Alert.alert("Error", "Failed to restore purchases. Please try again.");
      }
    }
  };

  const handleManageSubscription = async () => {
    triggerHaptic();

    if (Platform.OS === "ios") {
      try {
        await Linking.openURL("https://apps.apple.com/account/subscriptions");
      } catch {
        Alert.alert(
          "Manage Subscription",
          "Go to Settings > Apple ID > Subscriptions to manage your subscription."
        );
      }
    } else if (Platform.OS === "android") {
      try {
        await Linking.openURL("https://play.google.com/store/account/subscriptions");
      } catch {
        Alert.alert(
          "Manage Subscription",
          "Go to Google Play Store > Menu > Subscriptions to manage your subscription."
        );
      }
    } else {
      if (Platform.OS === "web") {
        window.alert("To manage your subscription, go to your device's app store settings.");
      } else {
        Alert.alert(
          "Manage Subscription",
          "To manage your subscription, go to your device's app store settings."
        );
      }
    }
  };

  const handleSignOut = () => {
    triggerHaptic();
    
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        signOut().then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        });
      }
    } else {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            },
          },
        ]
      );
    }
  };

  const handleSwitchAccount = () => {
    triggerHaptic();
    
    // Check if there are other saved accounts (excluding current user)
    const otherAccountsCount = user ? savedAccountsCount - 1 : savedAccountsCount;
    
    if (otherAccountsCount < 1) {
      // No other accounts saved - show message with sign out option
      if (Platform.OS === "web") {
        const result = window.confirm(
          "You don't have another account saved. Would you like to sign out?"
        );
        if (result) {
          signOut().then(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          });
        }
      } else {
        Alert.alert(
          "No Other Accounts",
          "You don't have another account saved on this device.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign Out",
              style: "destructive",
              onPress: async () => {
                await signOut();
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Home" }],
                });
              },
            },
          ]
        );
      }
      return;
    }
    
    // Has other accounts - proceed with switch
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Switching accounts will sign you out of this account. You can sign in again to restore purchases."
      );
      if (confirmed) {
        signOut().then(() => {
          navigation.navigate("Login", { mode: "switch" });
        });
      }
    } else {
      Alert.alert(
        "Switch Account",
        "Switching accounts will sign you out of this account. You can sign in again to restore purchases.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Switch Account",
            style: "destructive",
            onPress: async () => {
              await signOut();
              navigation.navigate("Login", { mode: "switch" });
            },
          },
        ]
      );
    }
  };

  const getAuthStatusText = () => {
    if (!user) {
      return "Not signed in";
    }
    return user.provider === "apple" ? "Signed in with Apple" : "Signed in with Google";
  };

  const showMenu = () => {
    triggerHaptic();

    const statusText = getAuthStatusText();
    const premiumText = isPremium ? " (Premium)" : "";

    if (Platform.OS === "ios") {
      const options: string[] = [`${statusText}${premiumText}`, "Restore Purchases"];
      
      if (isPremium) {
        options.push("Manage Subscription");
      }
      if (user) {
        options.push("Switch Account");
        options.push("Sign Out");
      }
      options.push("Cancel");
      
      const cancelButtonIndex = options.length - 1;
      const signOutIndex = user ? cancelButtonIndex - 1 : -1;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: signOutIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            return;
          } else if (buttonIndex === 1) {
            handleRestorePurchases();
          } else if (isPremium && buttonIndex === 2) {
            handleManageSubscription();
          } else if (user) {
            const switchIdx = isPremium ? 3 : 2;
            const signOutIdx = isPremium ? 4 : 3;
            if (buttonIndex === switchIdx) {
              handleSwitchAccount();
            } else if (buttonIndex === signOutIdx) {
              handleSignOut();
            }
          }
        }
      );
    } else {
      const buttons: { text: string; onPress?: () => void; style?: "cancel" | "destructive" | "default" }[] = [
        { text: "Restore Purchases", onPress: handleRestorePurchases },
      ];

      if (isPremium) {
        buttons.push({ text: "Manage Subscription", onPress: handleManageSubscription });
      }

      if (user) {
        buttons.push({ text: "Switch Account", onPress: handleSwitchAccount });
        buttons.push({ text: "Sign Out", onPress: handleSignOut, style: "destructive" });
      }

      buttons.push({ text: "Cancel", style: "cancel" });

      Alert.alert(
        "Account",
        `${statusText}${premiumText}`,
        buttons
      );
    }
  };

  return (
    <HeaderButton onPress={showMenu}>
      <Feather name="more-horizontal" size={22} color={theme.text} />
    </HeaderButton>
  );
}

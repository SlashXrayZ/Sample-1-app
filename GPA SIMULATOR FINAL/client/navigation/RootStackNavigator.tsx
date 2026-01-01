import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { HeaderMenu } from "@/components/HeaderMenu";

import HomeScreen from "@/screens/HomeScreen";
import GPACalculatorScreen from "@/screens/GPACalculatorScreen";
import UnlockPremiumScreen from "@/screens/UnlockPremiumScreen";
import PremiumUnlockedScreen from "@/screens/PremiumUnlockedScreen";
import SemestersScreen from "@/screens/SemestersScreen";
import SemesterDetailScreen from "@/screens/SemesterDetailScreen";
import PredictionScreen from "@/screens/PredictionScreen";
import AnalyticsScreen from "@/screens/AnalyticsScreen";
import ExportScreen from "@/screens/ExportScreen";
import LoginScreen from "@/screens/LoginScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import LegalScreen from "@/screens/LegalScreen";

export type RootStackParamList = {
  Home: undefined;
  GPACalculator: undefined;
  UnlockPremium: undefined;
  PremiumUnlocked: undefined;
  Semesters: undefined;
  SemesterDetail: { semesterId: string };
  Prediction: undefined;
  Analytics: undefined;
  Export: undefined;
  Login: { mode?: "switch" };
  Paywall: undefined;
  Legal: { type: "privacy" | "terms" };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="GPA Calculator" />,
          headerRight: () => <HeaderMenu />,
        }}
      />
      <Stack.Screen
        name="GPACalculator"
        component={GPACalculatorScreen}
        options={{
          headerTitle: "Quick Calculator",
        }}
      />
      <Stack.Screen
        name="UnlockPremium"
        component={UnlockPremiumScreen}
        options={{
          headerTitle: "Premium",
        }}
      />
      <Stack.Screen
        name="PremiumUnlocked"
        component={PremiumUnlockedScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Semesters"
        component={SemestersScreen}
        options={{
          headerTitle: "Semesters",
        }}
      />
      <Stack.Screen
        name="SemesterDetail"
        component={SemesterDetailScreen}
        options={{
          headerTitle: "Semester",
        }}
      />
      <Stack.Screen
        name="Prediction"
        component={PredictionScreen}
        options={{
          headerTitle: "GPA Prediction",
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          headerTitle: "Analytics",
        }}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={{
          headerTitle: "Export",
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerTitle: "Sign In",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          headerTitle: "Premium",
        }}
      />
      <Stack.Screen
        name="Legal"
        component={LegalScreen}
        options={({ route }) => ({
          headerTitle: route.params.type === "privacy" ? "Privacy Policy" : "Terms of Use",
        })}
      />
    </Stack.Navigator>
  );
}

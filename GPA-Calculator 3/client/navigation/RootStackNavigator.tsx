import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

import HomeScreen from "@/screens/HomeScreen";
import GPACalculatorScreen from "@/screens/GPACalculatorScreen";
import UnlockPremiumScreen from "@/screens/UnlockPremiumScreen";
import PremiumUnlockedScreen from "@/screens/PremiumUnlockedScreen";
import SemestersScreen from "@/screens/SemestersScreen";
import SemesterDetailScreen from "@/screens/SemesterDetailScreen";
import PredictionScreen from "@/screens/PredictionScreen";
import AnalyticsScreen from "@/screens/AnalyticsScreen";
import ExportScreen from "@/screens/ExportScreen";

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
    </Stack.Navigator>
  );
}

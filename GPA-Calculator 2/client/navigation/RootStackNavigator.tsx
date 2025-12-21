import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GPACalculatorScreen from "@/screens/GPACalculatorScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

export type RootStackParamList = {
  GPACalculator: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="GPACalculator"
        component={GPACalculatorScreen}
        options={{
          headerTitle: () => <HeaderTitle title="GPA Calculator" />,
        }}
      />
    </Stack.Navigator>
  );
}

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useRoute } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

type LegalType = "privacy" | "terms";

type RootStackParamList = {
  Legal: { type: LegalType };
};

const PRIVACY_POLICY = {
  title: "Privacy Policy",
  lastUpdated: "January 2026",
  sections: [
    {
      heading: "Information We Collect",
      content: `GPA Calculator collects and stores the following information locally on your device:

• Course names, grades, and credit hours you enter
• Semester information and GPA calculations
• Your grading scale preference (US 4.0 or Australian 7.0)
• Premium subscription status

When you sign in with Apple:
• We receive your Apple ID user identifier
• Your name (if you choose to share it)
• We do NOT receive your email address unless you explicitly share it`,
    },
    {
      heading: "How We Use Your Information",
      content: `Your data is used solely to:

• Calculate and display your GPA
• Save your courses and semesters for future sessions
• Sync your data across your devices (when signed in)
• Provide premium features if you subscribe

We do NOT:
• Sell your data to third parties
• Use your data for advertising
• Share your academic information with anyone`,
    },
    {
      heading: "Data Storage",
      content: `Your GPA data is stored locally on your device using secure storage. If you sign in with Apple, your data is associated with your Apple ID to enable syncing across devices.

You can delete all your data at any time by:
• Signing out of the app
• Deleting the app from your device`,
    },
    {
      heading: "Third-Party Services",
      content: `This app uses:

• Apple Sign In - For optional account authentication
• Apple In-App Purchases - For premium subscriptions

These services are governed by Apple's Privacy Policy.`,
    },
    {
      heading: "Children's Privacy",
      content: `This app does not knowingly collect personal information from children under 13. The app is designed for students of all ages to calculate their GPA.`,
    },
    {
      heading: "Changes to This Policy",
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the app.`,
    },
    {
      heading: "Contact Us",
      content: `If you have questions about this Privacy Policy, please contact us through the App Store.`,
    },
  ],
};

const TERMS_OF_USE = {
  title: "Terms of Use",
  lastUpdated: "January 2026",
  sections: [
    {
      heading: "Acceptance of Terms",
      content: `By downloading, installing, or using GPA Calculator, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the app.`,
    },
    {
      heading: "Description of Service",
      content: `GPA Calculator is a mobile application that helps students calculate their Grade Point Average (GPA). The app provides:

• Basic GPA calculation (free)
• Premium features including weighted GPA, multiple semesters, predictions, and export capabilities (subscription required)`,
    },
    {
      heading: "Accuracy of Calculations",
      content: `While we strive to provide accurate GPA calculations, this app is intended for personal reference only. GPA calculations may vary between institutions. Always verify important academic calculations with your school or university.

We are not responsible for any decisions made based on calculations from this app.`,
    },
    {
      heading: "Subscription Terms",
      content: `Premium features require a paid subscription:

• Payment is charged to your Apple ID account
• Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period
• You can manage and cancel subscriptions in your App Store account settings
• No refunds for partial subscription periods`,
    },
    {
      heading: "User Responsibilities",
      content: `You are responsible for:

• Maintaining the accuracy of data you enter
• Keeping your device and account secure
• Using the app in compliance with applicable laws`,
    },
    {
      heading: "Intellectual Property",
      content: `All content, features, and functionality of GPA Calculator are owned by the developer and are protected by copyright and other intellectual property laws.`,
    },
    {
      heading: "Limitation of Liability",
      content: `To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the app.`,
    },
    {
      heading: "Changes to Terms",
      content: `We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.`,
    },
    {
      heading: "Contact",
      content: `For questions about these Terms of Use, please contact us through the App Store.`,
    },
  ],
};

export default function LegalScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, "Legal">>();
  
  const type = route.params?.type || "privacy";
  const content = type === "privacy" ? PRIVACY_POLICY : TERMS_OF_USE;

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
          <ThemedText style={styles.title}>{content.title}</ThemedText>
          <ThemedText style={[styles.lastUpdated, { color: theme.textSecondary }]}>
            Last updated: {content.lastUpdated}
          </ThemedText>
        </View>

        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <ThemedText style={styles.sectionHeading}>{section.heading}</ThemedText>
            <ThemedText style={[styles.sectionContent, { color: theme.textSecondary }]}>
              {section.content}
            </ThemedText>
          </View>
        ))}
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
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  lastUpdated: {
    fontSize: 14,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
});

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Semester, calculateGPA, calculateCumulativeGPA, SCALE_CONFIG } from "@/types/gpa";

const SEMESTERS_KEY = "@gpa_semesters";

export default function ExportScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEMESTERS_KEY);
      if (stored) {
        setSemesters(JSON.parse(stored));
      }
    } catch {
      // Silent fail
    }
  };

  const cumulativeGPA = calculateCumulativeGPA(semesters);
  const totalCredits = semesters.reduce(
    (sum, s) => sum + s.courses.reduce((cSum, c) => cSum + c.credits, 0),
    0
  );
  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);

  const handleExportImage = async () => {
    if (!viewShotRef.current) return;

    setIsExporting(true);
    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share GPA Summary",
          });
        } else {
          if (Platform.OS === "web") {
            window.alert("Sharing is not available on this platform");
          } else {
            Alert.alert("Sharing Unavailable", "Sharing is not available on this device");
          }
        }
      }
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert("Failed to export image");
      } else {
        Alert.alert("Export Failed", "Failed to export image. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const htmlContent = generatePDFHtml();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share GPA Report",
        });
      } else {
        if (Platform.OS === "web") {
          window.alert("Sharing is not available on this platform");
        } else {
          Alert.alert("Sharing Unavailable", "Sharing is not available on this device");
        }
      }
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert("Failed to export PDF");
      } else {
        Alert.alert("Export Failed", "Failed to export PDF. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDFHtml = () => {
    const semesterRows = semesters
      .map((semester) => {
        const gpa = calculateGPA(semester.courses, semester.scale);
        const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        return `
          <tr>
            <td>${semester.name}</td>
            <td>${semester.term}</td>
            <td>${semester.courses.length}</td>
            <td>${credits}</td>
            <td style="font-weight: bold; color: #6366F1;">${gpa.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>GPA Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1F2937;
            }
            h1 {
              color: #6366F1;
              border-bottom: 2px solid #6366F1;
              padding-bottom: 10px;
            }
            .summary {
              background: #F3F4F6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .stat {
              text-align: center;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #6366F1;
            }
            .stat-label {
              color: #6B7280;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #E5E7EB;
            }
            th {
              background: #F9FAFB;
              font-weight: 600;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #9CA3AF;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>GPA Report</h1>
          
          <div class="summary">
            <div class="summary-grid">
              <div class="stat">
                <div class="stat-value">${cumulativeGPA.toFixed(2)}</div>
                <div class="stat-label">Cumulative GPA</div>
              </div>
              <div class="stat">
                <div class="stat-value">${totalCourses}</div>
                <div class="stat-label">Total Courses</div>
              </div>
              <div class="stat">
                <div class="stat-value">${totalCredits}</div>
                <div class="stat-label">Total Credits</div>
              </div>
            </div>
          </div>
          
          <h2>Semester Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Semester</th>
                <th>Term</th>
                <th>Courses</th>
                <th>Credits</th>
                <th>GPA</th>
              </tr>
            </thead>
            <tbody>
              ${semesterRows || '<tr><td colspan="5" style="text-align: center;">No semesters recorded</td></tr>'}
            </tbody>
          </table>
          
          <div class="footer">
            Generated by GPA Calculator on ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        <ThemedText style={styles.sectionTitle}>Export GPA Summary</ThemedText>
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          Share your GPA summary as an image or PDF document.
        </ThemedText>

        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
          style={[styles.previewCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.previewHeader}>
            <ThemedText style={styles.previewTitle}>GPA Summary</ThemedText>
            <ThemedText style={[styles.previewDate, { color: theme.textSecondary }]}>
              {new Date().toLocaleDateString()}
            </ThemedText>
          </View>

          <View style={[styles.previewGPA, { borderColor: theme.border }]}>
            <ThemedText style={[styles.previewGPAValue, { color: theme.primary }]}>
              {semesters.length > 0 ? cumulativeGPA.toFixed(2) : "—"}
            </ThemedText>
            <ThemedText style={[styles.previewGPALabel, { color: theme.textSecondary }]}>
              Cumulative GPA
            </ThemedText>
          </View>

          <View style={styles.previewStats}>
            <View style={styles.previewStat}>
              <ThemedText style={styles.previewStatValue}>{semesters.length}</ThemedText>
              <ThemedText style={[styles.previewStatLabel, { color: theme.textSecondary }]}>
                Semesters
              </ThemedText>
            </View>
            <View style={styles.previewStat}>
              <ThemedText style={styles.previewStatValue}>{totalCourses}</ThemedText>
              <ThemedText style={[styles.previewStatLabel, { color: theme.textSecondary }]}>
                Courses
              </ThemedText>
            </View>
            <View style={styles.previewStat}>
              <ThemedText style={styles.previewStatValue}>{totalCredits}</ThemedText>
              <ThemedText style={[styles.previewStatLabel, { color: theme.textSecondary }]}>
                Credits
              </ThemedText>
            </View>
          </View>
        </ViewShot>

        <View style={styles.exportButtons}>
          <Button
            onPress={handleExportImage}
            disabled={isExporting || semesters.length === 0}
            style={styles.exportButton}
          >
            <View style={styles.buttonContent}>
              <Feather name="image" size={20} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>Export as Image</ThemedText>
            </View>
          </Button>

          <Button
            onPress={handleExportPDF}
            disabled={isExporting || semesters.length === 0}
            style={styles.exportButton}
          >
            <View style={styles.buttonContent}>
              <Feather name="file-text" size={20} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>Export as PDF</ThemedText>
            </View>
          </Button>
        </View>

        {semesters.length === 0 ? (
          <View style={styles.emptyNote}>
            <Feather name="info" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyNoteText, { color: theme.textSecondary }]}>
              Add semesters to enable export
            </ThemedText>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  previewHeader: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewDate: {
    fontSize: 12,
  },
  previewGPA: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  previewGPAValue: {
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 50,
  },
  previewGPALabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  previewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  previewStat: {
    alignItems: "center",
  },
  previewStatValue: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  previewStatLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  exportButtons: {
    gap: Spacing.md,
  },
  exportButton: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyNoteText: {
    fontSize: 14,
  },
});

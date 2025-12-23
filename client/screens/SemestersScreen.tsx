import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Semester, GPAScale, calculateGPA, SCALE_CONFIG } from "@/types/gpa";

const SEMESTERS_KEY = "@gpa_semesters";

export default function SemestersScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSemesterTerm, setNewSemesterTerm] = useState("");
  const [selectedScale, setSelectedScale] = useState<GPAScale>("US");

  useFocusEffect(
    useCallback(() => {
      loadSemesters();
    }, [])
  );

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

  const saveSemesters = async (updated: Semester[]) => {
    try {
      await AsyncStorage.setItem(SEMESTERS_KEY, JSON.stringify(updated));
    } catch {
      // Silent fail
    }
  };

  const handleAddSemester = () => {
    if (!newSemesterName.trim()) {
      if (Platform.OS === "web") {
        window.alert("Please enter a semester name");
      } else {
        Alert.alert("Missing Information", "Please enter a semester name");
      }
      return;
    }

    const newSemester: Semester = {
      id: Date.now().toString(),
      name: newSemesterName.trim(),
      term: newSemesterTerm.trim() || "Term",
      courses: [],
      scale: selectedScale,
    };

    const updated = [...semesters, newSemester];
    setSemesters(updated);
    saveSemesters(updated);
    setShowAddModal(false);
    setNewSemesterName("");
    setNewSemesterTerm("");
  };

  const handleDeleteSemester = (id: string) => {
    const semester = semesters.find((s) => s.id === id);
    const confirmDelete = () => {
      const updated = semesters.filter((s) => s.id !== id);
      setSemesters(updated);
      saveSemesters(updated);
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${semester?.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Semester",
        `Are you sure you want to delete "${semester?.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  const calculateCumulativeGPA = useCallback(() => {
    const allCourses = semesters.flatMap((s) => s.courses);
    if (allCourses.length === 0) return 0;
    const scale = semesters[0]?.scale || "US";
    return calculateGPA(allCourses, scale);
  }, [semesters]);

  const cumulativeGPA = calculateCumulativeGPA();
  const totalCredits = semesters.reduce(
    (sum, s) => sum + s.courses.reduce((cSum, c) => cSum + c.credits, 0),
    0
  );

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
        {semesters.length > 0 ? (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.gpaBackground, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Cumulative GPA
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: theme.primary }]}>
              {cumulativeGPA.toFixed(2)}
            </ThemedText>
            <ThemedText style={[styles.summaryDetails, { color: theme.textSecondary }]}>
              {semesters.length} semester{semesters.length !== 1 ? "s" : ""} | {totalCredits} credits
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.header}>
          <ThemedText style={styles.sectionTitle}>Semesters</ThemedText>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {semesters.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No semesters added yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add a semester to start tracking your courses
            </ThemedText>
          </View>
        ) : (
          <View style={styles.semesterList}>
            {semesters.map((semester) => {
              const semesterGPA = calculateGPA(semester.courses, semester.scale);
              const semesterCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);

              return (
                <Pressable
                  key={semester.id}
                  onPress={() => navigation.navigate("SemesterDetail", { semesterId: semester.id })}
                  style={[
                    styles.semesterItem,
                    { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.semesterInfo}>
                    <ThemedText style={styles.semesterName}>{semester.name}</ThemedText>
                    <ThemedText style={[styles.semesterTerm, { color: theme.textSecondary }]}>
                      {semester.term} | {SCALE_CONFIG[semester.scale].label}
                    </ThemedText>
                    <ThemedText style={[styles.semesterStats, { color: theme.textSecondary }]}>
                      {semester.courses.length} course{semester.courses.length !== 1 ? "s" : ""} |{" "}
                      {semesterCredits} credits
                    </ThemedText>
                  </View>
                  <View style={styles.semesterGPA}>
                    <ThemedText style={[styles.gpaValue, { color: theme.primary }]}>
                      {semester.courses.length > 0 ? semesterGPA.toFixed(2) : "—"}
                    </ThemedText>
                    <ThemedText style={[styles.gpaLabel, { color: theme.textSecondary }]}>
                      GPA
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteSemester(semester.id)}
                    hitSlop={12}
                    style={styles.deleteButton}
                  >
                    <Feather name="trash-2" size={18} color={theme.destructive} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Add Semester</ThemedText>

            <ThemedText style={styles.inputLabel}>Semester Name</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text },
              ]}
              value={newSemesterName}
              onChangeText={setNewSemesterName}
              placeholder="e.g., Fall 2024"
              placeholderTextColor={theme.textSecondary}
            />

            <ThemedText style={styles.inputLabel}>Term (Optional)</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text },
              ]}
              value={newSemesterTerm}
              onChangeText={setNewSemesterTerm}
              placeholder="e.g., Semester 1"
              placeholderTextColor={theme.textSecondary}
            />

            <ThemedText style={styles.inputLabel}>GPA Scale</ThemedText>
            <View style={styles.scaleButtons}>
              {(["US", "AU"] as GPAScale[]).map((scale) => (
                <Pressable
                  key={scale}
                  onPress={() => setSelectedScale(scale)}
                  style={[
                    styles.scaleButton,
                    {
                      backgroundColor: selectedScale === scale ? theme.primary : theme.backgroundRoot,
                      borderColor: selectedScale === scale ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.scaleButtonText,
                      { color: selectedScale === scale ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {SCALE_CONFIG[scale].label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setNewSemesterName("");
                  setNewSemesterTerm("");
                }}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Button onPress={handleAddSemester} style={styles.saveButton}>
                Add Semester
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    marginVertical: Spacing.sm,
    lineHeight: 40,
  },
  summaryDetails: {
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  semesterList: {
    gap: Spacing.md,
  },
  semesterItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  semesterInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  semesterName: {
    fontSize: 16,
    fontWeight: "600",
  },
  semesterTerm: {
    fontSize: 14,
  },
  semesterStats: {
    fontSize: 12,
  },
  semesterGPA: {
    alignItems: "center",
  },
  gpaValue: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  gpaLabel: {
    fontSize: 12,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  scaleButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scaleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  scaleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
  },
});

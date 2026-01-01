import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { usePremium } from "@/contexts/PremiumContext";
import { useUserStorage } from "@/hooks/useUserStorage";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Semester, Course, calculateGPA, getWeightedGPACap, SCALE_CONFIG, DEFAULT_WEIGHT_MULTIPLIERS } from "@/types/gpa";

const SEMESTERS_KEY = "@gpa_semesters";

export default function SemesterDetailScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { semesterId } = route.params || {};
  const { getItem, setItem, userId } = useUserStorage();
  const { isPremium } = usePremium();

  const [semester, setSemester] = useState<Semester | null>(null);
  const [courseName, setCourseName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [credits, setCredits] = useState("");
  const [isWeighted, setIsWeighted] = useState(false);
  const [weightType, setWeightType] = useState<"AP" | "Honours" | "Standard">("AP");
  const [useWeightedGPA, setUseWeightedGPA] = useState(false);

  useEffect(() => {
    loadSemester();
  }, [semesterId, userId, getItem]);

  const loadSemester = async () => {
    const semesters = await getItem<Semester[]>(SEMESTERS_KEY);
    if (semesters) {
      const found = semesters.find((s) => s.id === semesterId);
      if (found) {
        setSemester(found);
        setSelectedGrade(SCALE_CONFIG[found.scale].grades[0]);
      }
    }
  };

  const saveSemester = async (updated: Semester) => {
    let semesters = await getItem<Semester[]>(SEMESTERS_KEY);
    if (!semesters) {
      semesters = [];
    }
    const index = semesters.findIndex((s) => s.id === semesterId);
    if (index !== -1) {
      semesters[index] = updated;
    } else {
      semesters.push(updated);
    }
    await setItem(SEMESTERS_KEY, semesters);
  };

  const handleAddCourse = () => {
    if (!semester) return;

    const creditValue = parseInt(credits, 10);
    const config = SCALE_CONFIG[semester.scale];

    if (!courseName.trim()) {
      if (Platform.OS === "web") {
        window.alert("Please enter a course name");
      } else {
        Alert.alert("Missing Information", "Please enter a course name");
      }
      return;
    }

    if (isNaN(creditValue) || !config.creditOptions.includes(creditValue)) {
      if (Platform.OS === "web") {
        window.alert(`Please select valid ${config.creditLabel.toLowerCase()}`);
      } else {
        Alert.alert("Invalid Credits", `Please select a valid ${config.creditLabel.toLowerCase()} value`);
      }
      return;
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName.trim(),
      grade: selectedGrade,
      credits: creditValue,
      isWeighted: isPremium && isWeighted && semester.scale === "US",
      weightType: isPremium && isWeighted && semester.scale === "US" ? weightType : "Standard",
    };

    const updated = {
      ...semester,
      courses: [...semester.courses, newCourse],
    };

    setSemester(updated);
    saveSemester(updated);
    setCourseName("");
    setCredits("");
    setSelectedGrade(config.grades[0]);
    setIsWeighted(false);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (!semester) return;

    const course = semester.courses.find((c) => c.id === courseId);
    const confirmDelete = () => {
      const updated = {
        ...semester,
        courses: semester.courses.filter((c) => c.id !== courseId),
      };
      setSemester(updated);
      saveSemester(updated);
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${course?.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Course",
        `Are you sure you want to delete "${course?.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  if (!semester) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loading}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const config = SCALE_CONFIG[semester.scale];
  const hasWeightedCourses = semester.courses.some(c => c.isWeighted);
  const gpa = calculateGPA(semester.courses, semester.scale, isPremium && useWeightedGPA, DEFAULT_WEIGHT_MULTIPLIERS);
  const totalCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
  const isAddDisabled = !courseName.trim() || !credits.trim();

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
        <View
          style={[
            styles.gpaCard,
            { backgroundColor: theme.gpaBackground, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.gpaLabel, { color: theme.textSecondary }]}>
            {semester.name} - {useWeightedGPA ? "Weighted GPA" : config.gpaLabel}
          </ThemedText>
          <View style={styles.gpaValueRow}>
            <ThemedText style={[styles.gpaValue, { color: theme.primary }]}>
              {semester.courses.length > 0 ? gpa.toFixed(2) : "—"}
            </ThemedText>
            {semester.courses.length > 0 ? (
              <ThemedText style={[styles.gpaOutOf, { color: theme.textSecondary }]}>
                {useWeightedGPA 
                  ? ` / ${getWeightedGPACap(semester.courses).toFixed(1)}`
                  : ` / ${config.max.toFixed(1)}`
                }
              </ThemedText>
            ) : null}
          </View>
          {semester.courses.length > 0 ? (
            <ThemedText style={[styles.gpaSummary, { color: theme.textSecondary }]}>
              {semester.courses.length} course{semester.courses.length !== 1 ? "s" : ""} |{" "}
              {totalCredits} credits
            </ThemedText>
          ) : null}
          {useWeightedGPA && semester.courses.length > 0 ? (
            <ThemedText style={[styles.gpaDisclaimer, { color: theme.textSecondary }]}>
              Weighted GPA rules vary by school.
            </ThemedText>
          ) : null}
          {isPremium && semester.scale === "US" && hasWeightedCourses ? (
            <View style={styles.weightedGPAToggle}>
              <ThemedText style={[styles.weightedGPAToggleText, { color: theme.textSecondary }]}>
                Use Weighted GPA
              </ThemedText>
              <Switch
                value={useWeightedGPA}
                onValueChange={setUseWeightedGPA}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.inputCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <ThemedText style={styles.inputLabel}>Course Name</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.backgroundRoot,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={courseName}
            onChangeText={setCourseName}
            placeholder="e.g., Calculus I"
            placeholderTextColor={theme.textSecondary}
          />

          <ThemedText style={styles.inputLabel}>Grade</ThemedText>
          <View style={styles.gradeGrid}>
            {config.grades.map((grade) => {
              const isSelected = selectedGrade === grade;
              return (
                <Pressable
                  key={grade}
                  onPress={() => setSelectedGrade(grade)}
                  style={[
                    styles.gradeButton,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.gradeButtonText,
                      { color: isSelected ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {grade}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={styles.inputLabel}>{config.creditLabel}</ThemedText>
          <View style={styles.creditGrid}>
            {config.creditOptions.map((option) => {
              const isSelected = credits === option.toString();
              return (
                <Pressable
                  key={option}
                  onPress={() => setCredits(option.toString())}
                  style={[
                    styles.creditButton,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.creditButtonText,
                      { color: isSelected ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {option}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {isPremium && semester.scale === "US" ? (
            <View style={styles.weightedSection}>
              <View style={styles.weightedToggleRow}>
                <ThemedText style={styles.inputLabel}>Weighted Course</ThemedText>
                <Switch
                  value={isWeighted}
                  onValueChange={setIsWeighted}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              {isWeighted ? (
                <View style={styles.weightTypeGrid}>
                  {(["AP", "Honours"] as const).map((type) => {
                    const isSelected = weightType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setWeightType(type)}
                        style={[
                          styles.weightTypeButton,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.weightTypeText,
                            { color: isSelected ? "#FFFFFF" : theme.text },
                          ]}
                        >
                          {type} (+{DEFAULT_WEIGHT_MULTIPLIERS[type].toFixed(1)})
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : null}

          <Button onPress={handleAddCourse} disabled={isAddDisabled} style={styles.addButton}>
            Add Course
          </Button>
        </View>

        <View style={styles.coursesSection}>
          <ThemedText style={styles.coursesTitle}>Courses</ThemedText>

          {semester.courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="book" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No courses added yet
              </ThemedText>
            </View>
          ) : (
            <View style={styles.courseList}>
              {semester.courses.map((course) => (
                <View
                  key={course.id}
                  style={[
                    styles.courseItem,
                    { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.courseInfo}>
                    <ThemedText style={styles.courseName}>{course.name}</ThemedText>
                    <ThemedText style={[styles.courseDetails, { color: theme.textSecondary }]}>
                      Grade: {course.grade} | Credits: {course.credits}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteCourse(course.id)}
                    style={styles.deleteButton}
                    hitSlop={12}
                  >
                    <Feather name="trash-2" size={20} color={theme.destructive} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gpaCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  gpaLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  gpaValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  gpaValue: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
  },
  gpaOutOf: {
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 32,
  },
  gpaSummary: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  gpaDisclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  weightedGPAToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  weightedGPAToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gradeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    minWidth: 44,
    alignItems: "center",
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  creditGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  creditButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    minWidth: 50,
    alignItems: "center",
  },
  creditButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  weightedSection: {
    marginBottom: Spacing.md,
  },
  weightedToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  weightTypeGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  weightTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  weightTypeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    marginTop: Spacing.sm,
  },
  coursesSection: {
    gap: Spacing.md,
  },
  coursesTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  courseList: {
    gap: Spacing.sm,
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  courseInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  courseDetails: {
    fontSize: 14,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});

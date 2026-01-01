import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { GPAScale, PredictionCourse, calculateGPA, SCALE_CONFIG, Course } from "@/types/gpa";

export default function PredictionScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [scale, setScale] = useState<GPAScale>("US");
  const [currentGPA, setCurrentGPA] = useState("");
  const [currentCredits, setCurrentCredits] = useState("");
  const [courses, setCourses] = useState<PredictionCourse[]>([]);
  const [courseName, setCourseName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("A");
  const [credits, setCredits] = useState("");

  const config = SCALE_CONFIG[scale];

  const handleAddCourse = () => {
    const creditValue = parseInt(credits, 10);

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

    const newCourse: PredictionCourse = {
      id: Date.now().toString(),
      name: courseName.trim(),
      expectedGrade: selectedGrade,
      credits: creditValue,
    };

    setCourses((prev) => [...prev, newCourse]);
    setCourseName("");
    setCredits("");
    setSelectedGrade(config.grades[0]);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const calculateProjectedGPA = useCallback(() => {
    const currentGPAValue = parseFloat(currentGPA);
    const currentCreditsValue = parseFloat(currentCredits);

    if (courses.length === 0) {
      return isNaN(currentGPAValue) ? 0 : currentGPAValue;
    }

    const futureCourses: Course[] = courses.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.expectedGrade,
      credits: c.credits,
    }));

    const futureGPA = calculateGPA(futureCourses, scale);
    const futureCredits = futureCourses.reduce((sum, c) => sum + c.credits, 0);

    if (!isNaN(currentGPAValue) && !isNaN(currentCreditsValue) && currentCreditsValue > 0) {
      const totalPoints =
        currentGPAValue * currentCreditsValue + futureGPA * futureCredits;
      const totalCredits = currentCreditsValue + futureCredits;
      return totalCredits > 0 ? totalPoints / totalCredits : 0;
    }

    return futureGPA;
  }, [courses, currentGPA, currentCredits, scale]);

  const projectedGPA = calculateProjectedGPA();
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
        <View style={styles.scaleToggle}>
          <ThemedText style={[styles.scaleLabel, { color: theme.textSecondary }]}>
            GPA Scale:
          </ThemedText>
          <View style={styles.scaleButtons}>
            {(["US", "AU"] as GPAScale[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  setScale(s);
                  setSelectedGrade(SCALE_CONFIG[s].grades[0]);
                }}
                style={[
                  styles.scaleButton,
                  {
                    backgroundColor: scale === s ? theme.primary : theme.backgroundDefault,
                    borderColor: scale === s ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.scaleButtonText,
                    { color: scale === s ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {SCALE_CONFIG[s].label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.projectedCard,
            { backgroundColor: theme.gpaBackground, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.projectedLabel, { color: theme.textSecondary }]}>
            Projected GPA
          </ThemedText>
          <View style={styles.projectedValueRow}>
            <ThemedText style={[styles.projectedValue, { color: theme.primary }]}>
              {courses.length > 0 || (currentGPA && currentCredits) ? projectedGPA.toFixed(2) : "—"}
            </ThemedText>
            {(courses.length > 0 || (currentGPA && currentCredits)) ? (
              <ThemedText style={[styles.projectedOutOf, { color: theme.textSecondary }]}>
                {` / ${config.max.toFixed(1)}`}
              </ThemedText>
            ) : null}
          </View>
          <ThemedText style={[styles.projectedHint, { color: theme.textSecondary }]}>
            Based on your expected grades
          </ThemedText>
        </View>

        <View
          style={[
            styles.inputCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Current Standing (Optional)</ThemedText>
          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
            Enter your current GPA and credits to see how new courses affect your cumulative GPA
          </ThemedText>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <ThemedText style={styles.inputLabel}>Current GPA</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundRoot,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={currentGPA}
                onChangeText={setCurrentGPA}
                placeholder="e.g., 3.5"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <ThemedText style={styles.inputLabel}>Total Credits</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundRoot,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={currentCredits}
                onChangeText={setCurrentCredits}
                placeholder="e.g., 60"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.inputCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Expected Courses</ThemedText>

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
            placeholder="e.g., Physics II"
            placeholderTextColor={theme.textSecondary}
          />

          <ThemedText style={styles.inputLabel}>Expected Grade</ThemedText>
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

          <Button onPress={handleAddCourse} disabled={isAddDisabled} style={styles.addButton}>
            Add Expected Course
          </Button>
        </View>

        {courses.length > 0 ? (
          <View style={styles.coursesSection}>
            <ThemedText style={styles.coursesTitle}>Expected Courses</ThemedText>
            <View style={styles.courseList}>
              {courses.map((course) => (
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
                      Expected: {course.expectedGrade} | Credits: {course.credits}
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
  scaleToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scaleLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  scaleButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scaleButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  scaleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  projectedCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  projectedLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  projectedValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginVertical: Spacing.sm,
  },
  projectedValue: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
  },
  projectedOutOf: {
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 32,
  },
  projectedHint: {
    fontSize: 12,
  },
  inputCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
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

import React, { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type GPAScale = "US" | "AU";

interface Course {
  id: string;
  name: string;
  grade: string;
  credits: number;
}

const US_GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
const AU_GRADES = ["HD", "D", "C", "P", "F"];

const US_GRADE_POINTS: Record<string, number> = {
  "A": 4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B": 3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C": 2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D": 1.0,
  "D-": 0.7,
  "F": 0.0,
};

const AU_GRADE_POINTS: Record<string, number> = {
  "HD": 7.0,
  "D": 6.0,
  "C": 5.0,
  "P": 4.0,
  "F": 0.0,
};

const US_CREDIT_OPTIONS = [1, 2, 3, 4, 5, 6];
const AU_CREDIT_OPTIONS = [10, 20];

const SCALE_CONFIG = {
  US: { 
    grades: US_GRADES, 
    points: US_GRADE_POINTS, 
    max: 4.0, 
    label: "US (4.0)",
    creditLabel: "Credit Hours",
    creditOptions: US_CREDIT_OPTIONS,
    gpaLabel: "GPA (4.0 scale)",
  },
  AU: { 
    grades: AU_GRADES, 
    points: AU_GRADE_POINTS, 
    max: 7.0, 
    label: "AU (7.0)",
    creditLabel: "Credit Points",
    creditOptions: AU_CREDIT_OPTIONS,
    gpaLabel: "GPA (7.0 scale)",
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GradeSelector({
  selectedGrade,
  onSelectGrade,
  scale,
}: {
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  scale: GPAScale;
}) {
  const { theme } = useTheme();
  const grades = SCALE_CONFIG[scale].grades;

  return (
    <View style={styles.gradeContainer}>
      <ThemedText style={styles.inputLabel}>Grade</ThemedText>
      <View style={styles.gradeGrid}>
        {grades.map((grade) => {
          const isSelected = selectedGrade === grade;
          return (
            <Pressable
              key={grade}
              onPress={() => onSelectGrade(grade)}
              style={[
                styles.gradeButton,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.backgroundDefault,
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
    </View>
  );
}

function CourseItem({
  course,
  onDelete,
}: {
  course: Course;
  onDelete: (id: string) => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const confirmDelete = () => {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${course.name}"?`)) {
        onDelete(course.id);
      }
    } else {
      Alert.alert(
        "Delete Course",
        `Are you sure you want to delete "${course.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(course.id) },
        ]
      );
    }
  };

  return (
    <Animated.View
      style={[
        styles.courseItem,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={styles.courseInfo}>
        <ThemedText style={styles.courseName}>{course.name}</ThemedText>
        <ThemedText style={[styles.courseDetails, { color: theme.textSecondary }]}>
          Grade: {course.grade} | Credits: {course.credits}
        </ThemedText>
      </View>
      <AnimatedPressable
        onPress={confirmDelete}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.deleteButton}
        hitSlop={12}
      >
        <Feather name="trash-2" size={20} color={theme.destructive} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function GPACalculatorScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [courseName, setCourseName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("A");
  const [credits, setCredits] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [scale, setScale] = useState<GPAScale>("US");

  const scaleConfig = SCALE_CONFIG[scale];

  const getStorageKey = (s: GPAScale) => `@gpa_courses_${s}`;

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const stored = await AsyncStorage.getItem(getStorageKey(scale));
        if (stored) {
          setCourses(JSON.parse(stored));
        } else {
          setCourses([]);
        }
      } catch {
        setCourses([]);
      }
    };
    loadCourses();
  }, [scale]);

  useEffect(() => {
    const saveCourses = async () => {
      try {
        await AsyncStorage.setItem(getStorageKey(scale), JSON.stringify(courses));
      } catch {
        // Storage error - silent fail
      }
    };
    saveCourses();
  }, [courses, scale]);

  const handleScaleChange = (newScale: GPAScale) => {
    setScale(newScale);
    setSelectedGrade(SCALE_CONFIG[newScale].grades[0]);
    setCredits("");
  };

  const calculateGPA = useCallback(() => {
    if (courses.length === 0) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach((course) => {
      const gradePoint = scaleConfig.points[course.grade] ?? 0;
      totalPoints += gradePoint * course.credits;
      totalCredits += course.credits;
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }, [courses, scaleConfig]);

  const gpa = calculateGPA();

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
    if (isNaN(creditValue) || !scaleConfig.creditOptions.includes(creditValue)) {
      if (Platform.OS === "web") {
        window.alert(`Please select valid ${scaleConfig.creditLabel.toLowerCase()}`);
      } else {
        Alert.alert("Invalid Credits", `Please select a valid ${scaleConfig.creditLabel.toLowerCase()} value`);
      }
      return;
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName.trim(),
      grade: selectedGrade,
      credits: creditValue,
    };

    setCourses((prev) => [...prev, newCourse]);
    setCourseName("");
    setCredits("");
    setSelectedGrade("A");
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((course) => course.id !== id));
  };

  const handleClearAll = () => {
    if (courses.length === 0) return;

    if (Platform.OS === "web") {
      if (window.confirm("Clear all courses? This cannot be undone.")) {
        setCourses([]);
      }
    } else {
      Alert.alert(
        "Clear All Courses",
        "Are you sure you want to clear all courses? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear All", style: "destructive", onPress: () => setCourses([]) },
        ]
      );
    }
  };

  const isAddDisabled = !courseName.trim() || !credits.trim();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingTop: headerHeight + Spacing.lg,
              paddingBottom: insets.bottom + 100,
            },
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.scaleToggle}>
            <ThemedText style={[styles.scaleLabel, { color: theme.textSecondary }]}>
              GPA Scale:
            </ThemedText>
            <View style={styles.scaleButtons}>
              {(["US", "AU"] as GPAScale[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => handleScaleChange(s)}
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

          <GradeSelector
            selectedGrade={selectedGrade}
            onSelectGrade={setSelectedGrade}
            scale={scale}
          />

          <ThemedText style={styles.inputLabel}>{scaleConfig.creditLabel}</ThemedText>
          <View style={styles.creditGrid}>
            {scaleConfig.creditOptions.map((option) => {
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

          <Button
            onPress={handleAddCourse}
            disabled={isAddDisabled}
            style={styles.addButton}
          >
            Add Course
          </Button>
        </View>

        <View
          style={[
            styles.gpaCard,
            { backgroundColor: theme.gpaBackground, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.gpaLabel, { color: theme.textSecondary }]}>
            {scaleConfig.gpaLabel}
          </ThemedText>
          <View style={styles.gpaValueRow}>
            <ThemedText style={[styles.gpaValue, { color: theme.primary }]}>
              {courses.length > 0 ? gpa.toFixed(2) : "—"}
            </ThemedText>
            {courses.length > 0 ? (
              <ThemedText style={[styles.gpaOutOf, { color: theme.textSecondary }]}>
                {` / ${scaleConfig.max.toFixed(1)}`}
              </ThemedText>
            ) : null}
          </View>
          {courses.length > 0 ? (
            <ThemedText style={[styles.gpaSummary, { color: theme.textSecondary }]}>
              {courses.length} course{courses.length !== 1 ? "s" : ""} |{" "}
              {courses.reduce((sum, c) => sum + c.credits, 0)} credits
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.coursesSection}>
          <View style={styles.coursesHeader}>
            <ThemedText style={styles.coursesTitle}>Courses</ThemedText>
            {courses.length > 0 ? (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText style={styles.countBadgeText}>
                  {courses.length}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="book" size={32} color={theme.textSecondary} />
              <ThemedText
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No courses added yet
              </ThemedText>
            </View>
          ) : (
            <View style={styles.courseList}>
              {courses.map((course) => (
                <CourseItem
                  key={course.id}
                  course={course}
                  onDelete={handleDeleteCourse}
                />
              ))}
            </View>
          )}
        </View>

        {courses.length > 0 ? (
          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [
              styles.clearButton,
              { borderColor: theme.destructive, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText style={[styles.clearButtonText, { color: theme.destructive }]}>
              Clear All Courses
            </ThemedText>
          </Pressable>
        ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
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
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  gradeContainer: {
    marginBottom: Spacing.md,
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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
  coursesSection: {
    gap: Spacing.md,
  },
  coursesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  coursesTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
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
  clearButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

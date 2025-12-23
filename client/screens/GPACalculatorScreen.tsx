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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { usePremium } from "@/contexts/PremiumContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  GPAScale,
  Course,
  SCALE_CONFIG,
  calculateGPA,
  DEFAULT_WEIGHT_MULTIPLIERS,
} from "@/types/gpa";

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

  const handleGradeSelect = (grade: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onSelectGrade(grade);
  };

  return (
    <View style={styles.gradeContainer}>
      <ThemedText style={styles.inputLabel}>Grade</ThemedText>
      <View style={styles.gradeGrid}>
        {grades.map((grade) => {
          const isSelected = selectedGrade === grade;
          return (
            <Pressable
              key={grade}
              onPress={() => handleGradeSelect(grade)}
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
        <View style={styles.courseNameRow}>
          <ThemedText style={styles.courseName}>{course.name}</ThemedText>
          {course.isWeighted && course.weightType && course.weightType !== "Standard" ? (
            <View style={[styles.weightBadge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.weightBadgeText}>{course.weightType}</ThemedText>
            </View>
          ) : null}
        </View>
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

export default function GPACalculatorScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [courseName, setCourseName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("A");
  const [credits, setCredits] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [scale, setScale] = useState<GPAScale>("US");
  const [useWeightedGPA, setUseWeightedGPA] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  const [weightType, setWeightType] = useState<"AP" | "Honours" | "Standard">("AP");

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
    if (newScale !== "US") {
      setUseWeightedGPA(false);
    }
  };

  const hasWeightedCourses = courses.some(c => c.isWeighted);

  useEffect(() => {
    if (!hasWeightedCourses || scale !== "US") {
      setUseWeightedGPA(false);
    }
  }, [hasWeightedCourses, scale]);

  const gpa = calculateGPA(courses, scale, isPremium && useWeightedGPA, DEFAULT_WEIGHT_MULTIPLIERS);

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
      isWeighted: isPremium && isWeighted,
      weightType: isPremium && isWeighted ? weightType : "Standard",
    };

    setCourses((prev) => [...prev, newCourse]);
    setCourseName("");
    setCredits("");
    setSelectedGrade(scaleConfig.grades[0]);
    setIsWeighted(false);
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
              paddingBottom: 40,
              flexGrow: 1,
            },
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={true}
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
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync();
                    }
                    setCredits(option.toString());
                  }}
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

          {isPremium && scale === "US" ? (
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
          ) : !isPremium && scale === "US" ? (
            <Pressable
              onPress={() => navigation.navigate("UnlockPremium")}
              style={[styles.premiumHint, { borderColor: theme.border }]}
            >
              <Feather name="lock" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.premiumHintText, { color: theme.textSecondary }]}>
                Unlock Premium for weighted GPA (AP/Honours)
              </ThemedText>
            </Pressable>
          ) : null}

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
            {useWeightedGPA ? "Weighted GPA (5.0 scale)" : scaleConfig.gpaLabel}
          </ThemedText>
          <View style={styles.gpaValueRow}>
            <ThemedText style={[styles.gpaValue, { color: theme.primary }]}>
              {courses.length > 0 ? gpa.toFixed(2) : "—"}
            </ThemedText>
            {courses.length > 0 ? (
              <ThemedText style={[styles.gpaOutOf, { color: theme.textSecondary }]}>
                {` / ${useWeightedGPA ? scaleConfig.weightedMax.toFixed(1) : scaleConfig.max.toFixed(1)}`}
              </ThemedText>
            ) : null}
          </View>
          {courses.length > 0 ? (
            <ThemedText style={[styles.gpaSummary, { color: theme.textSecondary }]}>
              {courses.length} course{courses.length !== 1 ? "s" : ""} |{" "}
              {courses.reduce((sum, c) => sum + c.credits, 0)} credits
            </ThemedText>
          ) : null}
          {isPremium && scale === "US" && hasWeightedCourses ? (
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
  weightedSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  weightedToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  premiumHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: Spacing.md,
  },
  premiumHintText: {
    fontSize: 13,
    flex: 1,
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
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 48,
  },
  gpaOutOf: {
    fontSize: 22,
    fontWeight: "500",
  },
  gpaSummary: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  weightedGPAToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  weightedGPAToggleText: {
    fontSize: 14,
    fontWeight: "500",
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
  courseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  weightBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  weightBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
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

import React, { useState, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Semester, calculateGPA, SCALE_CONFIG } from "@/types/gpa";

const SEMESTERS_KEY = "@gpa_semesters";
const CHART_WIDTH = Dimensions.get("window").width - Spacing.lg * 2;
const CHART_HEIGHT = 220;
const PADDING = 50;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [semesters, setSemesters] = useState<Semester[]>([]);

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

  const semesterData = semesters.map((semester) => ({
    name: semester.name,
    gpa: calculateGPA(semester.courses, semester.scale),
    courses: semester.courses.length,
    credits: semester.courses.reduce((sum, c) => sum + c.credits, 0),
    scale: semester.scale,
  }));

  const maxGPA = semesters.length > 0 ? SCALE_CONFIG[semesters[0].scale].max : 4.0;
  const avgGPA = semesterData.length > 0
    ? semesterData.reduce((sum, s) => sum + s.gpa, 0) / semesterData.length
    : 0;
  const totalCredits = semesterData.reduce((sum, s) => sum + s.credits, 0);
  const totalCourses = semesterData.reduce((sum, s) => sum + s.courses, 0);

  const renderChart = () => {
    if (semesterData.length < 2) {
      return (
        <View style={styles.noChartData}>
          <Feather name="bar-chart-2" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.noChartText, { color: theme.textSecondary }]}>
            Add at least 2 semesters to see trends
          </ThemedText>
        </View>
      );
    }

    const width = CHART_WIDTH;
    const height = CHART_HEIGHT;
    const graphWidth = width - PADDING * 2;
    const graphHeight = height - PADDING * 2;

    const xStep = graphWidth / (semesterData.length - 1);
    const yScale = graphHeight / maxGPA;

    const points = semesterData.map((data, index) => ({
      x: PADDING + index * xStep,
      y: height - PADDING - data.gpa * yScale,
    }));

    const pathData = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    return (
      <Svg width={width} height={height}>
        {[0, maxGPA / 4, maxGPA / 2, (maxGPA * 3) / 4, maxGPA].map((val, i) => {
          const y = height - PADDING - val * yScale;
          return (
            <React.Fragment key={i}>
              <Line
                x1={PADDING}
                y1={y}
                x2={width - PADDING}
                y2={y}
                stroke={theme.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={PADDING - 8}
                y={y + 4}
                fill={theme.textSecondary}
                fontSize={10}
                textAnchor="end"
              >
                {val.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Path
          d={pathData}
          fill="none"
          stroke={theme.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <React.Fragment key={index}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={6}
              fill={theme.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            <SvgText
              x={point.x}
              y={height - PADDING + 20}
              fill={theme.textSecondary}
              fontSize={10}
              textAnchor="middle"
            >
              {semesterData[index].name.substring(0, 8)}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    );
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
        <ThemedText style={styles.sectionTitle}>GPA Analytics</ThemedText>

        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {semesterData.length > 0 ? avgGPA.toFixed(2) : "—"}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Average GPA
            </ThemedText>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {semesters.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Semesters
            </ThemedText>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {totalCourses}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Courses
            </ThemedText>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {totalCredits}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Credits
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <ThemedText style={styles.chartTitle}>GPA Trend</ThemedText>
          <View style={styles.chartContainer}>{renderChart()}</View>
        </View>

        {semesterData.length > 0 ? (
          <View
            style={[
              styles.tableCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText style={styles.tableTitle}>Semester Breakdown</ThemedText>
            <View style={styles.table}>
              <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                <ThemedText style={[styles.tableHeaderCell, styles.tableNameCell]}>
                  Semester
                </ThemedText>
                <ThemedText style={styles.tableHeaderCell}>GPA</ThemedText>
                <ThemedText style={styles.tableHeaderCell}>Courses</ThemedText>
                <ThemedText style={styles.tableHeaderCell}>Credits</ThemedText>
              </View>
              {semesterData.map((data, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index < semesterData.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                  ]}
                >
                  <ThemedText style={[styles.tableCell, styles.tableNameCell]} numberOfLines={1}>
                    {data.name}
                  </ThemedText>
                  <ThemedText style={[styles.tableCell, { color: theme.primary, fontWeight: "600" }]}>
                    {data.gpa.toFixed(2)}
                  </ThemedText>
                  <ThemedText style={styles.tableCell}>{data.courses}</ThemedText>
                  <ThemedText style={styles.tableCell}>{data.credits}</ThemedText>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    flexGrow: 0,
    flexShrink: 0,
    padding: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  chartCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  chartContainer: {
    alignItems: "center",
  },
  noChartData: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  noChartText: {
    fontSize: 14,
    textAlign: "center",
  },
  tableCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  table: {
    gap: 0,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  tableNameCell: {
    flex: 2,
    textAlign: "left",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
  },
});

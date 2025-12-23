export type GPAScale = "US" | "AU";

export interface Course {
  id: string;
  name: string;
  grade: string;
  credits: number;
  isWeighted?: boolean;
  weightType?: "AP" | "Honours" | "Standard";
}

export interface Semester {
  id: string;
  name: string;
  term: string;
  courses: Course[];
  scale: GPAScale;
}

export interface Profile {
  id: string;
  name: string;
  scale: GPAScale;
  semesters: Semester[];
  weightMultipliers: WeightMultipliers;
  createdAt: number;
  updatedAt: number;
}

export interface WeightMultipliers {
  AP: number;
  Honours: number;
  Standard: number;
}

export interface PredictionCourse {
  id: string;
  name: string;
  expectedGrade: string;
  credits: number;
  isWeighted?: boolean;
  weightType?: "AP" | "Honours" | "Standard";
}

export interface PredictionScenario {
  id: string;
  profileId: string;
  name: string;
  courses: PredictionCourse[];
  createdAt: number;
}

export const DEFAULT_WEIGHT_MULTIPLIERS: WeightMultipliers = {
  AP: 1.0,
  Honours: 0.5,
  Standard: 0,
};

export const US_GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
export const AU_GRADES = ["HD", "D", "C", "P", "F"];

export const US_GRADE_POINTS: Record<string, number> = {
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

export const AU_GRADE_POINTS: Record<string, number> = {
  "HD": 7.0,
  "D": 6.0,
  "C": 5.0,
  "P": 4.0,
  "F": 0.0,
};

export const US_CREDIT_OPTIONS = [1, 2, 3, 4, 5, 6];
export const AU_CREDIT_OPTIONS = [10, 20];

export const SCALE_CONFIG = {
  US: {
    grades: US_GRADES,
    points: US_GRADE_POINTS,
    max: 4.0,
    weightedMax: 5.0,
    label: "US (4.0)",
    creditLabel: "Credit Hours",
    creditOptions: US_CREDIT_OPTIONS,
    gpaLabel: "GPA (4.0 scale)",
  },
  AU: {
    grades: AU_GRADES,
    points: AU_GRADE_POINTS,
    max: 7.0,
    weightedMax: 7.0,
    label: "AU (7.0)",
    creditLabel: "Credit Points",
    creditOptions: AU_CREDIT_OPTIONS,
    gpaLabel: "GPA (7.0 scale)",
  },
};

export function calculateGPA(
  courses: Course[],
  scale: GPAScale,
  useWeighting: boolean = false,
  multipliers: WeightMultipliers = DEFAULT_WEIGHT_MULTIPLIERS
): number {
  if (courses.length === 0) return 0;

  const config = SCALE_CONFIG[scale];
  let totalPoints = 0;
  let totalCredits = 0;

  courses.forEach((course) => {
    const baseGradePoint = config.points[course.grade] ?? 0;
    let gradePoint = baseGradePoint;

    if (useWeighting && course.isWeighted && course.weightType && scale === "US") {
      gradePoint = baseGradePoint + multipliers[course.weightType];
    }

    totalPoints += gradePoint * course.credits;
    totalCredits += course.credits;
  });

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

export function calculateCumulativeGPA(
  semesters: Semester[],
  useWeighting: boolean = false,
  multipliers: WeightMultipliers = DEFAULT_WEIGHT_MULTIPLIERS
): number {
  const allCourses = semesters.flatMap((s) => s.courses);
  if (allCourses.length === 0) return 0;

  const scale = semesters[0]?.scale || "US";
  return calculateGPA(allCourses, scale, useWeighting, multipliers);
}

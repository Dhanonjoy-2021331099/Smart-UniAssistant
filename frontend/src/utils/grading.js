export const GRADE_POINTS = {
  "A+": 4.0,
  A: 3.75,
  "A-": 3.5,
  "B+": 3.25,
  B: 3.0,
  "B-": 2.75,
  "C+": 2.5,
  C: 2.25,
  D: 2.0,
  F: 0.0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

export const gradePoint = (grade) => GRADE_POINTS[grade] ?? 0;

export const calculateSemesterGPA = (courses) => {
  const entries = (courses || []).filter(
    (course) => course.grade && Number(course.credits) > 0,
  );
  const totalCredits = entries.reduce(
    (sum, course) => sum + Number(course.credits),
    0,
  );
  if (totalCredits === 0) {
    return 0;
  }
  const totalPoints = entries.reduce(
    (sum, course) => sum + Number(course.credits) * gradePoint(course.grade),
    0,
  );
  return totalPoints / totalCredits;
};

export const calculateOverallCGPA = (records) => {
  const entries = (records || []).filter(
    (record) => Number(record.credits) > 0 && Number(record.gpa) > 0,
  );
  const totalCredits = entries.reduce(
    (sum, record) => sum + Number(record.credits),
    0,
  );
  if (totalCredits === 0) {
    return 0;
  }
  const totalPoints = entries.reduce(
    (sum, record) => sum + Number(record.credits) * Number(record.gpa),
    0,
  );
  return totalPoints / totalCredits;
};

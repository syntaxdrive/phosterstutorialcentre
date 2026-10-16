export type UserRole = "student" | "tutor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  jambRegistrationNumber?: string;
  enrolledSubjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  iconName: string;
  tutorName: string;
  totalLectures: number;
  totalTests: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  durationSeconds: number;
  isFreePreview: boolean;
  type: "video" | "document" | "quiz";
  videoUrl?: string;
}

export interface CourseModule {
  id: string;
  orderIndex: number;
  title: string;
  lessons: Lesson[];
}

export interface CourseInstructor {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
}

export interface Course {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  extendedDescription: string;
  videoThumbnailUrl: string;
  previewVideoUrl: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  level: string;
  enrolledCount: number;
  totalDuration: string;
  lastUpdated: string;
  certificateOffered: boolean;
  instructors: CourseInstructor[];
  whatWillLearn: string[];
  requirements: string[];
  tags: string[];
  targetAudience: string[];
  materialIncludes: string[];
  modules: CourseModule[];
}

export interface CbtQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  diagramUrl?: string;
  topic?: string;
}

export interface CbtExam {
  id: string;
  subjectId: string;
  title: string;
  durationMinutes: number;
  questions: CbtQuestion[];
  instructions?: string;
}

export interface CbtResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  total: number;
  percentage: number;
  answers: Record<number, "A" | "B" | "C" | "D">;
  timeSpentSeconds: number;
  submittedAt: string;
}

export interface TutorTimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  isSelected?: boolean;
}

export interface TutorReview {
  id: string;
  studentName: string;
  avatarUrl: string;
  rating: number;
  scoreAchievement?: string;
  comment: string;
  date: string;
}

export interface TutorProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  isTopTutor: boolean;
  rating: number;
  reviewsCount: number;
  bio: string;
  tags: string[];
  experienceYears: number;
  coursesCount: number;
  studentsCount: number;
  testsConducted: number;
  monthlyRate: number;
  introVideoUrl: string;
  introVideoThumbnail: string;
  ratingsBreakdown: {
    subjectMastery: number;
    clarityAndPatience: number;
    responsiveness: number;
  };
  reviews: TutorReview[];
  availableSlots: TutorTimeSlot[];
}

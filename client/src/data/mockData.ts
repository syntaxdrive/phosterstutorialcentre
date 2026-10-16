import type { Course, TutorProfile, CbtExam, User } from "../types";

export const currentUser: User = {
  id: "usr_student_01",
  name: "Daniel O.",
  email: "daniel@phosters.edu.ng",
  role: "student",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  jambRegistrationNumber: "PHO-2026-042",
  enrolledSubjects: ["physics", "maths", "chemistry", "english"]
};

export const sampleCourse: Course = {
  id: "course_phy_01",
  subjectId: "physics",
  title: "Comprehensive JAMB & Post-UTME Physics: Mechanics, Waves & Modern Physics",
  description:
    "Node.js is probably THE most popular and modern server-side programming language you can dive into these days! In this foundational faculty course, we apply similar rigorous structural thinking to Physics calculations and theory.",
  extendedDescription:
    "This masterclass prepares candidates for maximum distinction scores in JAMB UTME, WAEC SSCE, and top-tier University Post-UTME examinations. From Projectile Motion and Wave Mechanics over Faraday's Laws all the way to Modern Nuclear Physics, each topic is broken down with formula derivations, conceptual shortcuts, and real past exam breakdowns.",
  videoThumbnailUrl:
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
  previewVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  price: 129.99,
  originalPrice: 195.99,
  discountPercentage: 75,
  level: "Beginner Level (SS3 / JAMB)",
  enrolledCount: 16097,
  totalDuration: "6 hour 34 minute Duration",
  lastUpdated: "10 Nov, 2026 Last Updated",
  certificateOffered: true,
  instructors: [
    {
      id: "inst_01",
      name: "Joseph Robbins",
      title: "UX Engineer & Developer",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: "inst_02",
      name: "Savannah Nguyen",
      title: "Animator & Science Visualizer",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
    }
  ],
  whatWillLearn: [
    "Understand the core concepts of mechanics and wave physics",
    "Create systems for self sustainability in formula recall",
    "Start a drop shipping store within a few hours or master calculations",
    "Earn money from your new skills or gain top university admission",
    "Learn the formulas to making profits and calculating vectors"
  ],
  requirements: [
    "Understand the core algebraic concepts",
    "Learn the formulas to solving multi-step equations",
    "Create disciplined daily revision blocks",
    "Acquire past question examination papers"
  ],
  tags: ["Craft", "Illustration", "Graphic Design", "UI & UX", "Physics", "JAMB 2026"],
  targetAudience: [
    "Secondary school scholars preparing for JAMB UTME",
    "Candidates targeting University Post-UTME exams",
    "Students aiming for distinction scores in SSCE Physics"
  ],
  materialIncludes: [
    "34 hours on-demand video lectures",
    "45 articles and downloadable PDF handouts",
    "Full lifetime course access",
    "Access on mobile devices and desktop"
  ],
  modules: [
    {
      id: "mod_01",
      orderIndex: 1,
      title: "01. Overview",
      lessons: [
        {
          id: "les_1",
          title: "Introduction",
          duration: "1m 10s",
          durationSeconds: 70,
          isFreePreview: true,
          type: "video"
        },
        {
          id: "les_2",
          title: "What is Exposure?",
          duration: "1m 10s",
          durationSeconds: 70,
          isFreePreview: false,
          type: "document"
        },
        {
          id: "les_3",
          title: "The Exposure Triangle",
          duration: "1m 10s",
          durationSeconds: 70,
          isFreePreview: false,
          type: "video"
        },
        {
          id: "les_4",
          title: "Adding the Right React Version to Codepen",
          duration: "1m 10s",
          durationSeconds: 70,
          isFreePreview: true,
          type: "document"
        },
        {
          id: "les_5",
          title: "The most popular and modern server",
          duration: "1m 10s",
          durationSeconds: 70,
          isFreePreview: false,
          type: "document"
        }
      ]
    },
    {
      id: "mod_02",
      orderIndex: 2,
      title: "02. Putting It All Together",
      lessons: [
        {
          id: "les_6",
          title: "Combining Shutter Speed and Aperture",
          duration: "3m 45s",
          durationSeconds: 225,
          isFreePreview: false,
          type: "video"
        }
      ]
    },
    {
      id: "mod_03",
      orderIndex: 3,
      title: "03. Using ES6, NPM, Babel and Webpack",
      lessons: [
        {
          id: "les_7",
          title: "Modern Build Workflow for Calculations",
          duration: "5m 20s",
          durationSeconds: 320,
          isFreePreview: false,
          type: "video"
        }
      ]
    },
    {
      id: "mod_04",
      orderIndex: 4,
      title: "04. A Modern Setup: Installing Node.js and NPM",
      lessons: [
        {
          id: "les_8",
          title: "Setting up Scientific Calculators and Tools",
          duration: "2m 15s",
          durationSeconds: 135,
          isFreePreview: false,
          type: "video"
        }
      ]
    },
    {
      id: "mod_05",
      orderIndex: 5,
      title: "05. Functions Returning Functions",
      lessons: [
        {
          id: "les_9",
          title: "Higher Order Formula Derivations",
          duration: "4m 50s",
          durationSeconds: 290,
          isFreePreview: false,
          type: "video"
        }
      ]
    }
  ]
};

export const sampleTutorProfile: TutorProfile = {
  id: "tutor_jenny",
  name: "Jenny Wilson",
  title: "Economics teacher",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80",
  isTopTutor: true,
  rating: 4.9,
  reviewsCount: 236,
  bio: "Hello Student! Economics isn't just a subject - it's the lens through which we view society. I will help you explore its profound implications. From micro to macroeconomics, discover the keys to understanding economic phenomena in my comprehensive courses.",
  tags: [
    "Economics",
    "Financial Theory",
    "Management",
    "Politics",
    "Finance",
    "International Economy",
    "Business English",
    "Time Management",
    "Global Economy",
    "Oxford",
    "Microeconomics",
    "IELTS"
  ],
  experienceYears: 7,
  coursesCount: 24,
  studentsCount: 250,
  testsConducted: 132,
  monthlyRate: 32,
  introVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  introVideoThumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
  ratingsBreakdown: {
    subjectMastery: 4.9,
    clarityAndPatience: 4.8,
    responsiveness: 5.0
  },
  reviews: [
    {
      id: "rev_01",
      studentName: "Cynthia W.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      rating: 5.0,
      scoreAchievement: "Student",
      comment: "Absolutely brilliant course, trust me! Jenny's deep knowledge of economics, coupled with her engaging teaching style, made every lesson a pleasure!",
      date: "2 days ago"
    },
    {
      id: "rev_02",
      studentName: "Brian B.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      rating: 5.0,
      scoreAchievement: "Student",
      comment: "Invaluable experience, tons of useful knowledge.",
      date: "1 week ago"
    },
    {
      id: "rev_03",
      studentName: "Juliet M.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      rating: 5.0,
      scoreAchievement: "Student",
      comment: "I can't recommend this course enough! Jenny's passion for economics is contagious, and her ability to simplify complex concepts - just wow and wow!",
      date: "2 weeks ago"
    }
  ],
  availableSlots: [
    { id: "s1", time: "8:30", isAvailable: true },
    { id: "s2", time: "9:00", isAvailable: true },
    { id: "s3", time: "9:30", isAvailable: true },
    { id: "s4", time: "10:00", isAvailable: true },
    { id: "s5", time: "10:30", isAvailable: true },
    { id: "s6", time: "11:00", isAvailable: true },
    { id: "s7", time: "11:30", isAvailable: true },
    { id: "s8", time: "12:00", isAvailable: true },
    { id: "s9", time: "12:30", isAvailable: true },
    { id: "s10", time: "13:00", isAvailable: true },
    { id: "s11", time: "13:30", isAvailable: true, isSelected: true },
    { id: "s12", time: "14:00", isAvailable: true },
    { id: "s13", time: "14:30", isAvailable: true },
    { id: "s14", time: "15:00", isAvailable: true },
    { id: "s15", time: "15:30", isAvailable: true },
    { id: "s16", time: "16:00", isAvailable: true },
    { id: "s17", time: "16:30", isAvailable: true },
    { id: "s18", time: "17:00", isAvailable: true },
    { id: "s19", time: "17:30", isAvailable: true },
    { id: "s20", time: "18:00", isAvailable: true },
    { id: "s21", time: "18:30", isAvailable: true },
    { id: "s22", time: "19:00", isAvailable: true },
    { id: "s23", time: "19:30", isAvailable: true },
    { id: "s24", time: "20:00", isAvailable: true },
    { id: "s25", time: "20:30", isAvailable: true }
  ]
};

export const sampleCbtExam: CbtExam = {
  id: "test_jamb_phy_2026",
  subjectId: "physics",
  title: "JAMB UTME 2026 Physics National Mock Examination (Mechanics & Waves)",
  durationMinutes: 15,
  instructions: "Answer all questions. Use keyboard shortcuts A, B, C, D to select answers, N for Next, and P for Previous.",
  questions: [
    {
      id: "q1",
      question: "A projectile is launched from ground level with an initial velocity of 40 m/s at an elevation angle of 30° to the horizontal. Assuming the acceleration due to gravity g = 10 m/s², what is the maximum height attained by the projectile?",
      options: ["10 meters", "20 meters", "40 meters", "80 meters"],
      correctAnswer: "B",
      explanation: "Maximum height H = (u² * sin²θ) / (2g). Here u = 40 m/s, θ = 30° (sin 30° = 0.5), and g = 10 m/s². Therefore H = (40² * 0.5²) / (2 * 10) = (1600 * 0.25) / 20 = 400 / 20 = 20 meters.",
      topic: "Projectile Motion"
    },
    {
      id: "q2",
      question: "Which of the following physical quantities is a fundamental SI base unit in classical mechanics?",
      options: ["Newton", "Joule", "Kilogram", "Watt"],
      correctAnswer: "C",
      explanation: "Kilogram (kg) is one of the seven base SI units. Newton, Joule, and Watt are derived units representing force, energy, and power respectively.",
      topic: "Units & Dimensions"
    },
    {
      id: "q3",
      question: "A body of mass 5 kg moves in a horizontal circle of radius 2 meters with a constant linear velocity of 6 m/s. Calculate the magnitude of the centripetal force acting on the body.",
      options: ["45 Newtons", "90 Newtons", "180 Newtons", "360 Newtons"],
      correctAnswer: "B",
      explanation: "Centripetal force Fc = (m * v²) / r = (5 * 6²) / 2 = (5 * 36) / 2 = 180 / 2 = 90 Newtons.",
      topic: "Circular Motion"
    },
    {
      id: "q4",
      question: "A stone is dropped from the top of a cliff and hits the ground after 4 seconds. Calculate the height of the cliff. (Take g = 10 m/s²).",
      options: ["40 meters", "60 meters", "80 meters", "100 meters"],
      correctAnswer: "C",
      explanation: "Using the kinematic equation h = ut + 0.5 * g * t². Since initial velocity u = 0, h = 0.5 * 10 * 4² = 5 * 16 = 80 meters.",
      topic: "Linear Kinematics"
    },
    {
      id: "q5",
      question: "Two capacitors of capacitances 4 µF and 6 µF are connected in series across a 100V direct current power supply. What is the equivalent capacitance of the combination?",
      options: ["2.4 µF", "5.0 µF", "10.0 µF", "24.0 µF"],
      correctAnswer: "A",
      explanation: "For capacitors connected in series: 1/Ceq = 1/C1 + 1/C2 = 1/4 + 1/6 = (3+2)/12 = 5/12. Therefore Ceq = 12/5 = 2.4 µF.",
      topic: "Capacitance & Electrostatics"
    }
  ]
};

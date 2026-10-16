import { useState } from "react";
import { Sidebar, type ActiveTab } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { VideoPlayer } from "./components/course/VideoPlayer";
import { CurriculumAccordion } from "./components/course/CurriculumAccordion";
import { CourseMetaSidebar } from "./components/course/CourseMetaSidebar";
import { TutorProfileHeader } from "./components/tutor/TutorProfileHeader";
import { SchedulePicker } from "./components/tutor/SchedulePicker";
import { TutorSidebarCard } from "./components/tutor/TutorSidebarCard";
import { CbtExamView } from "./components/cbt/CbtExamView";
import { CbtScorecardModal } from "./components/cbt/CbtScorecardModal";
import {
  sampleCourse,
  sampleTutorProfile,
  sampleCbtExam,
  currentUser
} from "./data/mockData";
import type { CbtResult } from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("course");
  const [activeExamResult, setActiveExamResult] = useState<CbtResult | null>(null);
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);

  // Handle CBT Completion
  const handleFinishExam = (
    answers: Record<number, "A" | "B" | "C" | "D">,
    timeSpent: number
  ) => {
    let score = 0;
    sampleCbtExam.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        score++;
      }
    });

    const total = sampleCbtExam.questions.length;
    const percentage = total > 0 ? (score / total) * 100 : 0;

    const result: CbtResult = {
      id: "res_" + Date.now(),
      examId: sampleCbtExam.id,
      studentId: currentUser.id,
      score,
      total,
      percentage,
      answers,
      timeSpentSeconds: timeSpent,
      submittedAt: new Date().toISOString()
    };

    setActiveExamResult(result);
    setIsExamRunning(false);
  };

  const breadcrumbs: Record<ActiveTab, string> = {
    course: "Course & Video Classroom / Physics & Science",
    tutor: "Teachers / Jenny Wilson (Economics)",
    cbt: "CBT Examination Engine / JAMB UTME Mock 2026"
  };

  return (
    <div className="w-full min-h-screen bg-[#baacf8] p-2 sm:p-6 lg:p-8 flex items-center justify-center antialiased">
      {/* Main Tablet/Desktop Enclosure with 10px Dark Frame */}
      <div className="w-full max-w-[1380px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[10px] border-slate-900 flex flex-col md:flex-row min-h-[820px]">
        {/* Slim Dark Vertical Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Primary Content Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto max-h-[92vh] custom-scroll">
          {/* Header Bar */}
          <Header user={currentUser} breadcrumb={breadcrumbs[activeTab]} />

          {/* Subheader Route Switcher Pills */}
          <div className="px-6 sm:px-10 pt-4 flex items-center justify-between border-b border-slate-100">
            <nav className="text-xs text-slate-400 font-medium">
              <span className="hover:text-slate-700 cursor-pointer">Phosters Academy</span> /{" "}
              <span className="text-slate-900 font-bold">{breadcrumbs[activeTab]}</span>
            </nav>

            <div className="flex space-x-2 text-xs font-semibold pb-3">
              <button
                onClick={() => {
                  setActiveTab("course");
                  setIsExamRunning(false);
                  setActiveExamResult(null);
                }}
                className={`px-4 py-1.5 rounded-full transition-all shadow-sm ${
                  activeTab === "course"
                    ? "bg-[#111214] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Course & Streaming
              </button>

              <button
                onClick={() => {
                  setActiveTab("tutor");
                  setIsExamRunning(false);
                  setActiveExamResult(null);
                }}
                className={`px-4 py-1.5 rounded-full transition-all shadow-sm ${
                  activeTab === "tutor"
                    ? "bg-[#111214] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Teacher Profile & Booking
              </button>

              <button
                onClick={() => {
                  setActiveTab("cbt");
                  setIsExamRunning(true);
                  setActiveExamResult(null);
                }}
                className={`px-4 py-1.5 rounded-full transition-all shadow-sm ${
                  activeTab === "cbt"
                    ? "bg-[#111214] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                CBT Exam Simulator
              </button>
            </div>
          </div>

          {/* ================= VIEW 1: COURSE & VIDEO STREAMING ================= */}
          {activeTab === "course" && (
            <div className="p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                {/* Left 8 Cols */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Video Player */}
                  <VideoPlayer
                    thumbnailUrl={sampleCourse.videoThumbnailUrl}
                    durationText="03:21"
                  />

                  {/* Underlined Navigation Tabs */}
                  <div className="flex border-b border-slate-200 text-sm font-semibold space-x-8">
                    <button className="pb-3 text-[#111214] border-b-2 border-[#111214]">
                      Course Info
                    </button>
                    <button className="pb-3 text-slate-400 hover:text-slate-600">
                      Reviews ({sampleCourse.enrolledCount.toLocaleString()})
                    </button>
                  </div>

                  {/* About Course */}
                  <div className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      About Course
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {sampleCourse.description}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {sampleCourse.extendedDescription}
                    </p>
                    <button className="text-xs sm:text-sm font-bold text-[#7d5bf6] hover:text-[#6a42f5]">
                      + Show More
                    </button>
                  </div>

                  {/* What Will I Learn (2-Col Grid) */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      What Will I Learn?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs sm:text-sm text-slate-600">
                      {sampleCourse.whatWillLearn.map((item, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <span className="text-slate-400 font-bold">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accordion Curriculum Modules */}
                  <CurriculumAccordion modules={sampleCourse.modules} />
                </div>

                {/* Right 4 Cols: Meta Card & Details */}
                <div className="lg:col-span-4">
                  <CourseMetaSidebar
                    course={sampleCourse}
                    onPracticeCbt={() => {
                      setActiveTab("cbt");
                      setIsExamRunning(true);
                      setActiveExamResult(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: TUTOR PROFILE & BOOKING SCHEDULE ================= */}
          {activeTab === "tutor" && (
            <div className="p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                {/* Left 8 Cols */}
                <div className="lg:col-span-8 space-y-6">
                  <TutorProfileHeader tutor={sampleTutorProfile} />

                  {/* Underlined Navigation Tabs */}
                  <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold space-x-4 sm:space-x-8 text-slate-500">
                    <button className="pb-3 text-[#111214] border-b-2 border-[#111214]">
                      About me
                    </button>
                    <button className="pb-3 hover:text-slate-900">Schedule</button>
                    <button className="pb-3 hover:text-slate-900">
                      Courses ({sampleTutorProfile.coursesCount})
                    </button>
                    <button className="pb-3 hover:text-slate-900">
                      Reviews ({sampleTutorProfile.reviewsCount})
                    </button>
                  </div>

                  {/* Interactive Schedule Slot Picker */}
                  <SchedulePicker slots={sampleTutorProfile.availableSlots} />
                </div>

                {/* Right 4 Cols: Video Intro & Reviews */}
                <div className="lg:col-span-4">
                  <TutorSidebarCard tutor={sampleTutorProfile} />
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: CBT SIMULATION & RESULTS ================= */}
          {activeTab === "cbt" && (
            <div className="p-6 sm:p-10">
              {isExamRunning ? (
                <CbtExamView
                  exam={sampleCbtExam}
                  onFinishExam={handleFinishExam}
                  onExitExam={() => {
                    setIsExamRunning(false);
                    setActiveTab("course");
                  }}
                />
              ) : activeExamResult ? (
                <CbtScorecardModal
                  exam={sampleCbtExam}
                  result={activeExamResult}
                  onRetakeExam={() => {
                    setIsExamRunning(true);
                    setActiveExamResult(null);
                  }}
                  onReturnToDashboard={() => {
                    setActiveTab("course");
                    setActiveExamResult(null);
                  }}
                />
              ) : (
                <div className="text-center py-12 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    JAMB National Mock Examination Portal
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Prepare under real examination conditions with synchronized timers, authentic questions, and instant AI-assisted corrections.
                  </p>
                  <button
                    onClick={() => setIsExamRunning(true)}
                    className="px-6 py-3 bg-[#baacf8] hover:bg-[#a997f7] text-[#111214] font-bold text-xs rounded-xl shadow"
                  >
                    Start Timed Mock Exam
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

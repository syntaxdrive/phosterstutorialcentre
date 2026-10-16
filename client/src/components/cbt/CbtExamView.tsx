import React, { useState, useEffect } from "react";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import type { CbtExam } from "../../types";

interface CbtExamViewProps {
  exam: CbtExam;
  onFinishExam: (answers: Record<number, "A" | "B" | "C" | "D">, timeSpentSeconds: number) => void;
  onExitExam: () => void;
}

export const CbtExamView: React.FC<CbtExamViewProps> = ({
  exam,
  onFinishExam,
  onExitExam
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    exam.durationMinutes * 60
  );

  // Countdown Timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      onFinishExam(answers, exam.durationMinutes * 60);
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining, answers, exam.durationMinutes, onFinishExam]);

  // Keyboard navigation for JAMB 8-Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(key)) {
        handleOptionSelect(key as "A" | "B" | "C" | "D");
      } else if (key === "N" && currentIndex < exam.questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (key === "P" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, exam.questions.length]);

  const handleOptionSelect = (option: "A" | "B" | "C" | "D") => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: option
    }));
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const currentQuestion = exam.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      {/* Exam Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7d5bf6] border border-purple-100">
            Official Mock Simulation
          </span>
          <h2 className="font-bold text-base text-slate-900 mt-1">{exam.title}</h2>
          <p className="text-xs text-slate-400">
            Question {currentIndex + 1} of {exam.questions.length} • Answered: {answeredCount}/{exam.questions.length}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div
            className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-2 font-mono font-bold text-sm border ${
              secondsRemaining < 120
                ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <button
            onClick={() => onFinishExam(answers, exam.durationMinutes * 60 - secondsRemaining)}
            className="bg-[#111214] hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main Examination Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Active Question Box (Left 3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[420px] shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              <span className="text-xs text-[#7d5bf6] font-semibold bg-purple-50 px-2.5 py-1 rounded-md">
                {currentQuestion.topic || "Core Subject"}
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed mb-6">
              {currentQuestion.question}
            </p>

            {/* 4 Radio Option Cards */}
            <div className="space-y-3">
              {(["A", "B", "C", "D"] as const).map((letter, optIdx) => {
                const optionText = currentQuestion.options[optIdx];
                const isSelected = answers[currentIndex] === letter;

                return (
                  <button
                    key={letter}
                    onClick={() => handleOptionSelect(letter)}
                    className={`w-full flex items-center p-3.5 px-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#baacf8] bg-purple-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center mr-3 transition-colors ${
                        isSelected
                          ? "bg-[#111214] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {letter}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        isSelected ? "text-slate-900 font-semibold" : "text-slate-600"
                      }`}
                    >
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            <div className="flex space-x-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous (P)
              </button>
              <button
                disabled={currentIndex === exam.questions.length - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-[#baacf8] hover:bg-[#a997f7] text-[#111214] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                Next (N)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center text-xs text-slate-400 space-x-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">A - D</span>
              <span>Select Option</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">N</span>
              <span>Next</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">P</span>
              <span>Previous</span>
            </div>
          </div>
        </div>

        {/* Question Palette (Right 1 Col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Question Palette ({exam.questions.length})
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((_, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = answers[idx] !== undefined;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      isCurrent
                        ? "bg-[#111214] text-white ring-2 ring-purple-400"
                        : isAnswered
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111214]" />
              <span>Current (Question {currentIndex + 1})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span>Unanswered ({exam.questions.length - answeredCount})</span>
            </div>

            <button
              onClick={onExitExam}
              className="w-full mt-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Cancel Examination
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

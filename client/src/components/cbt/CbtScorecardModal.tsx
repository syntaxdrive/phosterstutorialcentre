import React from "react";
import { CheckCircle2, XCircle, Award, Sparkles, RotateCcw, Home } from "lucide-react";
import type { CbtExam, CbtResult } from "../../types";

interface CbtScorecardModalProps {
  exam: CbtExam;
  result: CbtResult;
  onRetakeExam: () => void;
  onReturnToDashboard: () => void;
}

export const CbtScorecardModal: React.FC<CbtScorecardModalProps> = ({
  exam,
  result,
  onRetakeExam,
  onReturnToDashboard
}) => {
  const isPass = result.percentage >= 60;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isPass ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-[#7d5bf6]"
            }`}
          >
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Examination Performance Scorecard
            </h2>
            <p className="text-xs text-slate-400">{exam.title}</p>
          </div>
        </div>

        {/* Score Benchmark Badge */}
        <div className="text-right">
          <span className="text-3xl font-black text-slate-900">
            {result.score} / {result.total}
          </span>
          <span className="block text-xs font-bold text-emerald-600">
            {result.percentage.toFixed(1)}% Score Rating
          </span>
        </div>
      </div>

      {/* Corrections List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Step-by-Step Question Review
        </h3>

        <div className="space-y-3">
          {exam.questions.map((q, idx) => {
            const studentChoice = result.answers[idx] || "None";
            const isCorrect = studentChoice === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-rose-200 bg-rose-50/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-900">
                      Question {idx + 1}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500">
                    Your Key: <b className={isCorrect ? "text-emerald-700" : "text-rose-700"}>{studentChoice}</b> | Correct: <b>{q.correctAnswer}</b>
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-2 font-medium">
                  {q.question}
                </p>

                {/* Step-by-step working */}
                <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#7d5bf6] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tutor Solution & Working:</span>
                  </div>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <button
          onClick={onReturnToDashboard}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
        >
          <Home className="w-4 h-4 text-slate-400" />
          Dashboard
        </button>

        <button
          onClick={onRetakeExam}
          className="px-5 py-2.5 rounded-xl bg-[#baacf8] hover:bg-[#a997f7] text-[#111214] font-bold text-xs flex items-center gap-2 shadow"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Examination
        </button>
      </div>
    </div>
  );
};

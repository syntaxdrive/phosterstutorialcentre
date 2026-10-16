import React from "react";
import { Play, Zap, Mail, Calendar, Clock, Star } from "lucide-react";
import type { TutorProfile } from "../../types";

interface TutorSidebarCardProps {
  tutor: TutorProfile;
  onBookLesson?: () => void;
  onSendMessage?: () => void;
}

export const TutorSidebarCard: React.FC<TutorSidebarCardProps> = ({
  tutor,
  onBookLesson,
  onSendMessage
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Intro Video & Booking CTA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Intro Video Preview */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 group">
          <img
            src={tutor.introVideoThumbnail}
            alt="Tutor Introduction Video"
            className="w-full h-full object-cover brightness-95 contrast-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              title="Play Video Introduction"
              className="w-12 h-12 rounded-full bg-white/95 text-slate-900 flex items-center justify-center pl-1 shadow-xl hover:scale-110 transition-transform"
            >
              <Play className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Pricing Meta */}
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-xs text-slate-400">Price per lesson</span>
          <span className="text-2xl font-extrabold text-slate-900">
            ${tutor.monthlyRate}
            <span className="text-xs font-normal text-slate-400">/hr</span>
          </span>
        </div>

        {/* Action Buttons with Lavender Accent */}
        <div className="space-y-2">
          <button
            onClick={onBookLesson}
            className="w-full bg-[#baacf8] hover:bg-[#a997f7] text-[#111214] font-bold py-3 px-4 rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4" />
            Book trial lesson
          </button>
          <button
            onClick={onSendMessage}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl border border-slate-200 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            Send message
          </button>
        </div>

        {/* Guarantee and response stats */}
        <div className="text-[11px] text-slate-400 space-y-1.5 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>5 lessons booked in 48 hours</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>3-hour response time</span>
          </div>
        </div>
      </div>

      {/* 2. Reviews Summary & Progress Bars */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
            Reviews ({tutor.reviewsCount})
          </h4>
          <button className="text-xs font-bold text-[#9d85fc] hover:underline">
            View all
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="flex items-center space-x-4">
          <div className="text-center shrink-0">
            <span className="text-3xl font-extrabold text-slate-900">
              {tutor.rating.toFixed(1)}
            </span>
            <div className="flex items-center justify-center text-amber-400 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {tutor.reviewsCount} Reviews
            </span>
          </div>

          <div className="flex-1 space-y-1.5 text-[11px] text-slate-600">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span>Qualifications</span>
                <span className="font-bold">4.9</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#baacf8] h-full w-[98%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span>Expertise</span>
                <span className="font-bold">4.8</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#baacf8] h-full w-[96%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span>Communication</span>
                <span className="font-bold">5.0</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#baacf8] h-full w-[100%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span>Value for money</span>
                <span className="font-bold">4.9</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#baacf8] h-full w-[98%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Testimonials */}
        <div className="space-y-3.5 pt-3 border-t border-slate-100">
          {tutor.reviews.map((rev) => (
            <div key={rev.id} className="text-xs space-y-1.5">
              <div className="flex items-center space-x-2">
                <img
                  src={rev.avatarUrl}
                  alt={rev.studentName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <span className="font-bold text-slate-900 block leading-tight">
                    {rev.studentName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {rev.scoreAchievement || "Verified Student"}
                  </span>
                </div>
              </div>
              <p className="text-slate-500 leading-relaxed italic text-[11px]">
                "{rev.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

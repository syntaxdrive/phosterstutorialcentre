import React from "react";
import { Check, Star, Bookmark, GraduationCap, BookOpen, Users, CheckSquare } from "lucide-react";
import type { TutorProfile } from "../../types";

interface TutorProfileHeaderProps {
  tutor: TutorProfile;
  onBookmark?: () => void;
}

export const TutorProfileHeader: React.FC<TutorProfileHeaderProps> = ({
  tutor,
  onBookmark
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={tutor.avatarUrl}
            alt={tutor.name}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
          />
          <div>
            <div className="flex items-center space-x-2">
              {tutor.isTopTutor && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  TOP Tutor
                </span>
              )}
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {tutor.rating.toFixed(1)}{" "}
                <span className="text-slate-400 font-normal">
                  based on <u className="text-[#9d85fc]">{tutor.reviewsCount} reviews</u>
                </span>
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              {tutor.name}
              <span
                title="Verified Institutional Tutor"
                className="w-4 h-4 rounded-full bg-[#baacf8] text-[#111214] flex items-center justify-center text-[9px] font-black"
              >
                ✓
              </span>
            </h1>
            <p className="text-xs text-slate-400">{tutor.title}</p>
          </div>
        </div>

        <button
          onClick={onBookmark}
          title="Save Tutor Profile"
          className="w-9 h-9 rounded-xl bg-purple-50 text-[#9d85fc] flex items-center justify-center hover:bg-purple-100 transition-colors"
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Bio Statement */}
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
        {tutor.bio}
      </p>

      {/* High-Contrast Dark Subject Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {tutor.tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-3 py-1.5 rounded-lg bg-[#111214] text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Numerical Accreditations */}
      <div className="flex flex-wrap gap-6 pt-3 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center space-x-1.5">
          <GraduationCap className="w-4 h-4 text-slate-400" />
          <span>{tutor.experienceYears}+ years experience</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span>{tutor.coursesCount} courses published</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Users className="w-4 h-4 text-slate-400" />
          <span>{tutor.studentsCount}+ candidates coached</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <CheckSquare className="w-4 h-4 text-slate-400" />
          <span>{tutor.testsConducted} tests conducted</span>
        </div>
      </div>
    </div>
  );
};

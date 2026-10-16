import React from "react";
import {
  BarChart2,
  GraduationCap,
  Clock,
  RefreshCw,
  Award,
  Zap,
  ShoppingBag
} from "lucide-react";
import type { Course } from "../../types";

interface CourseMetaSidebarProps {
  course: Course;
  onEnroll?: () => void;
  onPracticeCbt?: () => void;
}

export const CourseMetaSidebar: React.FC<CourseMetaSidebarProps> = ({
  course,
  onEnroll,
  onPracticeCbt
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Price and Enrolment CTA Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
        <div className="flex items-baseline space-x-3">
          <span className="text-3xl font-extrabold text-slate-900">
            ${course.price.toFixed(2)}
          </span>
          <span className="text-sm text-slate-400 line-through">
            ${course.originalPrice.toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
            {course.discountPercentage}% off
          </span>
        </div>

        {/* Buttons with Lavender and Outline Styles */}
        <div className="space-y-2.5">
          <button
            onClick={onEnroll}
            className="w-full bg-[#baacf8] hover:bg-[#a997f7] text-[#111214] font-bold py-3 px-4 rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to cart
          </button>
          <button
            onClick={onPracticeCbt}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3 px-4 rounded-xl border border-slate-200 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 text-[#baacf8]" />
            Take CBT Practice Mock
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          30-Day Money-Back Guarantee
        </p>

        <hr className="border-slate-100" />

        {/* Course Specifications */}
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-center space-x-3">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <span>{course.level}</span>
          </div>
          <div className="flex items-center space-x-3">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <span>{course.enrolledCount.toLocaleString()} candidates enrolled</span>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{course.totalDuration}</span>
          </div>
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>{course.lastUpdated}</span>
          </div>
          {course.certificateOffered && (
            <div className="flex items-center space-x-3">
              <Award className="w-4 h-4 text-slate-400" />
              <span>Certificate of completion</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. "A Course By" Instructors Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          A course by
        </h4>

        <div className="space-y-3.5">
          {course.instructors.map((inst) => (
            <div key={inst.id} className="flex items-center space-x-3">
              <img
                src={inst.avatarUrl}
                alt={inst.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h5 className="text-xs font-bold text-slate-900">{inst.name}</h5>
                <p className="text-[11px] text-slate-400">{inst.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Material Includes */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-3">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
          Material Includes
        </h4>
        <ul className="text-xs text-slate-500 space-y-2">
          {course.materialIncludes.map((mat, i) => (
            <li key={i} className="flex items-center space-x-2">
              <span className="text-slate-400">•</span>
              <span>{mat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Requirements */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-3">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
          Requirements
        </h4>
        <ul className="text-xs text-slate-500 space-y-2">
          {course.requirements.map((req, i) => (
            <li key={i} className="flex items-center space-x-2">
              <span className="text-slate-400">•</span>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Tags (High-Contrast Dark Pills) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-3">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900">Tags</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {course.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg bg-[#111214] text-white font-medium hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

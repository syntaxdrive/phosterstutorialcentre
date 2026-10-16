import React from "react";
import { Search, Bell } from "lucide-react";
import type { User } from "../../types";

interface HeaderProps {
  user: User;
  breadcrumb?: string;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="px-6 sm:px-10 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur z-10">
      {/* Pill Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search subjects, lessons, formula notes, or past questions..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#baacf8] focus:bg-white transition-all"
        />
      </div>

      {/* Right User Actions */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <button
          title="Notifications"
          className="w-9 h-9 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-all relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#baacf8] absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-900 leading-tight">
              {user.name}
            </span>
            <span className="block text-[11px] text-slate-400 font-mono">
              {user.jambRegistrationNumber || "Scholar"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

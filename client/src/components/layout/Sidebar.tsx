import React from "react";
import {
  LayoutGrid,
  PlaySquare,
  Users,
  CheckSquare,
  FileText,
  BarChart3,
  HelpCircle,
  Settings,
  Box
} from "lucide-react";

export type ActiveTab = "course" | "tutor" | "cbt";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-full md:w-[76px] bg-[#111214] flex md:flex-col items-center justify-between py-4 md:py-7 px-4 md:px-0 border-r border-slate-800 shrink-0 z-20">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center space-y-6">
        <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform">
          <Box className="w-5 h-5 text-white" />
        </div>

        {/* Middle Navigation Icons */}
        <nav className="hidden md:flex flex-col items-center space-y-4">
          <button
            onClick={() => onTabChange("course")}
            title="Course & Video Lectures"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "course"
                ? "bg-white/20 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <PlaySquare className="w-5 h-5" />
          </button>

          <button
            onClick={() => onTabChange("tutor")}
            title="Faculty & Tutors"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "tutor"
                ? "bg-white/20 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={() => onTabChange("cbt")}
            title="CBT Examination Simulator"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "cbt"
                ? "bg-white/20 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <CheckSquare className="w-5 h-5" />
          </button>

          <button
            title="Resource Library"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <FileText className="w-5 h-5" />
          </button>

          <button
            title="Performance Analytics"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          <button
            title="Student Dashboard"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Bottom Utility Controls */}
      <div className="hidden md:flex flex-col items-center space-y-4">
        <button
          title="Help & Documentation"
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          title="Settings"
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

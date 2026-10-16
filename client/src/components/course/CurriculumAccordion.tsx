import React, { useState } from "react";
import { ChevronDown, ChevronUp, Play, FileText, Lock, Eye, Info } from "lucide-react";
import type { CourseModule } from "../../types";

interface CurriculumAccordionProps {
  modules: CourseModule[];
}

export const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({ modules }) => {
  const [expandedModuleId, setExpandedModuleId] = useState<string>(
    modules[0]?.id || ""
  );

  const toggleModule = (id: string) => {
    setExpandedModuleId(expandedModuleId === id ? "" : id);
  };

  return (
    <div className="space-y-3 pt-3">
      {modules.map((module) => {
        const isExpanded = expandedModuleId === module.id;

        return (
          <div
            key={module.id}
            className={`border rounded-xl overflow-hidden bg-white transition-all ${
              isExpanded
                ? "border-slate-300 shadow-sm"
                : "border-slate-200/80 hover:border-slate-300"
            }`}
          >
            {/* Header Accordion Bar */}
            <button
              onClick={() => toggleModule(module.id)}
              className={`w-full flex items-center justify-between p-4 transition-colors text-left ${
                isExpanded ? "bg-slate-50/80" : "bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  {module.title}
                </span>
                <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] text-slate-400 flex items-center justify-center font-bold">
                  <Info className="w-2.5 h-2.5" />
                </span>
              </div>

              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Child Lessons List */}
            {isExpanded && module.lessons.length > 0 && (
              <div className="divide-y divide-slate-100 text-xs sm:text-sm border-t border-slate-100">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3.5 px-5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 text-slate-700">
                      {lesson.type === "video" ? (
                        <Play className="w-3.5 h-3.5 text-slate-400 fill-current" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{lesson.title}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-400 text-xs">
                      <span>{lesson.duration}</span>
                      {lesson.isFreePreview ? (
                        <span title="Free Preview Available" className="hover:text-slate-700">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span title="Enrolled Access Required">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

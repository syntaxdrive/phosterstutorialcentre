import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { TutorTimeSlot } from "../../types";

interface SchedulePickerProps {
  slots: TutorTimeSlot[];
  onSlotSelect?: (slotId: string) => void;
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  slots,
  onSlotSelect
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string>("s11");
  const [calendarView, setCalendarView] = useState<"day" | "week">("day");

  const handleSelect = (id: string) => {
    setSelectedSlotId(id);
    if (onSlotSelect) onSlotSelect(id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Schedule & Available Consultation Slots
          </h3>
          <p className="text-xs text-slate-400">
            Pick an active timing slot to book your 1-on-1 revision drill.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>PST UTC-08:00</span>
        </div>
      </div>

      {/* Dark Calendar Schedule Enclosure */}
      <div className="bg-[#111214] rounded-2xl p-4 sm:p-5 text-white">
        {/* Navigation Bar inside Calendar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
            <button
              title="Previous Day"
              className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Tuesday, 2 April 2026</span>
            <button
              title="Next Day"
              className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex bg-slate-900 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setCalendarView("day")}
              className={`px-3 py-1 rounded-md transition-colors ${
                calendarView === "day"
                  ? "bg-[#baacf8] text-[#111214] font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCalendarView("week")}
              className={`px-3 py-1 rounded-md transition-colors ${
                calendarView === "week"
                  ? "bg-[#baacf8] text-[#111214] font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Time Slot Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-4 text-xs font-semibold">
          {slots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => handleSelect(slot.id)}
                className={`py-2.5 rounded-xl transition-all ${
                  isSelected
                    ? "bg-[#baacf8] text-[#111214] font-extrabold shadow-lg shadow-purple-500/20 ring-2 ring-white"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

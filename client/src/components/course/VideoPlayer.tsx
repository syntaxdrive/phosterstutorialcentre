import React, { useState } from "react";
import { Play, Pause, Volume2, Maximize, Settings } from "lucide-react";

interface VideoPlayerProps {
  thumbnailUrl: string;
  durationText?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  thumbnailUrl,
  durationText = "03:21"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-md group select-none">
      {/* Thumbnail or Video Media */}
      <img
        src={thumbnailUrl}
        alt="Lecture Video Preview"
        className="w-full h-full object-cover brightness-[0.88] contrast-[1.02]"
      />

      {/* Top Right Fullscreen Action */}
      <div className="absolute top-4 right-4">
        <button
          title="Fullscreen Mode"
          className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md text-white/90 flex items-center justify-center hover:bg-black/60 transition-all border border-white/20 shadow"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Center Translucent Glass Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? "Pause Video" : "Play Lecture Video"}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-2xl transition-transform hover:scale-105 pl-1"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 fill-current text-slate-900" />
          ) : (
            <Play className="w-8 h-8 fill-current text-slate-900" />
          )}
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex items-center justify-between text-white text-xs">
        <div className="flex items-center space-x-3 w-full mr-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:text-[#baacf8] transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>

          {/* Progress Bar Track */}
          <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden cursor-pointer relative">
            <div className="bg-[#baacf8] h-full w-[35%] transition-all" />
          </div>

          <span className="font-mono text-[11px] text-white/90 whitespace-nowrap">
            {durationText}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-white/90">
          <button title="Volume" className="hover:text-[#baacf8] transition-colors">
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            title="Closed Captions"
            className="hover:text-[#baacf8] text-[10px] font-bold border border-white/60 px-1 rounded transition-colors"
          >
            CC
          </button>
          <button title="Settings" className="hover:text-[#baacf8] transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

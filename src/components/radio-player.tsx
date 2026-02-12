"use client";

import { useState } from "react";
import { Play, Pause, Volume2, Radio } from "lucide-react";

export function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-amber-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Station Info */}
          <div className="flex items-center space-x-3 min-w-0">
            <Radio className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-amber-100 truncate">
                North Country Radio
              </div>
              <div className="text-xs text-amber-300/80 truncate">
                Now Playing &middot; Americana &amp; Country
              </div>
            </div>
          </div>

          {/* Center: Play Button + Equalizer */}
          <div className="flex items-center space-x-4">
            {/* Equalizer Bars */}
            <div className="hidden sm:flex items-end space-x-0.5 h-6">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-full ${
                    isPlaying
                      ? "bg-green-400 animate-equalizer"
                      : "bg-amber-600 h-1"
                  }`}
                  style={
                    isPlaying
                      ? {
                          animationDelay: `${bar * 0.15}s`,
                          animationDuration: `${0.4 + bar * 0.1}s`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>

            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-amber-950" />
              ) : (
                <Play className="w-5 h-5 text-amber-950 ml-0.5" />
              )}
            </button>

            {/* Equalizer Bars (right side) */}
            <div className="hidden sm:flex items-end space-x-0.5 h-6">
              {[6, 7, 8, 9, 10].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-full ${
                    isPlaying
                      ? "bg-green-400 animate-equalizer"
                      : "bg-amber-600 h-1"
                  }`}
                  style={
                    isPlaying
                      ? {
                          animationDelay: `${bar * 0.12}s`,
                          animationDuration: `${0.5 + (bar - 5) * 0.08}s`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          {/* Right: Status + Volume */}
          <div className="flex items-center space-x-4">
            {/* On Air Badge */}
            <div
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isPlaying
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? "bg-green-400 animate-pulse" : "bg-gray-500"
                }`}
              />
              <span>{isPlaying ? "ON AIR" : "OFFLINE"}</span>
            </div>

            {/* Listener Count */}
            <div className="hidden lg:block text-xs text-amber-300/70">
              {isPlaying ? "1,247 listeners" : "---"}
            </div>

            {/* Volume */}
            <div className="hidden sm:flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1 accent-amber-400 bg-amber-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

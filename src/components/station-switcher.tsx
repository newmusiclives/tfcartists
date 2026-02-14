"use client";

import { useState, useRef, useEffect } from "react";
import { Radio, ChevronDown, Check } from "lucide-react";
import { useStation } from "@/contexts/StationContext";

export function StationSwitcher() {
  const { currentStation, allStations, switchStation, isLoading } = useStation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 font-bold text-xl text-amber-700">
        <Radio className="w-6 h-6" />
        <span className="bg-amber-100 animate-pulse rounded h-6 w-40" />
      </div>
    );
  }

  // Single station mode - just show station name
  if (allStations.length <= 1) {
    return (
      <div className="flex items-center space-x-2 font-bold text-amber-700">
        <Radio className="w-6 h-6 flex-shrink-0" />
        {/* Show call sign on small screens, full name on lg+ */}
        {currentStation.callSign ? (
          <>
            <span className="text-xl hidden lg:inline">{currentStation.name}</span>
            <span className="text-lg lg:hidden">{currentStation.callSign}</span>
          </>
        ) : (
          <span className="text-xl truncate max-w-[160px] lg:max-w-none">{currentStation.name}</span>
        )}
      </div>
    );
  }

  // Multi-station mode - show dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="flex items-center space-x-2 font-bold text-amber-700 hover:text-amber-800 transition-colors"
      >
        <Radio className="w-6 h-6 flex-shrink-0" />
        {/* Show call sign on small screens, full name on lg+ */}
        {currentStation.callSign ? (
          <>
            <span className="text-xl hidden lg:inline">{currentStation.name}</span>
            <span className="text-lg lg:hidden">{currentStation.callSign}</span>
          </>
        ) : (
          <span className="text-xl truncate max-w-[160px] lg:max-w-none">{currentStation.name}</span>
        )}
        {currentStation.callSign && (
          <span className="text-xs font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded hidden lg:inline">
            {currentStation.callSign}
          </span>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-1 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
            Switch Station
          </div>
          {allStations.map((station) => {
            const isSelected = station.id === currentStation.id;
            return (
              <button
                key={station.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  switchStation(station.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors flex items-center justify-between ${
                  isSelected ? "bg-amber-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: station.primaryColor || "#78350f" }}
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{station.name}</div>
                    <div className="text-xs text-gray-500">
                      {station.callSign && `${station.callSign} · `}{station.genre}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

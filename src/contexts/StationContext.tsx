"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface StationInfo {
  id: string;
  name: string;
  callSign: string | null;
  tagline: string | null;
  genre: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  stationCode: string | null;
  formatType: string | null;
  streamUrl: string | null;
  isActive: boolean;
  logoUrl?: string | null;
  description?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  organizationId?: string | null;
  _count?: {
    songs: number;
    clockTemplates: number;
    stationDJs: number;
    imagingVoices: number;
  };
}

/**
 * Default fallback station. Used only when the API is unreachable.
 * In production, station data comes from the database via /api/stations.
 * Operators override all fields through the Station admin UI.
 */
const DEFAULT_STATION: StationInfo = {
  id: "default-ncr",
  name: process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio",
  callSign: process.env.NEXT_PUBLIC_STATION_CALL_SIGN || "NCR",
  tagline: process.env.NEXT_PUBLIC_STATION_TAGLINE || "Where the music finds you.",
  genre: process.env.NEXT_PUBLIC_STATION_GENRE || "Americana, Country, Singer-Songwriter",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f",
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || "#c2410c",
  stationCode: process.env.NEXT_PUBLIC_STATION_CODE || "ncr",
  formatType: process.env.NEXT_PUBLIC_FORMAT_TYPE || "americana",
  streamUrl: process.env.NEXT_PUBLIC_STREAM_URL || "https://tfc-radio.netlify.app/stream/americana-hq.mp3",
  isActive: true,
};

interface StationContextType {
  currentStation: StationInfo;
  allStations: StationInfo[];
  switchStation: (stationId: string) => void;
  isLoading: boolean;
}

const StationContext = createContext<StationContextType>({
  currentStation: DEFAULT_STATION,
  allStations: [DEFAULT_STATION],
  switchStation: () => {},
  isLoading: true,
});

export function StationProvider({ children }: { children: ReactNode }) {
  const [allStations, setAllStations] = useState<StationInfo[]>([]);
  const [currentStation, setCurrentStation] = useState<StationInfo>(DEFAULT_STATION);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await fetch("/api/stations", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch stations");
        const data = await res.json();
        const stations: StationInfo[] = data.stations || [];

        if (stations.length > 0) {
          setAllStations(stations);

          // Restore saved station from localStorage
          const savedId = typeof window !== "undefined"
            ? localStorage.getItem("currentStationId")
            : null;
          const saved = savedId ? stations.find((s) => s.id === savedId) : null;
          setCurrentStation(saved || stations[0]);
        } else {
          setAllStations([DEFAULT_STATION]);
          setCurrentStation(DEFAULT_STATION);
        }
      } catch {
        setAllStations([DEFAULT_STATION]);
        setCurrentStation(DEFAULT_STATION);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStations();
  }, []);

  const switchStation = useCallback(
    (stationId: string) => {
      const station = allStations.find((s) => s.id === stationId);
      if (station) {
        setCurrentStation(station);
        localStorage.setItem("currentStationId", stationId);
      }
    },
    [allStations]
  );

  return (
    <StationContext.Provider value={{ currentStation, allStations, switchStation, isLoading }}>
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  return useContext(StationContext);
}

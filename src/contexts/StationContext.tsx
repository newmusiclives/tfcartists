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
  _count?: {
    songs: number;
    clockTemplates: number;
    stationDJs: number;
    imagingVoices: number;
  };
}

const DEFAULT_STATION: StationInfo = {
  id: "default-ncr",
  name: "North Country Radio",
  callSign: "NCR",
  tagline: "Where the music finds you.",
  genre: "Americana, Country, Singer-Songwriter",
  primaryColor: "#78350f",
  secondaryColor: "#c2410c",
  stationCode: "ncr",
  formatType: "americana",
  streamUrl: "https://tfc-radio.netlify.app/stream/americana-hq.mp3",
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

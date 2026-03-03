"use client";

import { usePathname } from "next/navigation";
import { RadioPlayer } from "@/components/radio-player";

/** Hides the sticky RadioPlayer bar and bottom padding on the /player page */
export function RadioPlayerWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlayerPage = pathname === "/player";

  return (
    <>
      <div id="main-content" className={isPlayerPage ? "" : "pb-24"}>
        {children}
      </div>
      {!isPlayerPage && <RadioPlayer />}
    </>
  );
}

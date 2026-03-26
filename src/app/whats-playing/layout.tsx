import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's Playing",
  description:
    "See what's playing right now, recently played tracks, and what's coming up next. Live updates every 30 seconds.",
  openGraph: {
    title: "What's Playing | TrueFans RADIO",
    description:
      "See what's playing right now, recently played tracks, and what's coming up next.",
  },
};

export default function WhatsPlayingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

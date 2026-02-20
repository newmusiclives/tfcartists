import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Artist Onboarding | TrueFans RADIO",
  },
  description: "Submit your music for airplay on TrueFans RADIO",
};

export default function OnboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

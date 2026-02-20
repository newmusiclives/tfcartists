import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Riley Dashboard | TrueFans RADIO",
  },
  description: "Artist acquisition team dashboard",
  robots: { index: false, follow: false },
};

export default function RileyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

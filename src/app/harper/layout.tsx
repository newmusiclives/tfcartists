import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Harper Dashboard | TrueFans RADIO",
  },
  description: "Sponsor acquisition team dashboard",
  robots: { index: false, follow: false },
};

export default function HarperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

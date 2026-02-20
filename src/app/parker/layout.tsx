import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Parker Dashboard | TrueFans RADIO",
  },
  description: "Station management team dashboard",
  robots: { index: false, follow: false },
};

export default function ParkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

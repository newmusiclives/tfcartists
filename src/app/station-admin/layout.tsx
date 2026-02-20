import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Station Admin | TrueFans RADIO",
  },
  description: "Station administration and configuration",
  robots: { index: false, follow: false },
};

export default function StationAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

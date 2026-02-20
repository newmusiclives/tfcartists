import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Elliot Dashboard | TrueFans RADIO",
  },
  description: "Listener growth team dashboard",
  robots: { index: false, follow: false },
};

export default function ElliotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

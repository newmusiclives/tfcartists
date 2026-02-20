import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Revenue | TrueFans RADIO",
  },
  description: "Revenue dashboard and financial projections",
  robots: { index: false, follow: false },
};

export default function RevenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

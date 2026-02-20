import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Management | TrueFans RADIO",
  },
  description: "Platform management and operations",
  robots: { index: false, follow: false },
};

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Cassidy Dashboard | TrueFans RADIO",
  },
  description: "Submission review team dashboard",
  robots: { index: false, follow: false },
};

export default function CassidyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

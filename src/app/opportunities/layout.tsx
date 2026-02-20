import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Opportunities | TrueFans RADIO",
  },
  description: "Discover opportunities for artists, listeners, and sponsors on TrueFans RADIO",
};

export default function OpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

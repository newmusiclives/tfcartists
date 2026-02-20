import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Become a Sponsor | TrueFans RADIO",
  },
  description: "Support independent radio and reach engaged listeners through sponsorship",
};

export default function SponsorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Rewards | TrueFans RADIO",
  },
  description: "Earn rewards for listening, sharing, and supporting independent artists",
};

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

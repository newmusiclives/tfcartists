import { Suspense } from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueFans RADIO",
    default: "Portal | TrueFans RADIO",
  },
  description: "Access your TrueFans RADIO dashboard",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}

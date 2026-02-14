import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrueFans RADIO Player",
  description: "Listen to TrueFans RADIO - AI-powered radio championing independent artists",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}

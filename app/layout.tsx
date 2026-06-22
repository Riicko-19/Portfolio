import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://inside-the-mind.local"),
  title: {
    default: "Inside The Mind — A Digital Consciousness",
    template: "%s · Inside The Mind",
  },
  description:
    "An explorable 3D simulation of an AI engineer's mind. Projects, skills, memories and goals as navigable locations inside a living brain.",
  openGraph: {
    title: "Inside The Mind",
    description:
      "An explorable digital consciousness. Navigate a living brain of projects, skills and memories.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070912",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WITIA — Making Procurement Corruption Economically Irrational",
  description: "WITIA is an AI-powered trust layer for government procurement — combining fraud detection, vendor trust scoring, and a cross-jurisdiction intelligence exchange. Built by Award Winning Cambridge Alum. Backed by Emergent Ventures and Prometheus X Talent.",
  metadataBase: new URL("https://witia.ai"),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "WITIA — Making Procurement Corruption Economically Irrational",
    description: "An AI-powered trust layer for government procurement. Fraud detection, 8-dimensional vendor trust scoring, and a cross-jurisdiction intelligence exchange.",
    url: "https://witia.ai",
    siteName: "WITIA",
    type: "website",
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WITIA — Making Procurement Corruption Economically Irrational",
    description: "An AI-powered trust layer for government procurement.",
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload geodata so globe renders without delay */}
        <link rel="preload" href="/world-110m.json" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

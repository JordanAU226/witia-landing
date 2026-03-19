import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WITIA — Making Procurement Corruption Economically Irrational",
  description: "WITIA is an AI-powered trust layer for government procurement — combining fraud detection, vendor trust scoring, and a cross-jurisdiction intelligence exchange. Built by Award Winning Cambridge Alum. Backed by Emergent Ventures and Prometheus X Talent.",
  metadataBase: new URL("https://witia.ai"),
  openGraph: {
    title: "WITIA — Making Procurement Corruption Economically Irrational",
    description: "An AI-powered trust layer for government procurement. Fraud detection, 8-dimensional vendor trust scoring, and a cross-jurisdiction intelligence exchange.",
    url: "https://witia.ai",
    siteName: "WITIA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WITIA — Making Procurement Corruption Economically Irrational",
    description: "An AI-powered trust layer for government procurement.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

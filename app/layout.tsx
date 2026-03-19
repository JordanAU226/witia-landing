import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WITIA — AI-Powered Procurement Fraud Detection",
  description: "WITIA is an AI-powered trust layer for government procurement — combining fraud detection, vendor trust scoring, and a cross-jurisdiction intelligence exchange.",
  metadataBase: new URL("https://witia.ai"),
  openGraph: {
    title: "WITIA — AI-Powered Procurement Fraud Detection",
    description: "Breaking the corruption equilibrium. Piloting with Europe's largest local authority.",
    type: "website",
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

import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Tiro_Devanagari_Sanskrit } from "next/font/google";

export const metadata: Metadata = {
  title: "Lalita Sahasranama",
  description:
    "The 1000 names of the Goddess Lalita Tripurasundari — with root breakdowns and commentaries.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const sanskrit = Tiro_Devanagari_Sanskrit({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-sanskrit",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${sanskrit.variable}`}>
      <body className="paper-bg min-h-screen">{children}</body>
    </html>
  );
}

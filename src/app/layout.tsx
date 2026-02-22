import type { Metadata } from "next";
import { Inter, Lora, DM_Serif_Display } from "next/font/google";
import { SheetMusicBg } from "@/components/SheetMusicBg";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Libretto — Turn your idea into a Broadway musical",
  description: "Pick a musical style, describe your show in one sentence. Get 6 original songs, a full playbill, and cover art in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lora.variable} ${dmSerif.variable} antialiased bg-[#0D0B0E] relative min-h-screen`}
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        <SheetMusicBg />
        <div className="relative">{children}</div>
      </body>
    </html>
  );
}

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
  title: "Libretto — Your life, in three moments",
  description: "Transform three moments from your life into a personal musical biography with AI-generated lyrics, music, and narrative.",
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

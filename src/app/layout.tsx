import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Oswald } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BROADWAYIFY — Turn your idea into a Broadway musical",
  description: "Pick a musical style, describe your show in one sentence. Get 6 original songs, a full playbill, and cover art in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ fontSize: '19.2px' }}>
      <body
        className={`${playfair.variable} ${cormorant.variable} ${oswald.variable} antialiased bg-[#08070A] text-[#F2E8D5] relative min-h-screen`}
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        {/* Subtle theater texture overlay */}
        <div className="theater-texture" aria-hidden="true" />
        <div className="relative">{children}</div>
      </body>
    </html>
  );
}

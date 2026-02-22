import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Broadwayify Player",
  robots: "noindex, nofollow",
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Minimal layout — no SheetMusicBg visible since embed page has solid bg
  return <>{children}</>;
}

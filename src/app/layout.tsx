import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/silkscreen/400.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marginalia: a sketchbook skin for Video.js v10",
  description:
    "A hand-drawn, pixel-art video player skin for Video.js v10. Sticky-note controls, a pencil seek line, and an astronaut who rides the timeline.",
  openGraph: {
    title: "Marginalia: a sketchbook skin for Video.js v10",
    description: "A hand-drawn, pixel-art video player skin for Video.js v10.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

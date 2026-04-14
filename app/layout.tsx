import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import FloatingUI from "@/components/ui/FloatingUI";
import CartPanel from "@/components/cart/CartPanel";
import GlobalAudioPlayer from "@/components/music/GlobalAudioPlayer";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ym-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ym-mono",
  display: "swap",
});

const display = DM_Sans({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-ym-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Yunmakai",
    template: "%s | Yunmakai",
  },
  description:
    "An immersive digital universe for music, art, and collectibles by Yunmakai.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://ym-website-theta.vercel.app"
  ),
  openGraph: {
    type: "website",
    siteName: "Yunmakai",
    title: "Yunmakai",
    description:
      "An immersive digital universe for music, art, and collectibles.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="bg-void text-dust antialiased font-body">
        <AuthProvider>
          {children}
          <FloatingUI />
          <CartPanel />
          <GlobalAudioPlayer />
        </AuthProvider>
      </body>
    </html>
  );
}

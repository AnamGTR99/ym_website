import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { DM_Sans, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import FloatingUI from "@/components/ui/FloatingUI";
import CustomCursor from "@/components/env/LandingCursor";
import "./globals.css";

const CartPanel = dynamic(() => import("@/components/cart/CartPanel"));
const GlobalAudioPlayer = dynamic(
  () => import("@/components/music/GlobalAudioPlayer")
);

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-ym-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-ym-mono",
  display: "swap",
});

const display = DM_Sans({
  subsets: ["latin"],
  weight: ["800"],
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
      <head>
        <link rel="prefetch" href="https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_wasm_wrapper.js" />
        <link rel="prefetch" href="https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_decoder.wasm" />
      </head>
      <body className="bg-void text-dust antialiased font-body">
        <AuthProvider>
          {children}
          <FloatingUI />
          <CartPanel />
          <GlobalAudioPlayer />
          <CustomCursor />
        </AuthProvider>
      </body>
    </html>
  );
}

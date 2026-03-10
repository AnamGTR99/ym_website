import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import CartPanel from "@/components/cart/CartPanel";
import GlobalAudioPlayer from "@/components/music/GlobalAudioPlayer";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <AuthProvider>
          {children}
          <CartPanel />
          <GlobalAudioPlayer />
        </AuthProvider>
      </body>
    </html>
  );
}

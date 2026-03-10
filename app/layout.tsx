import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import CartPanel from "@/components/cart/CartPanel";
import GlobalAudioPlayer from "@/components/music/GlobalAudioPlayer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yunmakai",
  description: "An immersive digital universe for music and art.",
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

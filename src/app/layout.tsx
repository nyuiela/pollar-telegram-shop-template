import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-shop-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pollar Telegram Shop",
  description:
    "Telegram Mini App storefront — Pollar login and USDC checkout on Stellar testnet.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0ea" },
    { media: "(prefers-color-scheme: dark)", color: "#121714" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

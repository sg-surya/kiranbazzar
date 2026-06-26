import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import BottomNavWrapper from "./BottomNavWrapper";
import PwaSetup from "./PwaSetup";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kirana Bazzar — Best Prices, Fastest Delivery",
  description: "Shop groceries, household essentials and more at the lowest prices with free delivery. Kirana Bazzar — your trusted online kirana store.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/icon.svg" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kirana Bazzar",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <SplashScreen />
            {children}
            <BottomNavWrapper />
            <PwaSetup />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

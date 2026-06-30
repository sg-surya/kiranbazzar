import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import BottomNavWrapper from "./BottomNavWrapper";
import PwaSetup from "./PwaSetup";
import SplashScreen from "@/components/SplashScreen";
import ClickSoundProvider from "@/components/ClickSoundProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kirana Bazzar — Best Prices, Fastest Delivery",
  description: "Shop groceries, household essentials and more at the lowest prices with free delivery. Kirana Bazzar — your trusted online kirana store.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icon.jpeg", type: "image/jpeg" },
    { rel: "apple-touch-icon", url: "/icon.jpeg" },
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
        <link rel="apple-touch-icon" href="/icon.jpeg" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <ClickSoundProvider>
              <SplashScreen />
              {children}
              <BottomNavWrapper />
              <PwaSetup />
            </ClickSoundProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

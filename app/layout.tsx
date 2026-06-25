import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kirana Bazzar — Best Prices, Fastest Delivery",
  description: "Shop groceries, household essentials and more at the lowest prices with free delivery. Kirana Bazzar — your trusted online kirana store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#22C55E" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider><CartProvider>{children}</CartProvider></AuthProvider>
      </body>
    </html>
  );
}

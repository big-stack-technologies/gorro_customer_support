import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Gorro Customer Support",
    template: "%s | Gorro Support"
  },
  description: "Customer support and management dashboard for Gorro - Manage tickets, customers, and marketing campaigns",
  keywords: ["Gorro", "Customer Support", "Support Dashboard", "Ticket Management", "Customer Management", "Marketing Segments"],
  authors: [{ name: "Gorro Team" }],
  creator: "Gorro",
  publisher: "Gorro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://gorro.online"),
  openGraph: {
    title: "Gorro Customer Support",
    description: "Customer support and management dashboard for Gorro",
    url: "https://gorro.online",
    siteName: "Gorro Support",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gorro Customer Support",
    description: "Customer support and management dashboard for Gorro",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}

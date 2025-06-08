import type { Metadata } from "next";
import { Poppins, Open_Sans, Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastContainer } from "@/components/ui/toast";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import "./globals.css";


const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: "CareDraft - AI-Powered Care Proposal Platform",
    template: "%s | CareDraft"
  },
  description: "Create winning care proposals with AI-powered assistance. Streamline your tender response process with CareDraft's intelligent proposal management platform.",
  keywords: ["care proposals", "tender responses", "AI writing", "proposal management", "care services", "healthcare proposals"],
  authors: [{ name: "CareDraft Team" }],
  creator: "CareDraft",
  publisher: "CareDraft",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://caredraft.co.uk'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    title: 'CareDraft - AI-Powered Care Proposal Platform',
    description: 'Create winning care proposals with AI-powered assistance. Streamline your tender response process with CareDraft.',
    siteName: 'CareDraft',
    images: [
      {
        url: '/images/caredraft-logo.svg',
        width: 200,
        height: 60,
        alt: 'CareDraft Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareDraft - AI-Powered Care Proposal Platform',
    description: 'Create winning care proposals with AI-powered assistance.',
    creator: '@caredraft',
    images: ['/images/caredraft-logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${openSans.variable} ${inter.className} antialiased`}
      >
        <ErrorBoundary level="global">
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

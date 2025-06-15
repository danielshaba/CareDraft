import type { Metadata } from "next";
import { Poppins, Open_Sans, Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastContainer } from "@/components/ui/toast";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
// Temporarily comment out CSS import to isolate entryCSSFiles issue
// import "./globals.css";


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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#2a6f6f',
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
    description: 'Create winning care proposals with AI-powered assistance. Streamline your tender response process with CareDraft\'s intelligent proposal management platform.',
    siteName: 'CareDraft',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CareDraft - AI-Powered Care Proposal Platform',
        type: 'image/png',
      },
      {
        url: '/caredraft-logo-official.svg',
        width: 280,
        height: 80,
        alt: 'CareDraft Logo',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareDraft - AI-Powered Care Proposal Platform',
    description: 'Create winning care proposals with AI-powered assistance. Streamline your tender response process.',
    creator: '@caredraft',
    site: '@caredraft',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CareDraft - AI-Powered Care Proposal Platform',
      }
    ],
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
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' }
    ],
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

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0e2e1c',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://chathura-gimasha-wedding.com'
  ),
  title: {
    default: 'Chathura & Gimasha | Wedding Invitation',
    template: '%s | Chathura & Gimasha Wedding',
  },
  description:
    'Together forever — With the blessings of our families, we warmly invite you to celebrate our special day of love and happiness on 03 December 2026 at The Deer Park Hotel, Girithale.',
  keywords: [
    'Chathura and Gimasha',
    'Wedding Invitation',
    'Sri Lanka Wedding',
    'The Deer Park Hotel',
    'Girithale Wedding',
    'Poruwa Ceremony',
  ],
  authors: [{ name: 'Chathura & Gimasha' }],
  creator: 'Chathura & Gimasha',
  publisher: 'Chathura & Gimasha',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Chathura & Gimasha Wedding',
    title: 'Chathura & Gimasha | Wedding Invitation — 03 December 2026',
    description:
      'With the blessings of our families, we warmly invite you to celebrate our special day of love and happiness.',
    images: [
      {
        url: '/images/hero-couple-clean.jpg',
        width: 1200,
        height: 630,
        alt: 'Chathura & Gimasha Wedding Celebration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chathura & Gimasha | Wedding Invitation',
    description: 'Together forever — 03 December 2026 at The Deer Park Hotel, Girithale.',
    images: ['/images/hero-couple-clean.jpg'],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Expense Tracker - Mahesh ;)',
  description:
    'A modern, responsive, mobile-first local-first personal expense tracker for Mahesh ;) with offline IndexedDB storage, multi-account transfers, prepaid recharges, and detailed financial analysis.',
  openGraph: {
    title: 'Personal Expense Tracker - Mahesh ;)',
    description:
      'A modern, responsive, mobile-first local-first personal expense tracker for Mahesh ;) with offline IndexedDB storage, multi-account transfers, prepaid recharges, and detailed financial analysis.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Expense Tracker',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#111418',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#111418] text-[#F5F7FA] antialiased">
        {children}
      </body>
    </html>
  );
}

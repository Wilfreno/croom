import AuthProvider from '@/components/providers/AuthProvider';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import SocketIOProvider from '@/components/providers/SocketIOProvider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { Work_Sans } from 'next/font/google';
import './globals.css';

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Croom',
  description: 'Simple chat app where you and your friends can hangout',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(workSans.className, 'w-full h-dvh')}>
        <ReactQueryProvider>
          <AuthProvider>
            <SocketIOProvider>{children}</SocketIOProvider>
          </AuthProvider>
        </ReactQueryProvider>
        <Toaster richColors expand={true} position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}

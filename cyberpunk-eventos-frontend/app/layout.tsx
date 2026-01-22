import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ProvedorAuth } from '@/contexts/auth-context';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cyberpunk Events',
  description: 'Sistema de gerenciamento de eventos cyberpunk',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProvedorAuth>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            style={
              {
                '--toast-background': 'rgba(0, 0, 0, 0.9)',
                '--toast-border': '1px solid rgba(34, 211, 238, 0.5)',
                '--toast-text': 'rgba(34, 211, 238, 1)',
              } as React.CSSProperties
            }
          />
        </ProvedorAuth>
      </body>
    </html>
  );
}

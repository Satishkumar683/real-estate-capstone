import { Fraunces, Inter } from 'next/font/google';
import Header from '@/shared/ui/Header';
import AuthSessionProvider from '@/shared/providers/AuthSessionProvider';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fraunces',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'RealEstateAI',
  description: 'AI-powered real estate search, price prediction, and insights.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <AuthSessionProvider>
          <Header />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
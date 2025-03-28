// frontend/app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-providers';
import { NotificationProvider } from '@/providers/notification-provider';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import NotificationToast from '@/components/notifications/NotificationToast';
import CsrfToken from '@/components/security/CsrfToken';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'EsportsBets - Bet on your favorite esports tournaments',
    template: '%s | EsportsBets'
  },
  description: 'The premier platform for betting on esports tournaments. Join the community, place bets, and win rewards!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Security headers - these are typically also set at the server level */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*; connect-src 'self' https://*" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        {/* CSRF Token component to handle token generation */}
        <CsrfToken />
        
        <AuthProvider>
          <NotificationProvider>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <NotificationToast />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
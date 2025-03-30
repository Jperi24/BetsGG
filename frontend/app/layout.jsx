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
        {/* Removed CSP meta tags that were causing problems */}
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
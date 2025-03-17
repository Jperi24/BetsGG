// frontend/app/layout.jsx 
// This is a modified version of the original layout.jsx file
// Update your actual layout file with these changes

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-providers';
import { NotificationProvider } from '@/providers/notification-provider';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import NotificationToast from '@/components/notifications/NotificationToast';

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
      <body className={inter.className}>
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
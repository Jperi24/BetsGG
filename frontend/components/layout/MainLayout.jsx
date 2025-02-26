import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Head from 'next/head';
import { useRouter } from 'next/router';

const MainLayout = ({ children, title = 'EsportsBets - Bet on Esports Tournaments' }) => {
  const router = useRouter();
  
  // Generate a page title based on the current route
  const getPageTitle = () => {
    const route = router.pathname;
    
    if (route.startsWith('/tournaments')) {
      return 'Tournaments | EsportsBets';
    } else if (route.startsWith('/bet/')) {
      return 'Bet Details | EsportsBets';
    } else if (route.startsWith('/bets')) {
      return 'My Bets | EsportsBets';
    } else if (route.startsWith('/wallet')) {
      return 'Wallet | EsportsBets';
    } else if (route.startsWith('/dashboard')) {
      return 'Dashboard | EsportsBets';
    } else if (route === '/login') {
      return 'Sign In | EsportsBets';
    } else if (route === '/register') {
      return 'Create Account | EsportsBets';
    }
    
    return title;
  };
  
  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content="The premier platform for betting on esports tournaments" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default MainLayout;
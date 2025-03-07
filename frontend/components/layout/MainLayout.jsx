// frontend/components/layout/MainLayout.jsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const MainLayout = ({ children, title = 'EsportsBets - Bet on Esports Tournaments' }) => {
  const pathname = usePathname();
  
  // Generate a page title based on the current route
  const getPageTitle = () => {
    if (pathname?.startsWith('/tournaments')) {
      return 'Tournaments | EsportsBets';
    } else if (pathname?.startsWith('/bet/')) {
      return 'Bet Details | EsportsBets';
    } else if (pathname?.startsWith('/bets')) {
      return 'My Bets | EsportsBets';
    } else if (pathname?.startsWith('/wallet')) {
      return 'Wallet | EsportsBets';
    } else if (pathname?.startsWith('/dashboard')) {
      return 'Dashboard | EsportsBets';
    } else if (pathname === '/login') {
      return 'Sign In | EsportsBets';
    } else if (pathname === '/register') {
      return 'Create Account | EsportsBets';
    }
    
    return title;
  };
  
  return (
    <>
      <head>
        <title>{getPageTitle()}</title>
        <meta name="description" content="The premier platform for betting on esports tournaments" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </>
  );
};

export default MainLayout;
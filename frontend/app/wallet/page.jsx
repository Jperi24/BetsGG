'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import WalletManagement from '@/components/wallet/WalletManagement';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const WalletPage = () => {
  return (
    <ProtectedRoute>
      <MainLayout title="Wallet | EsportsBets">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <WalletManagement />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default WalletPage;
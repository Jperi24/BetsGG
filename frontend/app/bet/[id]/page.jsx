'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import BetDetails from '@/components/betting/BetDetails';
import { useAuth } from '@/providers/auth-providers';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const BetDetailPage = () => {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      <MainLayout title="Bet Details | EsportsBets">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced BetDetails Component */}
          <BetDetails betId={id} />
          
          {/* PlaceBetForm is conditionally rendered inside BetDetails component */}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default BetDetailPage;
import React from 'react';
import { useAuth } from '@/providers/auth-providers';
import { Wallet, Bell, Settings } from 'lucide-react';
import Link from 'next/link';

const DashboardHeader = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user.username}</p>
          </div>

          <div className="flex items-center space-x-6">
            {/* Wallet Balance */}
            <Link href="/wallet" className="flex items-center group">
              <div className="bg-indigo-50 p-2 rounded-full group-hover:bg-indigo-100 transition-colors">
                <Wallet className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-2">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-sm font-medium text-gray-900">{user.balance.toFixed(4)} ETH</p>
              </div>
            </Link>

            {/* Notifications */}
        

            <Link 
              href="/notifications" 
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Bell className="h-6 w-6" />
            </Link>

            {/* Settings */}
            <Link 
              href="/settings" 
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Settings className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
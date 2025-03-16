'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  User, 
  Shield, 
  Bell, 
  Settings as SettingsIcon, 
  Lock, 
  FileText, 
  ChevronRight,
  Wallet
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Settings categories with icons and routes
  const settingsCategories = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your profile information and preferences',
      icon: <User className="h-6 w-6 text-indigo-600" />,
      path: '/settings/profile'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Password, two-factor authentication, and login security',
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      path: '/settings/security'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure email and push notification preferences',
      icon: <Bell className="h-6 w-6 text-indigo-600" />,
      path: '/settings/notifications'
    },
    {
      id: 'wallet',
      title: 'Wallet Settings',
      description: 'Manage connected wallets and transaction preferences',
      icon: <Wallet className="h-6 w-6 text-indigo-600" />,
      path: '/settings/wallet'
    },
    {
      id: 'account',
      title: 'Account Management',
      description: 'Account deletion and data export options',
      icon: <FileText className="h-6 w-6 text-indigo-600" />,
      path: '/settings/account'
    }
  ];

  return (
    <ProtectedRoute>
      <MainLayout title="Settings | EsportsBets">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-2">Logged in as:</span>
              <span className="font-medium text-gray-900">{user?.username}</span>
            </div>
          </div>
          
          {/* Settings Categories */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {settingsCategories.map((category) => (
                <li key={category.id}>
                  <Link 
                    href={category.path}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-6 py-5 flex items-center justify-between">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {category.icon}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* User Info */}
          <div className="mt-8 bg-indigo-50 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="bg-indigo-100 rounded-full p-3">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <p><span className="font-medium text-gray-700">Username:</span> {user?.username}</p>
                  <p><span className="font-medium text-gray-700">Email:</span> {user?.email}</p>
                  <p><span className="font-medium text-gray-700">Two-Factor Authentication:</span> {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p><span className="font-medium text-gray-700">Wallet Balance:</span> {user?.balance?.toFixed(4)} ETH</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
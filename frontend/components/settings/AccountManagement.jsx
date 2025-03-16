'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-providers';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { deleteAccount, exportUserData } from '@/lib/api/auth';
import { 
  Loader, 
  ArrowLeft, 
  AlertCircle, 
  FileText, 
  Download,
  Trash,
  AlertTriangle
} from 'lucide-react';

export default function AccountManagement() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // State
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle data export
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      // Call your API to export user data
      const response = await exportUserData();
      
      // Create a blob from the data
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `esportsbets-user-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError(err.message || 'Failed to export user data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Show delete confirmation
  const showDeleteAccount = () => {
    setShowDeleteConfirm(true);
    setError(null);
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPassword('');
    setConfirmDelete('');
  };
  
  // Handle account deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    if (confirmDelete !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      
      // Call your API to delete the account
      await deleteAccount({ password });
      
      // Logout the user
      logout();
      
      // Redirect to home page
      router.push('/');
      
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <MainLayout title="Account Management | EsportsBets">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link 
              href="/settings"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Settings
            </Link>
          </div>
          
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            {/* Data Export Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center mb-4">
                <Download className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-medium text-gray-900">Export Your Data</h2>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Download a copy of your personal data, including your profile information, betting history, and transaction records.
              </p>
              
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {isExporting ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Preparing Data...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </>
                )}
              </button>
              
              <div className="mt-4 text-xs text-gray-500">
                Your data will be exported as a JSON file. This might take a moment depending on the amount of data.
              </div>
            </div>
            
            {/* Delete Account Section */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Trash className="h-5 w-5 text-red-600 mr-2" />
                <h2 className="text-xl font-medium text-gray-900">Delete Your Account</h2>
              </div>
              
              <div className="bg-red-50 p-4 rounded-md mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Warning: This action cannot be undone</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Deleting your account will permanently remove all your data, including:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Profile information</li>
                        <li>Betting history</li>
                        <li>Transaction records</li>
                        <li>Any remaining balance (we recommend withdrawing your funds first)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={showDeleteAccount}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Account
                </button>
              ) : (
                <div className="border border-red-300 rounded-md p-4">
                  <h3 className="text-lg font-medium text-red-800 mb-4">Confirm Account Deletion</h3>
                  
                  <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Enter your password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700">
                        Type DELETE to confirm
                      </label>
                      <input
                        type="text"
                        id="confirmDelete"
                        value={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={cancelDelete}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isDeleting || confirmDelete !== 'DELETE' || !password}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                      >
                        {isDeleting ? (
                          <>
                            <Loader className="animate-spin h-4 w-4 mr-2" />
                            Deleting...
                          </>
                        ) : (
                          'Permanently Delete Account'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
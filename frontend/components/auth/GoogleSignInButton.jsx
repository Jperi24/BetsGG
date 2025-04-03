'use client';

import React from 'react';
import { Mail } from 'lucide-react'; // Using Lucide's Mail icon as Google icon alternative

const GoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <button 
      onClick={handleGoogleSignIn}
      type="button" 
      className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 transition-colors"
    >
      {/* Styling to make it look like Google's G icon */}
      <div className="flex items-center justify-center bg-white p-1 rounded-full">
        <Mail className="h-5 w-5 text-blue-600" />
      </div>
      <span>Continue with Google</span>
    </button>
  );
};

export default GoogleSignInButton;
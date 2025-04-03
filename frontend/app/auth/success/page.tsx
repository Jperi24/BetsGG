// app/auth/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after a small delay
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
        <p className="mt-4 text-lg font-medium">Authentication successful!</p>
        <p className="text-gray-500">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
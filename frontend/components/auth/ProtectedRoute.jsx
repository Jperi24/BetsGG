import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-providers';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // If authentication check is complete
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push({
          pathname: '/login',
          query: { from: router.asPath },
        });
      } else {
        // If authenticated, mark as verified
        setVerified(true);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking auth status
  if (isLoading || !verified) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Verifying your credentials...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return children;
};

export default ProtectedRoute;
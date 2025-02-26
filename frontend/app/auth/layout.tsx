import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation */}
      <div className="bg-white shadow-sm py-3">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-indigo-600 font-bold text-xl">EsportsBets</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Home
            </Link>
            <Link 
              href="/tournaments" 
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Tournaments
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="py-6 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} EsportsBets. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
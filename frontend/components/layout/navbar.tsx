'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-providers';
import { Menu, X, User, LogOut, Wallet, Trophy, Home, Info } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if current route is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-white font-bold text-xl">EsportsBets</span>
              </Link>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`${
                  isActive('/') 
                    ? 'border-white text-white' 
                    : 'border-transparent text-indigo-100 hover:border-indigo-200 hover:text-white'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              
              {/* How It Works Link - Desktop */}
              <Link
                href="/how-it-works"
                className={`${
                  isActive('/how-it-works') 
                    ? 'border-white text-white' 
                    : 'border-transparent text-indigo-100 hover:border-indigo-200 hover:text-white'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Platform Overview
              </Link>
              
              <Link
                href="/tournaments"
                className={`${
                  isActive('/tournaments') 
                    ? 'border-white text-white' 
                    : 'border-transparent text-indigo-100 hover:border-indigo-200 hover:text-white'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Tournaments
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link
                    href="/bets"
                    className={`${
                      isActive('/bets') 
                        ? 'border-white text-white' 
                        : 'border-transparent text-indigo-100 hover:border-indigo-200 hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    My Bets
                  </Link>
                  
                  <Link
                    href="/wallet"
                    className={`${
                      isActive('/wallet') 
                        ? 'border-white text-white' 
                        : 'border-transparent text-indigo-100 hover:border-indigo-200 hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Wallet
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                {/* User Balance */}
                <div className="mr-4 px-3 py-1 bg-white bg-opacity-20 rounded-full text-white text-sm">
                  {user?.balance?.toFixed(4)} ETH
                </div>
                
                {/* User Menu */}
                <div className="relative ml-3 flex items-center space-x-4">
                  <Link 
                    href="/dashboard" 
                    className="text-indigo-100 hover:text-white flex items-center"
                  >
                    <User className="h-5 w-5 mr-1" />
                    <span>{user?.username}</span>
                  </Link>
                  
                  <button
                    onClick={logout}
                    className="text-indigo-100 hover:text-white"
                    aria-label="Log out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-indigo-500 focus:outline-none"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`${
              isActive('/') 
                ? 'bg-indigo-700 text-white' 
                : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
            } block px-3 py-2 rounded-md text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Home
            </div>
          </Link>
          
          {/* How It Works Link - Mobile */}
          <Link
            href="/how-it-works"
            className={`${
              isActive('/how-it-works') 
                ? 'bg-indigo-700 text-white' 
                : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
            } block px-3 py-2 rounded-md text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              How It Works
            </div>
          </Link>
          
          <Link
            href="/tournaments"
            className={`${
              isActive('/tournaments') 
                ? 'bg-indigo-700 text-white' 
                : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
            } block px-3 py-2 rounded-md text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Tournaments
            </div>
          </Link>
          
          {isAuthenticated && (
            <>
              <Link
                href="/bets"
                className={`${
                  isActive('/bets') 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setIsMenuOpen(false)}
              >
                My Bets
              </Link>
              
              <Link
                href="/wallet"
                className={`${
                  isActive('/wallet') 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2" />
                  Wallet
                </div>
              </Link>
              
              <Link
                href="/dashboard"
                className={`${
                  isActive('/dashboard') 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </div>
              </Link>
              
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="text-indigo-100 hover:bg-indigo-500 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-2" />
                  Log out
                </div>
              </button>
            </>
          )}
          
          {!isAuthenticated && (
            <div className="border-t border-indigo-500 pt-4 pb-3">
              <div className="mt-3 space-y-1">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:text-white hover:bg-indigo-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:text-white hover:bg-indigo-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile user info */}
        {isAuthenticated && (
          <div className="border-t border-indigo-500 pt-4 pb-3">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">{user?.username}</div>
                <div className="text-sm font-medium text-indigo-100">{user?.balance?.toFixed(4)} ETH</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
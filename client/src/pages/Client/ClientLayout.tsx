import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Menu, X, Globe } from 'lucide-react';
import GoogleTranslate from '@/components/GoogleTranslate';

export default function ClientLayout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Handle logout
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="client-header bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard">
                  <span className="text-xl font-bold text-primary">Axix Finance</span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:ml-6 md:flex md:space-x-8">
                <Link href="/dashboard">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </span>
                </Link>
                <Link href="/deposit">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Deposit
                  </span>
                </Link>
                <Link href="/withdraw">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Withdraw
                  </span>
                </Link>
                <Link href="/history">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    History
                  </span>
                </Link>
                <Link href="/profile">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Profile
                  </span>
                </Link>
              </nav>
            </div>

            {/* Desktop Right Side */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {/* Google Translate Widget */}
              <div className="flex items-center">
                <GoogleTranslate />
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-900 dark:text-gray-100 hover:text-primary p-2 rounded-md"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Google Translate Widget for Mobile */}
              <div className="px-3 py-2">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Language</span>
                  </div>
                  <GoogleTranslate />
                </div>
              </div>

              <Link href="/dashboard">
                <span className="text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Dashboard
                </span>
              </Link>
              <Link href="/deposit">
                <span className="text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Deposit
                </span>
              </Link>
              <Link href="/withdraw">
                <span className="text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Withdraw
                </span>
              </Link>
              <Link href="/history">
                <span className="text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  History
                </span>
              </Link>
              <Link href="/profile">
                <span className="text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Profile
                </span>
              </Link>
              
              {/* User info and logout for mobile */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
                <div className="flex items-center px-3">
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {user?.firstName} {user?.lastName}
                  </div>
                </div>
                <div className="mt-3 px-3">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
} 
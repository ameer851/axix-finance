import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function ClientLayout() {
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard">
                  <span className="text-xl font-bold text-primary">Axix Finance</span>
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link href="/dashboard">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </span>
                </Link>
                <Link href="/deposit">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                    Deposit
                  </span>
                </Link>
                <Link href="/withdraw">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                    Withdraw
                  </span>
                </Link>
                <Link href="/history">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                    History
                  </span>
                </Link>
                <Link href="/profile">
                  <span className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                    Profile
                  </span>
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-900 dark:text-gray-100 text-sm">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <button
                    onClick={() => {
                      // Handle logout
                      toast({
                        title: "Logged out",
                        description: "You have been successfully logged out",
                      });
                    }}
                    className="text-gray-900 dark:text-gray-100 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
} 
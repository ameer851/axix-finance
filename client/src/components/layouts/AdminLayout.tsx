import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Users, Settings, Shield, Activity, 
  Database, Terminal, Bell, FileText,
  UserCog, Key, Server, Lock, BarChart,
  Globe, Link2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/admin',
      icon: <BarChart className="w-5 h-5" />
    },
    {
      title: 'User Management',
      path: '/admin/users',
      icon: <Users className="w-5 h-5" />
    },
    {
      title: 'Roles & Permissions',
      path: '/admin/roles',
      icon: <Shield className="w-5 h-5" />
    },
    {
      title: 'Transactions',
      path: '/admin/transactions',
      icon: <Activity className="w-5 h-5" />
    },
    {
      title: 'Analytics',
      path: '/admin/analytics',
      icon: <BarChart className="w-5 h-5" />
    },
    {
      title: 'System Settings',
      path: '/admin/settings',
      icon: <Settings className="w-5 h-5" />
    },
    {
      title: 'Security',
      path: '/admin/security',
      icon: <Lock className="w-5 h-5" />
    },
    {
      title: 'Audit Logs',
      path: '/admin/logs',
      icon: <Terminal className="w-5 h-5" />
    },
    {
      title: 'Data Management',
      path: '/admin/data',
      icon: <Database className="w-5 h-5" />
    },
    {
      title: 'Integrations',
      path: '/admin/integrations',
      icon: <Link2 className="w-5 h-5" />
    },
    {
      title: 'Notifications',
      path: '/admin/notifications',
      icon: <Bell className="w-5 h-5" />
    },
    {
      title: 'Reports',
      path: '/admin/reports',
      icon: <FileText className="w-5 h-5" />
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-600 dark:bg-primary-900">
              <h1 className="text-xl font-bold text-white">Carax Admin</h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      location === item.path
                        ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <div className="mr-3 flex-shrink-0">
                      {item.icon}
                    </div>
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 dark:text-primary-200 text-lg font-semibold">
                    {user?.firstName?.[0] || user?.username?.[0] || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username || 'Admin'}
                  </p>
                  <button
                    onClick={() => logout()}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">Carax Admin</h1>
        {/* Mobile menu button */}
        <button className="text-gray-500 dark:text-gray-300">
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
};

export default AdminLayout;

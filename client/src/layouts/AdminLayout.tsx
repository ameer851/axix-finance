import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Users,
  Search,
  Menu,
  LogOut,
  ClipboardList,
  Settings,
  DollarSign,
  ToggleLeft,
  AlertTriangle
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/admin/transactions', label: 'Transactions', icon: <DollarSign className="h-5 w-5" /> },
    { path: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { path: '/admin/maintenance', label: 'Maintenance', icon: <ToggleLeft className="h-5 w-5" /> },
    { path: '/admin/logs', label: 'Logs', icon: <ClipboardList className="h-5 w-5" /> },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const userInitials = user ? getInitials(`${user.firstName} ${user.lastName}`) : 'A';
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Admin User';

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-neutral-900">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-800 dark:bg-neutral-900">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">C</div>
                <span className="ml-2 text-xl font-bold text-white">Carax Admin</span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-gray-800 dark:bg-neutral-900 space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      className={`${
                        isActive 
                          ? 'bg-gray-900 dark:bg-neutral-800 text-white'
                          : 'text-gray-300 dark:text-gray-200 hover:bg-gray-700 dark:hover:bg-neutral-800 hover:text-white'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <span className="mr-3 text-gray-400 dark:text-gray-400">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-700 dark:border-neutral-800 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={userName} />
                      <AvatarFallback className="bg-gray-600">{userInitials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">{userName}</p>
                    <button 
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-400 group-hover:text-gray-300 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-1" /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-neutral-800 shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <label htmlFor="admin-search" className="sr-only">Search</label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-300">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                  <Input
                    id="admin-search"
                    className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm bg-transparent"
                    placeholder="Search"
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <Button variant="ghost" size="icon" className="relative">
                <AlertTriangle className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-600"></span>
              </Button>

              {/* Mobile user dropdown */}
              <div className="ml-3 relative md:hidden">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-gray-600">{userInitials}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800 dark:bg-neutral-900">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">C</div>
                  <span className="ml-2 text-xl font-bold text-white">Carax Admin</span>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navItems.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        className={`${
                          isActive
                            ? 'bg-gray-900 dark:bg-neutral-800 text-white'
                            : 'text-gray-300 dark:text-gray-200 hover:bg-gray-700 dark:hover:bg-neutral-800 hover:text-white'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="mr-4 text-gray-400 dark:text-gray-400">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-700 dark:border-neutral-800 p-4">
                <div className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={userName} />
                        <AvatarFallback className="bg-gray-600">{userInitials}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-white">{userName}</p>
                      <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-gray-400 group-hover:text-gray-300 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-1" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 w-14">{/* Forceful spacing */}</div>
          </div>
        )}

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

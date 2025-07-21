import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Menu, X, Home, Users, DollarSign, ArrowUp, Settings, Wrench, FileText } from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled by AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Deposits', href: '/admin/deposits', icon: DollarSign },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUp },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop, hidden on mobile */}
      <aside className={`
        ${sidebarCollapsed ? 'w-0 -ml-64' : 'w-64'}
        bg-gray-800 text-white p-4 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        hidden md:flex
      `}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
            <div className="text-sm text-gray-300">
              Welcome, {user?.firstName || user?.username}
            </div>
          </div>
          {/* Toggle Button in sidebar */}
          <button
            onClick={toggleSidebar}
            className="bg-gray-700 text-white p-2 rounded-md hover:bg-gray-600 transition-colors"
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <Link
            href="/admin"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === '/admin' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            <Home className="mr-3 h-6 w-6" />
            Dashboard
          </Link>

          <Link
            href="/admin/users"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === '/admin/users' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            <Users className="mr-3 h-6 w-6" />
            Users
          </Link>

          <Link
            href="/admin/deposits"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === '/admin/deposits' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            <DollarSign className="mr-3 h-6 w-6" />
            Deposits
          </Link>

          <Link
            href="/admin/withdrawals"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === '/admin/withdrawals' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            <ArrowUp className="mr-3 h-6 w-6" />
            Withdrawals
          </Link>

          <Link
            href="/admin/settings"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === '/admin/settings' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            <Settings className="mr-3 h-6 w-6" />
            Settings
          </Link>

          <Link
            href="/admin/maintenance"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === '/admin/maintenance' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            <Wrench className="mr-3 h-6 w-6" />
            Maintenance
          </Link>
        </nav>

        {/* User info and logout section */}
        <div className="border-t border-gray-600 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>        </div>
      </aside>
      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <aside className="relative w-64 bg-gray-800 text-white p-4 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
                <div className="text-sm text-gray-300">
                  Welcome, {user?.firstName || user?.username}
                </div>
              </div>
              {/* Close Button in mobile sidebar */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="bg-gray-700 text-white p-2 rounded-md hover:bg-gray-600 transition-colors"
                title="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    location === item.href
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-600 pt-4 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
      {/* Main content */}
      <main className={`flex-1 p-6 bg-gray-100 transition-all duration-300 ease-in-out`}>
        {/* Toggle button for mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
          title="Open sidebar"
        >
          <Menu size={20} />
        </button>
        {/* Fallback toggle button for desktop when sidebar is collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden md:block fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
            title="Show sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className={`pt-12`}>
          {children}
        </div>
      </main>
    </div>
  );
}

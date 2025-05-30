import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";
import AdminNotifications from "@/components/AdminNotifications";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location === path;

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled by AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
            <div className="text-sm text-gray-300">
              Welcome, {user?.firstName || user?.username}
            </div>
          </div>
          <AdminNotifications />
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <Link 
            href="/admin/dashboard" 
            className={`hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
              isActive('/admin/dashboard') ? 'bg-gray-700 text-blue-400' : ''
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/users" 
            className={`hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
              isActive('/admin/users') ? 'bg-gray-700 text-blue-400' : ''
            }`}
          >
            Users
          </Link>
          <Link 
            href="/admin/maintenance" 
            className={`hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
              isActive('/admin/maintenance') ? 'bg-gray-700 text-blue-400' : ''
            }`}
          >
            Maintenance
          </Link>
          <Link 
            href="/admin/deposits" 
            className={`hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
              isActive('/admin/deposits') ? 'bg-gray-700 text-blue-400' : ''
            }`}
          >
            Deposits
          </Link>          <Link 
            href="/admin/withdrawals" 
            className={`hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
              isActive('/admin/withdrawals') ? 'bg-gray-700 text-blue-400' : ''
            }`}
          >
            Withdrawals
          </Link>
          <Link 
            href="/admin/audit-logs" 
            className={`hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
              isActive('/admin/audit-logs') ? 'bg-gray-700 text-blue-400' : ''
            }`}
          >
            Audit Logs
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
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}

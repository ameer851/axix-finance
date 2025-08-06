
import React from "react";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";

const AdminLayout: React.FC = () => {
  const handleLogout = async () => {
    // Clear any stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Axix Finance Admin
              </h1>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import CustomerSupport from "@/components/CustomerSupport";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import VerifyEmail from "@/pages/Auth/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Dashboard/Transactions";
import Portfolio from "@/pages/Dashboard/Portfolio";
import Wallets from "@/pages/Dashboard/Wallets";
import Settings from "@/pages/Dashboard/Settings";

// Client pages
import Deposit from "@/pages/Client/Deposit";
import DepositList from "@/pages/Client/DepositList";
import Profile from "@/pages/Client/Profile";
import Withdraw from "@/pages/Client/Withdraw";
import History from "@/pages/Client/History";
import Referrals from "@/pages/Client/Referrals";
import Marketing from "@/pages/Client/Marketing";
import EditAccount from "@/pages/Client/EditAccount";
import ClientSettings from "@/pages/Client/Settings";

// Admin pages
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import MaintenancePage from "@/pages/admin/MaintenancePage";
import DepositsPage from "@/pages/admin/DepositsPage";
import WithdrawalsPage from "@/pages/admin/WithdrawalsPage";
import AuditLogsPage from "@/pages/admin/AuditLogsPage";

import DashboardLayout from "@/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Suspense, lazy } from "react";
import React from "react";

// Lazy load some less critical components
const VerificationBanner = lazy(() => import('@/components/VerificationBanner'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function ProtectedRoute({ 
  children, 
  requireVerified = false,
  requireAdmin = false
}: { 
  children: React.ReactNode, 
  requireVerified?: boolean,
  requireAdmin?: boolean
}) {
  const { user, isAuthenticated, isVerified, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State to track if redirecting to prevent component unmounting during redirect
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  
  useEffect(() => {
    if (!isLoading && !isRedirecting) {
      // Handle authentication requirements
      if (!isAuthenticated) {
        setIsRedirecting(true);
        toast({
          title: "Authentication required",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
      
      // Handle admin role requirements
      if (requireAdmin && user?.role !== "admin") {
        setIsRedirecting(true);
        toast({
          title: "Access denied",
          description: "Admin access required to view this page",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return;
      }
      
      // Handle verification requirements
      if (requireVerified && !isVerified) {
        toast({
          title: "Verification required",
          description: "Please verify your email to access this page",
          variant: "destructive",
        });
        // Still allow access but will show verification banner
      }
    }
  }, [isLoading, isAuthenticated, requireVerified, isVerified, requireAdmin, user?.role, isRedirecting, toast, setLocation]);
  
  // Show loading state while authentication is being checked or redirecting
  if (isLoading || isRedirecting) {
    return <LoadingSpinner />;
  }
  
  // Block access for unauthenticated users
  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }
  
  // Block access for non-admin users trying to access admin routes
  if (requireAdmin && user?.role !== "admin") {
    return <LoadingSpinner />;
  }
  
  // When verification is required but not done yet, show banner but still allow access
  return (
    <>
      {(requireVerified && !isVerified) && (
        <Suspense fallback={<div className="h-12 bg-yellow-100 dark:bg-yellow-900"></div>}>
          <VerificationBanner />
        </Suspense>
      )}
      {children}
    </>
  );
}

function AdminRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/admin/dashboard');
  }, [setLocation]);
  
  return <LoadingSpinner />;
}

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuthenticated && user) {
      if (['/login', '/register', '/forgot-password', '/reset-password'].includes(location)) {
        // Redirect based on user role
        if (user.role === 'admin') {
          setLocation('/admin');
        } else {
          setLocation('/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      
      {/* User Routes */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/deposit">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Deposit />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/deposit-list">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DepositList />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/withdraw">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Withdraw />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/history">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <History />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/referals">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Referrals />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/marketing">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Marketing />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/edit-account">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <EditAccount />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <ClientSettings />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminRedirect} />
      <Route path="/admin/dashboard">
        {() => (
          <ProtectedRoute requireVerified requireAdmin>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <ProtectedRoute requireVerified requireAdmin>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/maintenance">
        {() => (
          <ProtectedRoute requireVerified requireAdmin>
            <AdminLayout>
              <MaintenancePage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/deposits">
        {() => (
          <ProtectedRoute requireVerified requireAdmin>
            <AdminLayout>
              <DepositsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/withdrawals">
        {() => (
          <ProtectedRoute requireVerified requireAdmin>
            <AdminLayout>
              <WithdrawalsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/audit-logs">
        {() => (
          <ProtectedRoute requireVerified requireAdmin>
            <AdminLayout>
              <AuditLogsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(location);
  const isAdminPage = location.startsWith('/admin');
  
  return (
    <>
      <Router />
      {/* Only show CustomerSupport component when not on auth pages or admin pages */}
      {!isAuthPage && !isAdminPage && <CustomerSupport whatsappNumber="+1234567890" />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

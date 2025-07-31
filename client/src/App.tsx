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
import DepositConfirmation from "@/pages/Client/DepositConfirmation";
import DepositThankYou from "@/pages/Client/DepositThankYou";
import DepositList from "@/pages/Client/DepositList";
import Profile from "@/pages/Client/Profile";
import Withdraw from "@/pages/Client/Withdraw";
import History from "@/pages/Client/History";
import Referrals from "@/pages/Client/Referrals";
import Marketing from "@/pages/Client/Marketing";
import EditAccount from "@/pages/Client/EditAccount";
import SimpleEditAccount from "@/pages/Client/SimpleEditAccount";
import ClientSettings from "@/pages/Client/Settings";
import ClientDashboard from "@/pages/Client/ClientDashboard";
import DepositsHistory from "@/pages/Client/DepositsHistory";
import WithdrawalHistory from "@/pages/Client/WithdrawalHistory";
import DepositsHistoryPage from "@/pages/Client/DepositsHistoryPage";
import WithdrawalsHistoryPage from "@/pages/Client/WithdrawalsHistoryPage";
import DepositsListPage from "@/pages/Client/DepositsListPage";
import EditAccountPage from "@/pages/Client/EditAccountPage";

// Admin pages
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import MaintenancePage from "@/pages/admin/MaintenancePage";
import DepositsPage from "@/pages/admin/DepositsPage";
import WithdrawalsPage from "@/pages/admin/WithdrawalsPage";
import AuditLogsPage from "@/pages/admin/AuditLogsPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import VisitorsPage from "@/pages/admin/VisitorsPage";

import DashboardLayout from "@/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useEffect } from "react";
import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClientLayout from "@/pages/Client/ClientLayout";

// Lazy load some less critical components
const VerificationBanner = lazy(() => import('@/components/VerificationBanner'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
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
  
  // Enable visitor tracking for all users
  useVisitorTracking();

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
          <ProtectedRoute requireVerified>
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
      <Route path="/deposit-confirmation">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DepositConfirmation />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/deposit-confirmation">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DepositConfirmation />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/deposit-thank-you">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DepositThankYou />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/deposit-list">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DepositsListPage />
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
      <Route path="/referrals">
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
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <EditAccountPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/simple-edit-account">
        {() => (
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <SimpleEditAccount />
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
      <Route path="/deposits-history">
        {() => (
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <DepositsHistoryPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/withdrawal-history">
        {() => (
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <WithdrawalsHistoryPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>      <Route path="/admin/users">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <SettingsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/maintenance">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <MaintenancePage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/deposits">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <DepositsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/withdrawals">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <WithdrawalsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/audit-logs">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AuditLogsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/visitors">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <VisitorsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Catch all route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
        {!(location.startsWith('/admin')) && (
          <ErrorBoundary fallback={<div className="hidden">Support unavailable</div>}>
            <CustomerSupport />
          </ErrorBoundary>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Root level error caught:", error, errorInfo);
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

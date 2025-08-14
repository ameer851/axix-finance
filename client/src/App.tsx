import CustomerSupport from "@/components/CustomerSupport";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ResetPassword from "@/pages/Auth/ResetPassword";
import VerifyEmail from "@/pages/Auth/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

// Client pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLayout from "@/pages/admin/AdminLayout";
import AuditLogsPageStatic from "@/pages/admin/AuditLogsPageStatic";
import DepositsPage from "@/pages/admin/DepositsPage";
import MaintenancePageStatic from "@/pages/admin/MaintenancePageStatic";
import SettingsPageStatic from "@/pages/admin/SettingsPageStatic";
import UsersPageSimple from "@/pages/admin/UsersPageSimple";
import VisitorsPage from "@/pages/admin/VisitorsPage";
import WithdrawalsPage from "@/pages/admin/WithdrawalsPage";
import Deposit from "@/pages/Client/Deposit";
import DepositConfirmation from "@/pages/Client/DepositConfirmation";
import DepositsHistoryPage from "@/pages/Client/DepositsHistoryPage";
import DepositsListPage from "@/pages/Client/DepositsListPage";
import DepositThankYou from "@/pages/Client/DepositThankYou";
import EditAccountPage from "@/pages/Client/EditAccountPage";
import History from "@/pages/Client/History";
import Marketing from "@/pages/Client/Marketing";
import Profile from "@/pages/Client/Profile";
import Referrals from "@/pages/Client/Referrals";
import ClientSettings from "@/pages/Client/Settings";
import SimpleEditAccount from "@/pages/Client/SimpleEditAccount";
import Withdraw from "@/pages/Client/Withdraw";
import WithdrawalsHistoryPage from "@/pages/Client/WithdrawalsHistoryPage";

// Admin pages
// Legacy Admin (will be deprecated) - guarded by feature flag
const ENABLE_LEGACY_ADMIN = false;

// AdminV2 components
import DepositsPageV2 from "@/pages/AdminV2/deposits";
import UsersPageV2 from "@/pages/AdminV2/users";
import WithdrawalsPageV2 from "@/pages/AdminV2/withdrawals";

import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import DashboardLayout from "@/layouts/DashboardLayout";
import { lazy, useEffect } from "react";

// Lazy load some less critical components
const VerificationBanner = lazy(
  () => import("@/components/VerificationBanner")
);

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
    // Redirect legacy admin entrypoint to new Admin V2 Users page
    setLocation("/adminv2/users");
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
      if (
        ["/login", "/register", "/forgot-password", "/reset-password"].includes(
          location
        )
      ) {
        // Redirect based on user role
        if (user.role === "admin") {
          // Send admins to new Admin V2 panel instead of legacy /admin
          setLocation("/adminv2/users");
        } else {
          setLocation("/dashboard");
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
      <Route path="/client/dashboard">
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
      <Route path="/client/deposit">
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
      {/* Client prefixed routes for routing consistency */}
      <Route path="/client/withdraw">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Withdraw />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/history">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <History />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/profile">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/referrals">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Referrals />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/marketing">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Marketing />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/edit-account">
        {() => (
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <EditAccountPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/simple-edit-account">
        {() => (
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <SimpleEditAccount />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/settings">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <ClientSettings />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/deposits-history">
        {() => (
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <DepositsHistoryPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client/withdrawal-history">
        {() => (
          <ProtectedRoute requireVerified>
            <DashboardLayout>
              <WithdrawalsHistoryPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      {/* Admin Routes (legacy optionally enabled) */}
      {ENABLE_LEGACY_ADMIN && (
        <>
          <Route path="/admin">
            {() => (
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/users">
            {() => (
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <UsersPageSimple />
                </AdminLayout>
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/settings">
            {() => (
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <SettingsPageStatic />
                </AdminLayout>
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/maintenance">
            {() => (
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <MaintenancePageStatic />
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
                  <AuditLogsPageStatic />
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
        </>
      )}
      {!ENABLE_LEGACY_ADMIN && (
        <Route path="/admin">
          {() => (
            <ProtectedRoute requireAdmin>
              <AdminRedirect />
            </ProtectedRoute>
          )}
        </Route>
      )}
      <Route path="/adminv2">
        {() => (
          <ProtectedRoute requireAdmin>
            {/* Admin V2 Dashboard - Placeholder for actual content */}
            <div className="p-4">Admin V2 Dashboard</div>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/adminv2/users">
        {() => (
          <ProtectedRoute requireAdmin>
            <UsersPageV2 />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/adminv2/deposits">
        {() => (
          <ProtectedRoute requireAdmin>
            <DepositsPageV2 />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/adminv2/withdrawals">
        {() => (
          <ProtectedRoute requireAdmin>
            <WithdrawalsPageV2 />
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
        {!location.startsWith("/admin") && !location.startsWith("/adminv2") && (
          <ErrorBoundary
            fallback={<div className="hidden">Support unavailable</div>}
          >
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

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
import Notifications from "@/pages/Dashboard/Notifications";
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
import AdminDashboard from "@/pages/Admin";
import AdminUsers from "@/pages/Admin/Users";
import AdminAnalytics from "@/pages/Admin/Analytics";
import AdminRoles from "@/pages/Admin/Roles";
import AdminSecurity from "@/pages/Admin/Security";
import AdminData from "@/pages/Admin/Data";
import AdminSystemConfig from "@/pages/Admin/SystemConfig";
import AdminNotifications from "@/pages/Admin/Notifications";
import AdminLogs from "@/pages/Admin/Logs";
import AdminIntegrations from "@/pages/Admin/Integrations";
import DashboardLayout from "@/layouts/DashboardLayout";
import AdminLayout from "@/layouts/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Suspense, lazy } from "react";

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
  requireAdmin = false,
  requireVerified = false
}: { 
  children: React.ReactNode, 
  requireAdmin?: boolean,
  requireVerified?: boolean
}) {
  const { user, isAuthenticated, isAdmin, isVerified, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading) {
      // Handle authentication requirements
      if (!isAuthenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
      
      // Handle admin requirements
      if (requireAdmin && !isAdmin) {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page",
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
  }, [isLoading, isAuthenticated, isAdmin, requireAdmin, requireVerified, isVerified]);
  
  // Show loading state while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Redirect cases are handled in the useEffect hook
  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null;
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

function Router() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuthenticated) {
      if (['/login', '/register', '/forgot-password', '/reset-password'].includes(location)) {
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, location, setLocation]);

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
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/roles">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminRoles />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/security">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSecurity />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/data">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminData />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/system-config">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSystemConfig />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/notifications">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminNotifications />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/logs">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminLogs />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/integrations">
        {() => (
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminIntegrations />
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
  const isAdminPage = location.startsWith('/admin');
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(location);
  
  return (
    <>
      <Router />
      {/* Only show CustomerSupport component when not on admin or auth pages */}
      {!isAdminPage && !isAuthPage && <CustomerSupport whatsappNumber="+1234567890" />}
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

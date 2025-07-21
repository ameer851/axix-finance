import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Suspense, lazy } from 'react';

// Lazy load the verification banner
const VerificationBanner = lazy(() => import('@/components/VerificationBanner'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireVerified = false,
  requireAdmin = false
}: ProtectedRouteProps) {
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
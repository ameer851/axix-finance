import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect } from "react";
import { useLocation } from "wouter";

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
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
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
      const isOwner = Boolean((user as any)?.isOwner);
      if (
        requireAdmin &&
        !(user?.is_admin || user?.role === "admin" || isOwner)
      ) {
        setIsRedirecting(true);
        toast({
          title: "Access denied",
          description: "Admin access required to view this page",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    requireAdmin,
    user?.role,
    user?.is_admin,
    isRedirecting,
    toast,
    setLocation,
  ]);

  // Show loading state while authentication is being checked or redirecting
  if (isLoading || isRedirecting) {
    return <LoadingSpinner />;
  }

  // Block access for unauthenticated users
  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  // Block access for non-admin users trying to access admin routes
  const isOwner = Boolean((user as any)?.isOwner);
  if (requireAdmin && !(user?.is_admin || user?.role === "admin" || isOwner)) {
    return <LoadingSpinner />;
  }
  return <>{children}</>;
}

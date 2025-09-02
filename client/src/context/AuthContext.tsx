import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  checkServerConnection,
  getCurrentUser,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from "@/services/authService";
import { User } from "@shared/schema";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
  updateUser: (data: Partial<User>) => void; // added
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const refreshUserData = async () => {
    try {
      // Import api at the top of the file to use our improved client
      const { api } = await import("@/lib/api");

      // First, ensure we have a valid Supabase session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Session error: " + sessionError.message);
      }

      if (!session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError || !refreshData.session) {
          console.warn(
            "No active session and refresh failed:",
            refreshError?.message
          );
          // Don't throw error here, just return without refreshing
          return;
        }
      }

      // First get the user profile with our enhanced API client
      try {
        // Use enhanced api client
        const profileResp: any = await api.get("/api/profile");
        const userData = (profileResp && profileResp.user) || profileResp;

        // Use server-provided isOwner when available; fallback to VITE env
        const ownerEmail = (import.meta as any).env?.VITE_OWNER_EMAIL as
          | string
          | undefined;
        const ownerUid = (import.meta as any).env?.VITE_OWNER_UID as
          | string
          | undefined;
        const ownerId = (import.meta as any).env?.VITE_OWNER_USER_ID as
          | string
          | undefined;
        const isOwner =
          (userData as any)?.isOwner === true
            ? true
            : Boolean(
                (ownerEmail &&
                  userData?.email &&
                  String(userData.email).toLowerCase() ===
                    String(ownerEmail).toLowerCase()) ||
                  (ownerUid &&
                    (userData?.uid || (userData as any)?.auth_uid) &&
                    String(userData.uid || (userData as any).auth_uid) ===
                      String(ownerUid)) ||
                  (ownerId && String(userData?.id) === String(ownerId))
              );

        // Then try to get the latest balance - important to have real-time balance
        try {
          if (userData.id) {
            const balanceData = await api.get(
              `/api/users/${userData.id}/balance`
            );
            // Update the user data with the latest balance
            if (balanceData.availableBalance) {
              userData.balance = balanceData.availableBalance.toString();
            }
          }
        } catch (balanceErr) {
          console.warn(
            "Failed to fetch latest balance during user refresh:",
            balanceErr
          );
          // Continue with existing balance - don't fail the whole refresh
        }

        const merged = { ...userData, isOwner };
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
      } catch (error: any) {
        // Handle specific error codes
        if (error.status === 401) {
          localStorage.removeItem("user");
          setUser(null);

          // Don't show notification during initial page load
          if (user !== null) {
            toast({
              title: "Session expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive",
            });
          }
        } else {
          // For other errors, just log them without disrupting the user experience
          console.warn("Failed to refresh user data:", error);
        }
      }
    } catch (err: any) {
      // This is our top-level error handler - it should catch any errors not caught above
      console.error("Failed to refresh user data (top level):", err);

      // Check if it's a network/offline error
      const isNetworkError =
        err.message &&
        (err.message.includes("Network error") ||
          err.message.includes("Failed to fetch") ||
          err.message.includes("network") ||
          err.message.includes("offline"));

      // Show offline notification only if we have a user and it's a network error
      if (user && isNetworkError) {
        toast({
          title: "Offline mode",
          description: "You are working offline with limited functionality.",
          variant: "default",
        });
      }
      // Don't clear user data on network errors to support offline mode
    }
  };

  // Verify authentication on mount and periodically
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Check for user in local storage
        const storedUser = getCurrentUser();
        if (storedUser) {
          // Validate the stored user by checking the server connection
          const isServerAvailable = await checkServerConnection();
          if (isServerAvailable) {
            // Refresh user data from server
            await refreshUserData();
          } else {
            setUser(storedUser); // Use stored data when offline
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // Clear invalid session
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up periodic session validation (every 15 minutes)
    const intervalId = setInterval(
      async () => {
        if (user) {
          const isValid = await checkServerConnection();
          if (!isValid) {
            toast({
              title: "Session expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive",
            });
            await logout();
          }
        }
      },
      15 * 60 * 1000
    );

    return () => clearInterval(intervalId);
  }, []);

  const login = async (identifier: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await loginService(identifier, password);
      // Prefer server-provided isOwner; fallback to VITE env
      const ownerEmail = (import.meta as any).env?.VITE_OWNER_EMAIL as
        | string
        | undefined;
      const ownerUid = (import.meta as any).env?.VITE_OWNER_UID as
        | string
        | undefined;
      const ownerId = (import.meta as any).env?.VITE_OWNER_USER_ID as
        | string
        | undefined;
      const isOwner =
        (userData as any)?.isOwner === true
          ? true
          : Boolean(
              (ownerEmail &&
                userData?.email &&
                String(userData.email).toLowerCase() ===
                  String(ownerEmail).toLowerCase()) ||
                (ownerUid &&
                  (userData as any)?.uid &&
                  String((userData as any).uid) === String(ownerUid)) ||
                (ownerId && String((userData as any)?.id) === String(ownerId))
            );
      const merged = { ...(userData as any), isOwner } as any;
      setUser(merged);

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username || userData.firstName || identifier}!`,
        variant: "default",
      });

      return merged as User;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login");

      let errorMessage = "Login failed. Please try again.";
      if (err.isOffline || err.isNetworkError) {
        errorMessage =
          "Cannot connect to server. Please check your internet connection.";
      } else if (err.status === 401) {
        errorMessage = "Invalid username or password.";
      } else if (err.status === 403) {
        errorMessage = "Your account has been deactivated.";
      }

      toast({
        title: "Login error",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const registrationResult = await registerService(userData);

      // Don't set user or log them in automatically
      // The backend now returns registration info instead of user object
      if ((registrationResult as any)._shouldRedirectToLogin) {
        toast({
          title: "Registration successful! 🎉",
          description:
            (registrationResult as any)._registrationMessage ||
            "Account created successfully! Check your email for login credentials.",
          variant: "default",
        });

        // Don't set the user in state - they need to login manually
        return registrationResult;
      } else {
        // Fallback for old response format (shouldn't happen with new backend)
        setUser(registrationResult);
        toast({
          title: "Registration successful",
          description: `Welcome to Axix Finance, ${registrationResult.firstName || registrationResult.username}!`,
          variant: "default",
        });
        return registrationResult;
      }
    } catch (err: any) {
      setError(err.message || "Failed to register");

      // Show appropriate toast based on error type
      let errorMessage = "Registration failed. Please try again.";
      if (err.isOffline || err.isNetworkError) {
        errorMessage =
          "Cannot connect to server. Please check your internet connection.";
      } else if (err.message.includes("Username already exists")) {
        errorMessage = "This username is already taken.";
      } else if (err.message.includes("Email already exists")) {
        errorMessage = "This email is already registered.";
      }

      toast({
        title: "Registration error",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutService();
      setUser(null);

      toast({
        title: "Logout successful",
        description: "You have been successfully logged out.",
        variant: "default",
      });

      // Navigate to home page after successful logout
      setLocation("/");
    } catch (err: any) {
      console.error("Logout error:", err);
      // Even if there's an error, we still want to log out locally
      setUser(null);
      localStorage.removeItem("user");

      if (!err.isOffline && !err.isNetworkError) {
        toast({
          title: "Logout issue",
          description:
            "You have been logged out, but there was an issue with the server.",
          variant: "default",
        });
      }

      // Navigate to home page even if there was an error
      setLocation("/");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance.toString() };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...data };
      setUser(merged);
      localStorage.setItem("user", JSON.stringify(merged));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isVerified: !!user && !!user.isVerified,
        isLoading,
        login,
        register,
        logout,
        refreshUserData,
        updateUserBalance,
        updateUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

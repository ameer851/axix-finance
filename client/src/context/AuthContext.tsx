import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import { User } from '@shared/schema';
import { 
  login as loginService, 
  register as registerService, 
  logout as logoutService, 
  getCurrentUser,
  checkServerConnection
} from '@/services/authService';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up periodic session validation (every 15 minutes)
    const intervalId = setInterval(async () => {
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
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const refreshUserData = async () => {
    try {
      const response = await apiRequest('GET', '/api/profile', undefined, {
        throwOnError: false // Don't throw on error, handle manually
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // If unauthorized, clear user data
        if (response.status === 401) {
          localStorage.removeItem('user');
          setUser(null);
          // Show notification about expired session
          toast({
            title: "Session expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to refresh user data:", err);
      // Show offline notification only if we have a user and it's a network error
      if (user && (err.isOffline || err.isNetworkError)) {
        toast({
          title: "Offline mode",
          description: "You are working offline with limited functionality.",
          variant: "default",
        });
      }
      // Don't clear user data on network errors to support offline mode
    }
  };

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await loginService(username, password);
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.firstName || username}!`,
        variant: "default",
      });
      
      return userData; // Return the user data for immediate access to role
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Failed to login');
      
      // Show appropriate toast based on error type
      let errorMessage = 'Login failed. Please try again.';
      if (err.isOffline || err.isNetworkError) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (err.status === 401) {
        errorMessage = 'Invalid username or password.';
      } else if (err.status === 403) {
        errorMessage = 'Your account has been deactivated.';
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

  const register = async (userData: any): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await registerService(userData);
      setUser(newUser);
      
      toast({
        title: "Registration successful",
        description: `Welcome to CaraxFinance, ${newUser.firstName || newUser.username}!`,
        variant: "default",
      });
      
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      
      // Show appropriate toast based on error type
      let errorMessage = 'Registration failed. Please try again.';
      if (err.isOffline || err.isNetworkError) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (err.message.includes('Username already exists')) {
        errorMessage = 'This username is already taken.';
      } else if (err.message.includes('Email already exists')) {
        errorMessage = 'This email is already registered.';
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
      setLocation('/');
    } catch (err: any) {
      console.error("Logout error:", err);
      // Even if there's an error, we still want to log out locally
      setUser(null);
      localStorage.removeItem('user');
      
      if (!err.isOffline && !err.isNetworkError) {
        toast({
          title: "Logout issue",
          description: "You have been logged out, but there was an issue with the server.",
          variant: "default",
        });
      }
      
      // Navigate to home page even if there was an error
      setLocation('/');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance.toString() };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
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
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

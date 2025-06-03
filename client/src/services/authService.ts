import { User, InsertUser } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Check if the server is available
export async function checkServerConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout to quickly detect server issues
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
}

export async function login(username: string, password: string): Promise<User> {
  try {
    // First check if the server is reachable with a longer timeout
    const isServerAvailable = await fetch('/api/health', { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Longer timeout for more reliable connection check
      signal: AbortSignal.timeout(5000)
    }).then(res => res.ok).catch(() => false);
    
    if (!isServerAvailable) {
      console.error('Server health check failed before login attempt');
      throw new Error('Unable to connect to the server. Please try again later.');
    }

    // Attempt login for user
    
    // Use a direct fetch call with explicit error handling for login
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
      signal: AbortSignal.timeout(10000) // 10 second timeout for login
    });
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response from login API:', await response.text());
      throw new Error('Server returned an invalid response. Please try again later.');
    }
    
    const data = await response.json();
    
    // Handle error responses
    if (!response.ok) {
      console.error('Login API error:', data);
      throw new Error(data.message || 'Authentication failed. Please check your credentials.');
    }
    
    // Store the user in localStorage for persistent login
    localStorage.setItem('user', JSON.stringify(data));
    
    // Login successful
    return data;
  } catch (error: any) {
    console.error('Login error details:', error);
    
    // Enhance error messages for common issues
    if (error.name === 'AbortError') {
      throw new Error('Login request timed out. The server might be experiencing high load.');
    } else if (error.message.includes('NetworkError') || !navigator.onLine) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // Rethrow the original error if it's already well-formed
    throw error;
  }
}

export async function register(userData: Omit<InsertUser, 'password'> & { password: string }): Promise<User> {
  try {
    const response = await apiRequest('POST', '/api/register', userData);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    const newUser = await response.json();
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  } catch (error: any) {
    if (error.message?.includes('Username already exists')) {
      throw new Error('This username is already taken. Please choose another.');
    }
    if (error.message?.includes('Email already exists')) {
      throw new Error('This email address is already registered. Try to login instead.');
    }
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
}

export async function logout(): Promise<void> {
  try {
    const response = await apiRequest('POST', '/api/logout');
    if (!response.ok) {
      console.warn('Logout API returned an error, but proceeding with local logout');
    }
    localStorage.removeItem('user');
    queryClient.invalidateQueries();
  } catch (error: any) {
    console.error('Logout error:', error);
    // Even if the server request fails, we'll still clear local storage
    localStorage.removeItem('user');
    queryClient.invalidateQueries();
  }
}

export async function getCurrentUserFromServer(): Promise<User | null> {
  try {
    const response = await apiRequest('GET', '/api/user');
    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, clear local storage
        localStorage.removeItem('user');
        return null;
      }
      throw new Error('Failed to fetch current user');
    }
    const userData = await response.json();
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export function getCurrentUser(): User | null {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('GET', `/api/auth/verify-email?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Email verified successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to verify email'
    };
  }
}

export async function resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('POST', '/api/resend-verification');
    const data = await response.json();
    return {
      success: true, 
      message: data.message || 'Verification email sent successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to resend verification email'
    };
  }
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('POST', '/api/auth/forgot-password', { email });
    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Password reset instructions sent to your email'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to process password reset request'
    };
  }
}

export async function resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('POST', '/api/auth/reset-password', { token, password });
    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Password reset successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to reset password'
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ message: string }> {
  try {
    const response = await apiRequest('POST', '/api/change-password', {
      userId,
      currentPassword,
      newPassword
    });
    
    const result = await response.json();
    
    return result;
  } catch (error: any) {
    console.error('Password change error:', error);
    
    if (error.status === 401) {
      throw new Error('Current password is incorrect.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'New password does not meet requirements.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to change password. Please try again later.');
  }
}

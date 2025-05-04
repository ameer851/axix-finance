import { User, InsertUser } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

export async function login(username: string, password: string): Promise<User> {
  try {
    const response = await apiRequest('POST', '/api/login', { username, password });
    const userData = await response.json();
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to log in. Please check your credentials.');
  }
}

export async function register(userData: Omit<InsertUser, 'password'> & { password: string }): Promise<User> {
  try {
    const response = await apiRequest('POST', '/api/register', userData);
    const newUser = await response.json();
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('POST', '/api/logout');
    localStorage.removeItem('user');
    queryClient.invalidateQueries();
  } catch (error: any) {
    // Silent error handling for logout
    // Even if the server request fails, we'll still clear local storage
    localStorage.removeItem('user');
  }
}

export function getCurrentUser(): User | null {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

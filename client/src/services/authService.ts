import { User, InsertUser } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export async function login(username: string, password: string): Promise<User> {
  try {
    const response = await apiRequest('POST', '/api/auth/login', { username, password });
    const userData = await response.json();
    return userData;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to log in. Please check your credentials.');
  }
}

export async function register(userData: Omit<InsertUser, 'password'> & { password: string }): Promise<User> {
  try {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    const newUser = await response.json();
    return newUser;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
}

export async function logout(): Promise<void> {
  // In a real-world app with a more complete backend, this would make a call to invalidate the session
  localStorage.removeItem('user');
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

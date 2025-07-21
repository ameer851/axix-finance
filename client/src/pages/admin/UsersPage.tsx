import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/services/userService';

export default function UsersPage() {
  const { toast } = useToast();
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });

  // Geolocation state
  const [geoData, setGeoData] = useState<Record<string, { city?: string; country?: string }>>({});

  useEffect(() => {
    if (users?.users) {
      const uniqueIps = Array.from(new Set((users.users as any[]).map((u) => (u as any).ipAddress).filter(Boolean)));
      uniqueIps.forEach((ip) => {
        const ipStr = String(ip);
        if (!geoData[ipStr]) {
          fetch(`https://ipapi.co/${ipStr}/json/`)
            .then(res => res.json())
            .then(data => {
              setGeoData(prev => ({ ...prev, [ipStr]: { city: data.city, country: data.country_name } }));
            })
            .catch(() => {
              setGeoData(prev => ({ ...prev, [ipStr]: { city: 'Unknown', country: '' } }));
            });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load users",
      variant: "destructive",
    });
    return (
      <div className="text-center text-red-500">
        Failed to load users. Please try again later.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Users Management</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users?.users.map((user: any) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.username}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs text-gray-700 dark:text-gray-300">{user.ipAddress || '—'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {user.ipAddress && geoData[user.ipAddress] ? `${geoData[user.ipAddress].city || ''}${geoData[user.ipAddress].city && geoData[user.ipAddress].country ? ', ' : ''}${geoData[user.ipAddress].country || ''}` : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      // Handle edit user
                      toast({
                        title: "Edit User",
                        description: "Edit user functionality coming soon",
                      });
                    }}
                    className="text-primary hover:text-primary-dark mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      // Handle delete user
                      toast({
                        title: "Delete User",
                        description: "Delete user functionality coming soon",
                      });
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
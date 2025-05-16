import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUsers, getUserDetails, deactivateUser, reactivateUser, deleteUser, forceUserLogout } from '@/services/adminService';
import { UserWithBalance, UserFilters } from './types';
import UserList from './components/UserList';
import UserFilterControls from './components/UserFilters';

/**
 * UserManagement component for the admin panel
 * Provides complete user management functionality including:
 * - Listing users with filtering and pagination
 * - Viewing user details
 * - Deactivating/reactivating users
 * - Deleting users (super admin only)
 * - Forcing user logout
 */
const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for filters and pagination
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    status: undefined,
    balanceRange: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });
  
  // State for dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {}
  });
  
  const [userDetailsDialog, setUserDetailsDialog] = useState<{
    isOpen: boolean;
    userId?: number;
  }>({
    isOpen: false
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId?: number;
    reason: string;
  }>({
    isOpen: false,
    reason: ''
  });
  
  // Current user role (would typically come from an authentication context)
  // This is a placeholder - in a real app, you'd get this from your auth context
  const currentUserRole = 'super_admin';
  
  // Fetch users with pagination and filtering
  const { 
    data: usersData, 
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError
  } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => getUsers(filters),
    staleTime: 60000 // 1 minute
  });
  
  // Fetch user details for the details dialog
  const {
    data: userDetails,
    isLoading: isUserDetailsLoading,
    isError: isUserDetailsError
  } = useQuery({
    queryKey: ['user-details', userDetailsDialog.userId],
    queryFn: () => getUserDetails(userDetailsDialog.userId || 0),
    enabled: !!userDetailsDialog.userId && userDetailsDialog.isOpen,
    staleTime: 60000 // 1 minute
  });
  
  // Mutations
  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User Deactivated',
        description: 'The user has been successfully deactivated.',
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to deactivate user: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  const reactivateMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User Reactivated',
        description: 'The user has been successfully reactivated.',
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to reactivate user: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      setDeleteDialog({ isOpen: false, reason: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User Deleted',
        description: 'The user has been permanently deleted from the system.',
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  const logoutMutation = useMutation({
    mutationFn: forceUserLogout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User Logged Out',
        description: 'All user sessions have been terminated.',
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to force logout: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 when filters change
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      role: undefined,
      status: undefined,
      balanceRange: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
  };
  
  // Handle pagination changes
  const handlePaginationChange = (newPagination: { pageIndex: number; pageSize: number }) => {
    setFilters((prev) => ({
      ...prev,
      page: newPagination.pageIndex + 1,
      limit: newPagination.pageSize
    }));
  };
  
  // View user details
  const handleViewUser = (userId: number) => {
    setUserDetailsDialog({
      isOpen: true,
      userId
    });
  };
  
  // Deactivate a user
  const handleDeactivateUser = (userId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Deactivate User',
      description: 'Are you sure you want to deactivate this user? They will be unable to login until reactivated.',
      action: () => {
        deactivateMutation.mutate(userId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // Reactivate a user
  const handleReactivateUser = (userId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reactivate User',
      description: 'Are you sure you want to reactivate this user? They will regain access to the system.',
      action: () => {
        reactivateMutation.mutate(userId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // Delete a user (requires super admin)
  const handleDeleteUser = (userId: number) => {
    if (currentUserRole !== 'super_admin') {
      toast({
        title: 'Permission Denied',
        description: 'Only Super Admins can delete users.',
        variant: 'destructive'
      });
      return;
    }
    
    setDeleteDialog({
      isOpen: true,
      userId,
      reason: ''
    });
  };
  
  // Force logout a user
  const handleForceLogout = (userId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Force Logout',
      description: 'Are you sure you want to force logout this user from all sessions?',
      action: () => {
        logoutMutation.mutate(userId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // Submit user deletion with reason
  const handleSubmitDelete = () => {
    if (!deleteDialog.userId) return;
    
    if (deleteDialog.reason.length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a detailed reason for deletion (at least 10 characters).',
        variant: 'destructive'
      });
      return;
    }
    
    deleteMutation.mutate(deleteDialog.userId);
  };
  
  // Calculate maximum balance for slider
  const maxBalance = usersData?.users && usersData.users.length > 0
    ? Math.max(...usersData.users.map(user => user.balance.available + user.balance.pending))
    : 10000;
    
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts, balances and permissions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Filters */}
          <UserFilterControls
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            maxBalance={maxBalance}
          />
          
          {/* Loading state */}
          {isUsersLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Error state */}
          {isUsersError && (
            <div className="bg-red-50 p-4 rounded-md text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading users: {usersError?.message || 'Unknown error'}</span>
            </div>
          )}
          
          {/* Empty state */}
          {!isUsersLoading && !isUsersError && (!usersData?.users || usersData.users.length === 0) && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters to find users.
              </p>
            </div>
          )}
          
          {/* Users data table */}
          {!isUsersLoading && !isUsersError && usersData?.users && usersData.users.length > 0 && (
            <UserList
              users={usersData.users}
              isLoading={isUsersLoading}
              pagination={{
                pageIndex: filters.page - 1,
                pageSize: filters.limit,
                pageCount: usersData.totalPages,
                total: usersData.total
              }}
              onPaginationChange={handlePaginationChange}
              onViewUser={handleViewUser}
              onDeactivateUser={handleDeactivateUser}
              onReactivateUser={handleReactivateUser}
              onDeleteUser={handleDeleteUser}
              onForceLogout={handleForceLogout}
              currentUserRole={currentUserRole}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {usersData?.users?.length || 0} of {usersData?.total || 0} users
          </div>
        </CardFooter>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button onClick={confirmDialog.action}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User Details Dialog */}
      <Dialog open={userDetailsDialog.isOpen} onOpenChange={(open) => setUserDetailsDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          
          {isUserDetailsLoading && (
            <div className="space-y-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          )}
          
          {isUserDetailsError && (
            <div className="text-center py-4">
              <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
              <p className="mt-2 text-red-600">Failed to load user details</p>
            </div>
          )}
          
          {!isUserDetailsLoading && !isUserDetailsError && userDetails && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-xl font-medium text-primary">
                    {userDetails.firstName?.[0]}{userDetails.lastName?.[0]}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium">
                  {userDetails.firstName} {userDetails.lastName}
                </h3>
                <p className="text-sm text-gray-500">{userDetails.email}</p>
                <p className="text-sm mt-1">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${userDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {userDetails.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 ml-2">
                    {userDetails.role}
                  </span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Available Balance</p>
                  <p className="text-lg font-semibold">
                    ${userDetails.balance.available.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Pending Balance</p>
                  <p className="text-lg font-semibold">
                    ${userDetails.balance.pending.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Total Transactions</p>
                  <p className="text-lg font-semibold">
                    {userDetails.transactions.total}
                  </p>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Account Created</p>
                  <p className="text-sm font-medium">
                    {new Date(userDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p><strong>User ID:</strong> {userDetails.id}</p>
                <p><strong>Last Login:</strong> {userDetails.lastLoginAt 
                  ? new Date(userDetails.lastLoginAt).toLocaleString() 
                  : 'Never'}</p>
                <p><strong>Verification:</strong> {userDetails.isVerified ? 'Verified' : 'Not Verified'}</p>
              </div>
              
              <div className="flex justify-between">
                {userDetails.isActive ? (
                  <Button 
                    variant="outline" 
                    className="bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={() => {
                      setUserDetailsDialog({ isOpen: false });
                      handleDeactivateUser(Number(userDetails.id));
                    }}
                  >
                    Deactivate User
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="bg-green-50 text-green-600 hover:bg-green-100"
                    onClick={() => {
                      setUserDetailsDialog({ isOpen: false });
                      handleReactivateUser(Number(userDetails.id));
                    }}
                  >
                    Reactivate User
                  </Button>
                )}
                
                <Button onClick={() => setUserDetailsDialog({ isOpen: false })}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The user and all associated data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Please provide a reason for deletion:</p>
              <Textarea
                placeholder="Enter detailed reason for deletion..."
                value={deleteDialog.reason}
                onChange={(e) => setDeleteDialog(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
              />
              {deleteDialog.reason.length < 10 && (
                <p className="text-xs text-red-500">
                  Please provide a detailed reason (minimum 10 characters)
                </p>
              )}
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
              <p className="font-medium">Warning:</p>
              <p>This action will delete the user account and all associated data, including:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Transaction history</li>
                <li>Account balances</li>
                <li>Personal information</li>
                <li>Settings and preferences</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ isOpen: false, reason: '' })}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSubmitDelete}
              disabled={deleteDialog.reason.length < 10 || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

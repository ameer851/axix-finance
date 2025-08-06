import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminService, AdminStats, User, Transaction } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  Trash2,
  Key,
  RefreshCw
} from "lucide-react";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // User management states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');

  // Fetch admin stats
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats
  } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch users
  const { 
    data: usersData, 
    isLoading: usersLoading 
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(1, 100),
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch pending deposits
  const { 
    data: pendingDeposits, 
    isLoading: depositsLoading 
  } = useQuery({
    queryKey: ['admin-pending-deposits'],
    queryFn: () => adminService.getDeposits('pending'),
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Fetch pending withdrawals
  const { 
    data: pendingWithdrawals, 
    isLoading: withdrawalsLoading 
  } = useQuery({
    queryKey: ['admin-pending-withdrawals'],
    queryFn: () => adminService.getWithdrawals('pending'),
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Mutations for transaction approval/rejection
  const approveMutation = useMutation({
    mutationFn: adminService.approveTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: "Success", description: "Transaction approved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve transaction", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminService.rejectTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: "Success", description: "Transaction rejected successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject transaction", variant: "destructive" });
    },
  });

  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  // Mutation for updating user password
  const updateUserPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) => 
      adminService.updateUserPassword(userId, password),
    onSuccess: () => {
      setSelectedUserId(null);
      setNewUserPassword('');
      toast({ title: "Success", description: "User password updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user password", variant: "destructive" });
    },
  });

  // Handle admin password change
  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      await adminService.updateAdminPassword(currentPassword, newPassword, confirmPassword);
      toast({
        title: "Success",
        description: "Admin password updated successfully",
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating admin password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (statsLoading) {
    return (
      <div className="animate-pulse p-6">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button onClick={() => refetchStats()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalDeposits || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.deposits?.pending || stats?.pendingDeposits || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalWithdrawals || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.withdrawals?.pending || stats?.pendingWithdrawals || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending-deposits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending-deposits">
            Pending Deposits ({pendingDeposits?.transactions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending-withdrawals">
            Pending Withdrawals ({pendingWithdrawals?.transactions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="users">Users ({usersData?.users?.length || 0})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Pending Deposits Tab */}
        <TabsContent value="pending-deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              {depositsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDeposits?.transactions?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending deposits</p>
                  ) : (
                    pendingDeposits?.transactions?.map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{deposit.users?.email || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">
                            Amount: {formatCurrency(deposit.amount)} • {formatDate(deposit.created_at)}
                          </p>
                          {deposit.method && (
                            <p className="text-sm text-gray-500">Method: {deposit.method}</p>
                          )}
                          {deposit.reference && (
                            <p className="text-sm text-gray-500">Reference: {deposit.reference}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(deposit.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(deposit.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Withdrawals Tab */}
        <TabsContent value="pending-withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingWithdrawals?.transactions?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending withdrawals</p>
                  ) : (
                    pendingWithdrawals?.transactions?.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{withdrawal.users?.email || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">
                            Amount: {formatCurrency(withdrawal.amount)} • {formatDate(withdrawal.created_at)}
                          </p>
                          {withdrawal.method && (
                            <p className="text-sm text-gray-500">Method: {withdrawal.method}</p>
                          )}
                          {withdrawal.address && (
                            <p className="text-sm text-gray-500">Address: {withdrawal.address}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(withdrawal.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(withdrawal.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {usersData?.users?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No users found</p>
                  ) : (
                    usersData?.users?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            {user.first_name} {user.last_name} • Joined {formatDate(user.created_at)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {user.role && (
                              <Badge variant="outline">{user.role}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {selectedUserId === user.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="password"
                                placeholder="New password"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                className="w-32"
                              />
                              <Button
                                size="sm"
                                onClick={() =>updateUserPasswordMutation.mutate({
                                  userId: user.id,
                                  password: newUserPassword
                                })}
                                disabled={updateUserPasswordMutation.isPending || !newUserPassword}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserId(null);
                                  setNewUserPassword('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <Key className="h-4 w-4 mr-1" />
                                Change Password
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminPasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">
                  Change Admin Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { User } from '@shared/schema';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  getAllUsers, 
  searchUsers, 
  updateUserVerification, 
  updateUserActiveStatus, 
  exportUsers 
} from '@/services/adminService';
import { getUserTransactions } from '@/services/userService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search,
  UserCog,
  Mail,
  Eye,
  UserX,
  Filter,
  Download,
  FileSpreadsheet,
  UserCheck,
  CheckCircle2,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

const Users: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "verified", "unverified", "active", "inactive"

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getAllUsers
  });

  // Fetch selected user's transactions
  const { data: userTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/users', selectedUser?.id, 'transactions'],
    queryFn: () => getUserTransactions(selectedUser!.id),
    enabled: !!selectedUser && showTransactions,
  });

  // Add useQuery for user search
  const { data: searchResults, refetch: performSearch } = useQuery<User[]>({
    queryKey: ['/api/search/users', searchQuery],
    queryFn: () => searchQuery.length >= 3 ? searchUsers(searchQuery) : [],
    enabled: false
  });

  // Filter users based on active tab
  const filterUsersByTab = (users: User[]) => {
    if (!users) return [];
    
    switch(activeTab) {
      case "verified":
        return users.filter(user => user.isVerified);
      case "unverified":
        return users.filter(user => !user.isVerified);
      case "active":
        return users.filter(user => user.isActive);
      case "inactive":
        return users.filter(user => !user.isActive);
      default:
        return users;
    }
  };

  // Further filter based on search query
  const filteredUsers = filterUsersByTab(users || []).filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle search submit
  const handleSearch = async () => {
    if (searchQuery.length >= 3) {
      setIsUserSearchLoading(true);
      try {
        await performSearch({ throwOnError: true });
      } catch (error) {
        toast({
          title: "Search failed",
          description: "There was an error searching for users.",
          variant: "destructive"
        });
      } finally {
        setIsUserSearchLoading(false);
      }
    }
  };

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: (params: { userId: number, isVerified: boolean }) => {
      return updateUserVerification(params.userId, params.isVerified);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowVerifyModal(false);
      toast({
        title: "User verification updated",
        description: `User verification status has been updated.`,
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error updating the user's verification status.",
        variant: "destructive"
      });
    }
  });

  // Activate/deactivate user mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: (params: { userId: number, isActive: boolean }) => {
      return updateUserActiveStatus(params.userId, params.isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowDeactivateModal(false);
      toast({
        title: "User status updated",
        description: `User activation status has been updated.`,
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error updating the user's status.",
        variant: "destructive"
      });
    }
  });

  // Export users as CSV
  const handleExportUsers = () => {
    // Redirect to the export endpoint
    window.open('/api/users/export', '_blank');
  };

  // Actions to perform on users
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowTransactions(false);
  };

  const handleViewTransactions = (user: User) => {
    setSelectedUser(user);
    setShowTransactions(true);
  };

  const handleVerifyUser = (user: User) => {
    setSelectedUser(user);
    setShowVerifyModal(true);
  };

  const handleToggleActiveStatus = (user: User) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
  };

  const submitVerification = (verified: boolean) => {
    if (selectedUser) {
      verifyUserMutation.mutate({ userId: selectedUser.id, isVerified: verified });
    }
  };

  const submitStatusUpdate = (active: boolean) => {
    if (selectedUser) {
      updateUserStatusMutation.mutate({ userId: selectedUser.id, isActive: active });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const userTableColumns = [
    {
      header: 'User',
      accessorKey: 'username',
      cell: (user: User) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {`${user.firstName} ${user.lastName}`}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{user.username}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (user: User) => (
        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
      )
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (user: User) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.role === 'admin' 
            ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
        }`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      )
    },
    {
      header: 'Account Balance',
      accessorKey: 'balance',
      cell: (user: User) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCurrency(user.balance as string)}
        </div>
      )
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: (user: User) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDate(user.createdAt)}
        </div>
      )
    },
  ];

  const transactionTableColumns = [
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (transaction: any) => (
        <div className="capitalize text-sm text-gray-900 dark:text-white">
          {transaction.type}
        </div>
      )
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (transaction: any) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCurrency(transaction.amount)}
        </div>
      )
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (transaction: any) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDate(transaction.createdAt)}
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (transaction: any) => {
        let bgColor, textColor;
        
        switch(transaction.status) {
          case 'completed':
            bgColor = 'bg-green-100 dark:bg-green-900';
            textColor = 'text-green-800 dark:text-green-200';
            break;
          case 'pending':
            bgColor = 'bg-yellow-100 dark:bg-yellow-900';
            textColor = 'text-yellow-800 dark:text-yellow-200';
            break;
          case 'rejected':
            bgColor = 'bg-red-100 dark:bg-red-900';
            textColor = 'text-red-800 dark:text-red-200';
            break;
          default:
            bgColor = 'bg-gray-100 dark:bg-gray-800';
            textColor = 'text-gray-800 dark:text-gray-200';
        }
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        );
      }
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">User Management</h1>
      
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user accounts and view their information</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportUsers}
            className="gap-1"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                All Users
                <Badge variant="outline" className="ml-2">{users?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="verified">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified
                <Badge variant="outline" className="ml-2">
                  {users?.filter(u => u.isVerified).length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unverified">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Unverified
                <Badge variant="outline" className="ml-2">
                  {users?.filter(u => !u.isVerified).length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active">
                Active
                <Badge variant="outline" className="ml-2">
                  {users?.filter(u => u.isActive).length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="inactive">
                <Ban className="mr-1 h-3 w-3" />
                Inactive
                <Badge variant="outline" className="ml-2">
                  {users?.filter(u => !u.isActive).length || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleSearch} 
              disabled={searchQuery.length < 3 || isUserSearchLoading}
              className="gap-1"
            >
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
          
          <DataTable
            columns={userTableColumns}
            data={filteredUsers}
            loading={isLoading}
            actions={(user) => (
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewUser(user)}
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" /> Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewTransactions(user)}
                  className="gap-1"
                >
                  <UserCog className="h-4 w-4" /> Transactions
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1"
                  onClick={() => handleVerifyUser(user)}
                >
                  <UserCheck className="h-4 w-4" /> 
                  {user.isVerified ? 'Unverify' : 'Verify'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`gap-1 ${!user.isActive ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900' : 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900'}`}
                  onClick={() => handleToggleActiveStatus(user)}
                >
                  {user.isActive ? (
                    <>
                      <UserX className="h-4 w-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Activate
                    </>
                  )}
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser && !showTransactions} onOpenChange={(open) => !open && setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Comprehensive information about this user
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {`${selectedUser.firstName} ${selectedUser.lastName}`}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="mt-1 flex items-center text-gray-900 dark:text-white">
                    <Mail className="mr-1 h-4 w-4" />
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                  <p className="mt-1 text-gray-900 dark:text-white capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Balance</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatCurrency(selectedUser.balance as string)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Status</p>
                  <div className="mt-1 flex items-center">
                    {selectedUser.isVerified ? (
                      <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Not Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</p>
                  <div className="mt-1 flex items-center">
                    {selectedUser.isActive ? (
                      <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => handleViewTransactions(selectedUser)}>
                  <UserCog className="mr-1 h-4 w-4" /> View Transactions
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleVerifyUser(selectedUser)}
                  className="gap-1"
                >
                  <UserCheck className="h-4 w-4" /> 
                  {selectedUser.isVerified ? 'Unverify' : 'Verify'}
                </Button>
                <Button 
                  variant={selectedUser.isActive ? "destructive" : "outline"}
                  onClick={() => handleToggleActiveStatus(selectedUser)}
                  className="gap-1"
                >
                  {selectedUser.isActive ? (
                    <>
                      <UserX className="h-4 w-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Activate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      {/* User Verification Dialog */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        {selectedUser && (
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {selectedUser.isVerified 
                  ? "Revoke User Verification" 
                  : "Verify User"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser.isVerified 
                  ? "Are you sure you want to revoke verification for this user?" 
                  : "Are you sure you want to verify this user?"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center space-x-4 py-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {`${selectedUser.firstName} ${selectedUser.lastName}`}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{selectedUser.username}</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </Button>
              {selectedUser.isVerified ? (
                <Button 
                  variant="destructive" 
                  onClick={() => submitVerification(false)}
                  disabled={verifyUserMutation.isPending}
                  className="gap-1"
                >
                  <AlertTriangle className="h-4 w-4" /> 
                  {verifyUserMutation.isPending ? "Revoking..." : "Revoke Verification"}
                </Button>
              ) : (
                <Button 
                  onClick={() => submitVerification(true)}
                  disabled={verifyUserMutation.isPending}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-4 w-4" /> 
                  {verifyUserMutation.isPending ? "Verifying..." : "Verify User"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* User Status Dialog */}
      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        {selectedUser && (
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {selectedUser.isActive 
                  ? "Deactivate User Account" 
                  : "Activate User Account"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser.isActive 
                  ? "Are you sure you want to deactivate this user account? The user will not be able to log in." 
                  : "Are you sure you want to activate this user account?"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center space-x-4 py-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {`${selectedUser.firstName} ${selectedUser.lastName}`}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{selectedUser.username}</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>
                Cancel
              </Button>
              {selectedUser.isActive ? (
                <Button 
                  variant="destructive" 
                  onClick={() => submitStatusUpdate(false)}
                  disabled={updateUserStatusMutation.isPending}
                  className="gap-1"
                >
                  <UserX className="h-4 w-4" /> 
                  {updateUserStatusMutation.isPending ? "Deactivating..." : "Deactivate Account"}
                </Button>
              ) : (
                <Button 
                  onClick={() => submitStatusUpdate(true)}
                  disabled={updateUserStatusMutation.isPending}
                  className="gap-1"
                >
                  <UserCheck className="h-4 w-4" /> 
                  {updateUserStatusMutation.isPending ? "Activating..." : "Activate Account"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* User Transactions Dialog */}
      <Dialog open={!!selectedUser && showTransactions} onOpenChange={(open) => !open && setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{`${selectedUser.firstName} ${selectedUser.lastName}'s Transactions`}</DialogTitle>
              <DialogDescription>
                Transaction history for this user
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <DataTable
                columns={transactionTableColumns}
                data={userTransactions || []}
                loading={transactionsLoading}
              />
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => handleViewUser(selectedUser)}>
                View User Details
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Users;

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { User } from '@shared/schema';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getAllUsers } from '@/services/adminService';
import { getUserTransactions } from '@/services/userService';
import {
  Search,
  UserCog,
  Mail,
  Eye,
  UserX,
  Filter
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
} from '@/components/ui/dialog';

const Users: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getAllUsers
  });

  // Fetch selected user's transactions
  const { data: userTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/users/${selectedUser?.id}/transactions`],
    queryFn: () => getUserTransactions(selectedUser!.id),
    enabled: !!selectedUser && showTransactions,
  });

  // Filter users based on search
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Actions to perform on users
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowTransactions(false);
  };

  const handleViewTransactions = (user: User) => {
    setSelectedUser(user);
    setShowTransactions(true);
  };

  const handleBanUser = (user: User) => {
    // This would normally make an API call to ban the user
    toast({
      title: "Feature not implemented",
      description: "User banning is not implemented in this demo.",
      variant: "destructive"
    });
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
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts and view their information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <DataTable
            columns={userTableColumns}
            data={filteredUsers}
            loading={isLoading}
            actions={(user) => (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewUser(user)}
                >
                  <Eye className="mr-1 h-4 w-4" /> Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewTransactions(user)}
                >
                  <UserCog className="mr-1 h-4 w-4" /> Transactions
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                  onClick={() => handleBanUser(user)}
                >
                  <UserX className="mr-1 h-4 w-4" /> Ban
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
              </div>

              <div className="flex space-x-2 justify-end mt-4">
                <Button variant="outline" onClick={() => handleViewTransactions(selectedUser)}>
                  View Transactions
                </Button>
                <Button variant="destructive" onClick={() => handleBanUser(selectedUser)}>
                  Ban User
                </Button>
              </div>
            </div>
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

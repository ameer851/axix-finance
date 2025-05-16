import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, UserCheck, UserX, LogOut, Eye, Trash2, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserWithBalance } from '../types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface UserListProps {
  users: UserWithBalance[];
  isLoading: boolean;
  pagination: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  onPaginationChange: (newPagination: { pageIndex: number; pageSize: number }) => void;
  onViewUser: (userId: number) => void;
  onDeactivateUser: (userId: number) => void;
  onReactivateUser: (userId: number) => void;
  onDeleteUser: (userId: number) => void;
  onForceLogout: (userId: number) => void;
  currentUserRole: string;
}

/**
 * UserList component for displaying paginated user data with actions
 */
const UserList: React.FC<UserListProps> = ({
  users,
  isLoading,
  pagination,
  onPaginationChange,
  onViewUser,
  onDeactivateUser,
  onReactivateUser,
  onDeleteUser,
  onForceLogout,
  currentUserRole
}) => {
  // Check if current user is a super admin
  const isSuperAdmin = currentUserRole === 'super_admin';

  // Table column definitions
  const columns: ColumnDef<UserWithBalance>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'email',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {row.original.firstName?.[0] || ''}
              {row.original.lastName?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </span>
            <span className="text-xs text-gray-500">{row.getValue('email')}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'admin' ? 'default' : 'outline'}>
          {row.getValue('role')}
        </Badge>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive');
        return (
          <Badge variant={isActive ? 'success' : 'destructive'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {formatCurrency(row.original.balance.available, 'USD')}
          </span>
          {row.original.balance.pending > 0 && (
            <span className="text-xs text-yellow-600">
              {formatCurrency(row.original.balance.pending, 'USD')} pending
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => (
        row.original.lastLoginAt 
          ? formatDate(row.original.lastLoginAt) 
          : <span className="text-gray-400">Never</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewUser(Number(user.id))}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.isActive ? (
                <DropdownMenuItem onClick={() => onDeactivateUser(Number(user.id))}>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onReactivateUser(Number(user.id))}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onForceLogout(Number(user.id))}>
                <LogOut className="mr-2 h-4 w-4" />
                Force Logout
              </DropdownMenuItem>
              
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteUser(Number(user.id))}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      pagination={{
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        pageCount: pagination.pageCount,
      }}
      onPaginationChange={onPaginationChange}
      manualPagination
      noResultsMessage="No users found"
    />
  );
};

export default UserList;

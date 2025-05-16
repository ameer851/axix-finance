import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { getAdminLogs, exportAdminLogs } from '@/services/adminService';
import { AdminLogEntry, AuditLogFilters } from './types';
import { formatDate } from '@/lib/utils';
import { Search, Download, FileText, Filter, ChevronDown, AlertTriangle, User, UserCog, Shield, X } from 'lucide-react';

/**
 * AdminLogs component for the admin panel
 * Displays a comprehensive log of all admin actions with filtering options
 */
const AdminLogs: React.FC = () => {
  const { toast } = useToast();
  
  // State for log filters
  const [filters, setFilters] = useState<AuditLogFilters>({
    adminId: undefined,
    action: undefined,
    targetType: undefined,
    startDate: undefined,
    endDate: undefined,
    page: 1,
    limit: 25
  });
  
  // State for active category
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Fetch admin logs
  const { 
    data: logsData, 
    isLoading: isLogsLoading,
    isError: isLogsError,
    error: logsError,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['admin-logs', filters],
    queryFn: () => getAdminLogs(filters),
    staleTime: 60000 // 1 minute
  });
  
  // Export logs mutation
  const exportMutation = useMutation({
    mutationFn: exportAdminLogs,
    onSuccess: (url) => {
      // Create a temporary anchor element to download the file
      const a = document.createElement('a');
      a.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the object URL
      URL.revokeObjectURL(a.href);
      
      toast({
        title: 'Export successful',
        description: 'Logs have been exported to CSV successfully.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export Failed',
        description: `Failed to export logs: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // Handle exporting logs
  const handleExportLogs = () => {
    exportMutation.mutate({
      adminId: filters.adminId,
      action: filters.action,
      targetType: filters.targetType,
      startDate: filters.startDate,
      endDate: filters.endDate
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };
  
  // Handle pagination changes
  const handlePaginationChange = (newPagination: { pageIndex: number; pageSize: number }) => {
    setFilters((prev) => ({
      ...prev,
      page: newPagination.pageIndex + 1,
      limit: newPagination.pageSize
    }));
  };
  
  // Handle category tab change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    
    // Update filters based on category
    if (category === 'all') {
      handleFilterChange({ targetType: undefined });
    } else {
      handleFilterChange({ targetType: category });
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      adminId: undefined,
      action: undefined,
      targetType: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1,
      limit: 25
    });
    setActiveCategory('all');
  };
  
  // Function to get appropriate icon for log entry
  const getActionIcon = (action: string) => {
    if (action.includes('delete')) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (action.includes('login') || action.includes('logout')) return <User className="h-4 w-4 text-blue-500" />;
    if (action.includes('maintenance')) return <Shield className="h-4 w-4 text-amber-500" />;
    if (action.includes('approved') || action.includes('rejected')) return <FileText className="h-4 w-4 text-green-500" />;
    return <UserCog className="h-4 w-4 text-gray-500" />;
  };
  
  // Columns definition for the logs table
  const columns: ColumnDef<AdminLogEntry>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }) => (
        <div className="text-xs">
          <div>{new Date(row.original.timestamp).toLocaleDateString()}</div>
          <div className="text-gray-500">{new Date(row.original.timestamp).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      accessorKey: 'adminName',
      header: 'Admin',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {row.original.adminName?.substring(0, 2) || 'AD'}
            </span>
          </div>
          <span>{row.original.adminName || `Admin #${row.original.adminId}`}</span>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {getActionIcon(row.original.action)}
          <span className="capitalize">
            {row.original.action.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'targetType',
      header: 'Target Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.targetType}
        </Badge>
      ),
    },
    {
      accessorKey: 'targetId',
      header: 'Target ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.targetId ? `#${row.original.targetId}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => (
        <div className="text-sm max-w-xs truncate" title={row.original.details}>
          {row.original.details || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.ipAddress || '—'}
        </span>
      ),
    }
  ];
  
  // Filter logs based on active category
  const filteredLogs = logsData?.logs || [];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Logs</h1>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Track all administrator actions in the system
              </CardDescription>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 sm:mt-0"
              onClick={handleExportLogs}
              disabled={exportMutation.isPending || isLogsLoading || isLogsError}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Category tabs */}
          <Tabs 
            value={activeCategory} 
            onValueChange={handleCategoryChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 sm:w-[600px]">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="user">Users</TabsTrigger>
              <TabsTrigger value="transaction">Transactions</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search admin logs..."
                  className="pl-9"
                  value={filters.adminId || ''}
                  onChange={(e) => handleFilterChange({ adminId: e.target.value || undefined })}
                />
              </div>
              
              <Select
                value={filters.action || ''}
                onValueChange={(action) => handleFilterChange({ action: action || undefined })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="user_updated">User Updated</SelectItem>
                  <SelectItem value="user_deleted">User Deleted</SelectItem>
                  <SelectItem value="transaction_approved">Transaction Approved</SelectItem>
                  <SelectItem value="transaction_rejected">Transaction Rejected</SelectItem>
                  <SelectItem value="maintenance_mode_activated">Maintenance Activated</SelectItem>
                  <SelectItem value="maintenance_mode_deactivated">Maintenance Deactivated</SelectItem>
                  <SelectItem value="admin_login">Admin Login</SelectItem>
                  <SelectItem value="admin_logout">Admin Logout</SelectItem>
                </SelectContent>
              </Select>
              
              <DateRangePicker
                onChange={(range) => {
                  if (range && Array.isArray(range) && range.length >= 2) {
                    handleFilterChange({
                      startDate: range[0] instanceof Date ? range[0].toISOString() : undefined,
                      endDate: range[1] instanceof Date ? range[1].toISOString() : undefined
                    });
                  } else {
                    handleFilterChange({
                      startDate: undefined,
                      endDate: undefined
                    });
                  }
                }}
                placeholder="Date range"
              />
              
              <Button variant="ghost" onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
            
            {/* Applied filters summary */}
            {(filters.adminId || filters.action || filters.startDate) && (
              <div className="flex flex-wrap gap-2 text-sm bg-muted/50 p-2 rounded-md">
                <div className="font-medium">Filters:</div>
                {filters.adminId && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Admin: {filters.adminId}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleFilterChange({ adminId: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.action && (
                  <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                    Action: {filters.action.replace(/_/g, ' ')}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleFilterChange({ action: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.startDate && filters.endDate && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Date: {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleFilterChange({ startDate: undefined, endDate: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Loading state */}
          {isLogsLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              ))}
            </div>
          )}
          
          {/* Error state */}
          {isLogsError && (
            <div className="bg-red-50 p-4 rounded-md text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading logs: {logsError?.message || 'Unknown error'}</span>
            </div>
          )}
          
          {/* Empty state */}
          {!isLogsLoading && !isLogsError && filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No administrator activity logs match your current filters.
              </p>
            </div>
          )}
          
          {/* Logs data table */}
          {!isLogsLoading && !isLogsError && filteredLogs.length > 0 && (
            <DataTable
              columns={columns}
              data={filteredLogs}
              pageIndex={(filters.page || 1) - 1}
              pageSize={filters.limit || 25}
              pageCount={Math.ceil((logsData?.total || 0) / (filters.limit || 25))}
              onPaginationChange={handlePaginationChange}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-6">
          <div className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {logsData?.total || 0} log entries
          </div>
          
          <Select
            value={String(filters.limit)}
            onValueChange={(value) => handleFilterChange({ limit: Number(value) })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows per page</SelectItem>
              <SelectItem value="25">25 rows per page</SelectItem>
              <SelectItem value="50">50 rows per page</SelectItem>
              <SelectItem value="100">100 rows per page</SelectItem>
            </SelectContent>
          </Select>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogs;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, Notification } from '@/hooks/useNotifications';
import { getNotificationIcon, getNotificationColor, NotificationType, NotificationPriority } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Check, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  Shield, 
  DollarSign, 
  User, 
  Tag, 
  Info,
  Search,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const typeIcons: Record<string, JSX.Element> = {
  transaction: <DollarSign className="h-4 w-4" />,
  account: <User className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  marketing: <Tag className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
  verification: <Check className="h-4 w-4" />
};

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-green-100 text-green-800',
  high: 'bg-red-100 text-red-800'
};

// Define a placeholder for userId
const userId = 1; // Replace with actual userId from context or props

const NotificationsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filters, setFilters] = useState<{
    read?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
    query?: string;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 10,
  });
  
  // Update filters when tab changes
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === 'unread') {
      setFilters(prev => ({ ...prev, read: false, page: 1 }));
    } else if (value === 'read') {
      setFilters(prev => ({ ...prev, read: true, page: 1 }));
    } else {
      // "all" tab - remove read filter
      const { read, ...restFilters } = filters;
      setFilters({ ...restFilters, page: 1 });
    }
    setCurrentPage(1);
    setSelectedIds([]);
  };
  
  // Get notifications with pagination
  const { 
    notifications, 
    isConnected, 
    sendMessage, 
    connectionAttempts 
  } = useNotifications(userId); // Pass the required userId argument
  
  // Mutations for marking notifications as read
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  
  // Mutation for deleting notifications
  const { mutate: deleteNotification, isPending: isDeleting } = useDeleteNotification();
  
  const handleSelectNotification = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked && notifications) {
      setSelectedIds(notifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleMarkSelectedAsRead = () => {
    selectedIds.forEach(id => {
      markAsRead(id);
    });
    toast({
      title: "Notifications updated",
      description: `Marked ${selectedIds.length} notification(s) as read.`
    });
    setSelectedIds([]);
  };
  
  const handleMarkAllAsReadClick = () => {
    markAllAsRead();
    toast({
      title: "All notifications marked as read",
      description: "Successfully updated your notifications."
    });
  };
  
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    let completedCount = 0;
    let errorCount = 0;
    
    selectedIds.forEach(id => {
      deleteNotification(id, {
        onSuccess: () => {
          completedCount++;
          checkCompletion();
        },
        onError: () => {
          errorCount++;
          checkCompletion();
        }
      });
    });
    
    const checkCompletion = () => {
      if (completedCount + errorCount === selectedIds.length) {
        toast({
          title: "Notifications deleted",
          description: `Successfully deleted ${completedCount} notification(s).${errorCount > 0 ? ` Failed to delete ${errorCount} notification(s).` : ''}`
        });
        setSelectedIds([]);
        setIsDeleteDialogOpen(false);
      }
    };
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(notifications.length / filters.limit)) return;
    setCurrentPage(newPage);
    setFilters(prev => ({ ...prev, page: newPage }));
    setSelectedIds([]);
  };
  
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setCurrentPage(1);
    setSelectedIds([]);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearch = () => {
    handleFilterChange('query', searchQuery || undefined);
  };
  
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleClearFilters = () => {
    setFilters({ page: 1, limit: 10 });
    setSelectedTab('all');
    setCurrentPage(1);
    setSelectedIds([]);
    setSearchQuery('');
  };

  // Fix `getNotificationTitle` type mismatch
  const getNotificationTitle = (notification: Notification) => {
    switch (notification.type) {
      case 'transaction':
        return 'Transaction Notification';
      case 'account':
        return 'Account Notification';
      case 'security':
        return 'Security Notification';
      case 'marketing':
        return 'Marketing Notification';
      case 'system':
        return 'System Notification';
      case 'verification':
        return 'Verification Notification';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">View and manage your notifications</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="flex flex-col space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notification Center</CardTitle>
                <CardDescription>You have {notifications.length} notifications</CardDescription>
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <div className="p-2">
                      <p className="text-sm font-medium mb-2">Type</p>
                      <Select 
                        value={filters.type} 
                        onValueChange={(value) => handleFilterChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          <SelectItem value="transaction">Transaction</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="verification">Verification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    <div className="p-2">
                      <p className="text-sm font-medium mb-2">Priority</p>
                      <Select 
                        value={filters.priority} 
                        onValueChange={(value) => handleFilterChange('priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleClearFilters}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="default" size="sm" onClick={() => {}}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <Tabs value={selectedTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="read">Read</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Search notifications..." 
                  value={searchQuery} 
                  onChange={handleSearchChange} 
                  onKeyPress={handleSearchKeyPress}
                  className="w-64"
                />
                <Button variant="outline" size="sm" onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                {selectedIds.length > 0 ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleMarkSelectedAsRead} 
                    disabled={selectedIds.length === 0}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark selected as read
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleMarkAllAsReadClick}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark all as read
                  </Button>
                )}
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={selectedIds.length === 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete notifications?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.length} notification(s)? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {selectedTab === 'unread' 
                    ? "You've read all your notifications. Great job!" 
                    : selectedTab === 'read' 
                    ? "You don't have any read notifications yet."
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center py-2 px-4 text-sm font-medium text-muted-foreground bg-gray-50 rounded-md">
                  <div className="w-8">
                    <Checkbox 
                      id="selectAll" 
                      checked={selectedIds.length > 0 && selectedIds.length === notifications.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div className="w-12"></div>
                  <div className="flex-1">Notification</div>
                  <div className="w-28 text-right">Time</div>
                </div>
                
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={cn(
                      "flex items-start py-3 px-4 rounded-md hover:bg-gray-50 transition-colors",
                      selectedIds.includes(notification.id) && "bg-gray-50",
                      !notification.isRead && "bg-blue-50/30 hover:bg-blue-50/50"
                    )}>
                      <div className="w-8 pt-1">
                        <Checkbox 
                          id={`select-${notification.id}`}
                          checked={selectedIds.includes(notification.id)} 
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="w-12 pt-1">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          priorityColors[notification.priority]
                        )}>
                          {typeIcons[notification.type] || <Bell className="h-4 w-4" />}
                        </div>
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => {
                        if (!notification.isRead) markAsRead(notification.id);
                        if (notification.relatedEntityType && notification.relatedEntityId) {
                          navigate(`/dashboard/${notification.relatedEntityType}/${notification.relatedEntityId}`);
                        }
                      }}>
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "text-sm font-medium",
                            notification.isRead ? "text-muted-foreground" : "text-black"
                          )}>
                            {getNotificationTitle(notification)}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={priorityColors[notification.priority]}
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.isRead && (
                            <Badge className="ml-auto bg-blue-500">new</Badge>
                          )}
                        </div>
                        <p className={cn(
                          "text-sm mt-1",
                          notification.isRead ? "text-muted-foreground" : "text-gray-700"
                        )}>
                          {notification.message}
                        </p>
                      </div>
                      <div className="w-28 text-xs text-muted-foreground text-right pt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {Math.ceil(notifications.length / filters.limit) > 1 && (
                  <div className="flex items-center justify-between pt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * filters.limit + 1} to {
                        Math.min(currentPage * filters.limit, notifications.length)
                      } of {notifications.length} notifications
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                        {Array.from({ length: Math.ceil(notifications.length / filters.limit) }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === Math.ceil(notifications.length / filters.limit) || 
                          Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => {
                          // Add ellipsis
                          if (index > 0 && page - array[index - 1] > 1) {
                            return (
                              <Button key={`ellipsis-${page}`} variant="outline" size="sm" disabled>
                                ...
                              </Button>
                            );
                          }
                          
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        })
                      }
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === Math.ceil(notifications.length / filters.limit)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;

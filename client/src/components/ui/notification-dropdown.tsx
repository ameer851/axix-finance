import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, CheckIcon, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkAsRead,
  useMarkAllAsRead,
  mapNotificationWithRead // Import the mapping helper
} from "@/hooks/useNotifications";
import {
  getNotificationTitle,
  getNotificationIcon,
  getNotificationColor
} from "@/services/notificationService";

// Use Notification type from useNotifications to ensure compatibility
import type { Notification } from "@/hooks/useNotifications";

// Refactored NotificationItem to ensure it is a valid JSX component
const NotificationItem: React.FC<{ notification: Notification; onRead: (id: number) => void }> = ({ notification, onRead }) => {
  const [, setLocation] = useLocation();
  const title = getNotificationTitle(notification as Parameters<typeof getNotificationTitle>[0]);
  const icon = getNotificationIcon(notification as any);
  const color = getNotificationColor(notification.priority || 'medium');

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }

    // Navigate based on notification type and related entity
    if (notification.relatedEntityType && notification.relatedEntityId) {
      switch (notification.relatedEntityType) {
        case 'transaction':
          setLocation(`/dashboard/transactions/${notification.relatedEntityId}`);
          break;
        case 'account':
          setLocation('/dashboard/settings/profile');
          break;
        case 'security_event':
          setLocation('/dashboard/settings/security');
          break;
        default:
          // Just mark as read without navigation
          break;
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start space-x-3 p-3 cursor-pointer hover:bg-gray-100/50 rounded-md transition-colors",
        !notification.read ? "bg-blue-50/50" : "opacity-80"
      )}
    >
      <div
        className={cn(
          "rounded-full p-2 flex items-center justify-center",
          `bg-${color}-100 text-${color}-700`
        )}
      >
        {icon}
      </div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center justify-between">
          <p className={cn("text-sm font-medium", notification.read ? "text-gray-600" : "text-gray-900")}>
            {title}
          </p>
          {!notification.read && (
            <Badge 
              variant="default" 
              className="rounded-sm text-[10px] px-1 py-0 bg-blue-500 hover:bg-blue-600"
            >
              NEW
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400">
          {notification.createdAt
            ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
            : 'Unknown time'}
        </p>
      </div>
    </div>
  );
};

interface NotificationDropdownProps {
  userId: number;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const unreadCount = useUnreadNotificationsCount();
  const { notifications, isConnected, sendMessage, connectionAttempts } = useNotifications(userId);
  
  const refetch = () => {
    window.location.reload();
  };
  
  const { mutate: markAsRead, isPending: isMarkingAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();
  
  // Set up auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [refetch]);
  
  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };
  
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    
    markAllAsRead(undefined, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "All notifications marked as read"
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to mark notifications as read",
          variant: "destructive"
        });
      }
    });
  };
  
  const handleViewAll = () => {
    setLocation('/dashboard/notifications');
  };
  
  // Map notifications to ensure `read` property exists
  const mappedNotifications = notifications ? notifications.map(mapNotificationWithRead) : [];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] p-0 flex items-center justify-center rounded-full text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckIcon className="h-3 w-3 mr-1" />
              )}
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {isMarkingAsRead ? (
            <div className="p-2 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : mappedNotifications && mappedNotifications.length > 0 ? (
            <div className="py-1">
              {mappedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
              <Bell className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 mb-1">No notifications</p>
              <p className="text-xs text-gray-400">
                We'll notify you when something important happens
              </p>
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <div className="flex justify-center p-2">
          <Button variant="outline" size="sm" onClick={handleViewAll} className="w-full">
            View all notifications
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationDropdown;
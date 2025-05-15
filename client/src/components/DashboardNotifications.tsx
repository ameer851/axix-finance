import { useState } from 'react';
import { useLocation } from 'wouter';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { getNotificationIcon, getNotificationTitle, getNotificationColor } from '@/services/notificationService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  MailCheck,
  MailX,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardNotificationsProps {
  userId: number;
  className?: string;
  limit?: number;
}

const iconMap: Record<string, React.ReactNode> = {
  'transaction': <Bell className="h-5 w-5" />,
  'account': <MailCheck className="h-5 w-5" />,
  'security': <Clock className="h-5 w-5" />,
  'system': <MailX className="h-5 w-5" />,
  'marketing': <Bell className="h-5 w-5" />,
  'verification': <Check className="h-5 w-5" />,
};

const NotificationItem = ({ notification, onMarkAsRead }: { 
  notification: any; 
  onMarkAsRead: (id: number) => void;
}) => {
  const [, setLocation] = useLocation();
  const icon = getNotificationIcon(notification);
  const title = getNotificationTitle(notification);
  const color = getNotificationColor(notification.priority || 'medium');
  
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    // If there's a related entity, navigate to it
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
        "flex items-start gap-3 rounded-lg p-3 text-left transition-all hover:bg-gray-100 cursor-pointer",
        notification.read ? "opacity-70" : "bg-blue-50/30"
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        notification.read ? "bg-gray-100" : `bg-${color}-100`
      )}>
        {/* Icon based on notification type */}
        {iconMap[notification.type] || <Bell className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {!notification.read && (
            <Badge 
              variant="outline" 
              className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              New
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

const DashboardNotifications = ({ userId, className, limit = 5 }: DashboardNotificationsProps) => {
  const [, setLocation] = useLocation();
  const { notifications, isConnected, sendMessage, connectionAttempts } = useNotifications(userId);
  const unreadCount = useUnreadNotificationsCount();
  const { mutate: markAsRead, isPending: isMarkingAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();

  // Added missing state and handlers for activeTab and handleTabChange
  const [activeTab, setActiveTab] = useState('all');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Added refetch function for error handling
  const refetch = () => {
    window.location.reload();
  };
  
  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
    const handleViewAll = () => {
    setLocation('/dashboard/notifications');
  };
  
  return (
    <Card className={cn("col-span-full md:col-span-2 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
            <CardDescription>Stay updated on account activities</CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              <TabsTrigger value="read" className="text-xs">Read</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-0 pt-4">
        <ScrollArea className="max-h-[350px]">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-1 px-6">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
              <Bell className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-600 mb-1">No notifications to show</p>
              <p className="text-xs text-gray-400">
                {activeTab === 'unread' 
                  ? "You've read all your notifications!" 
                  : activeTab === 'read' 
                  ? "You don't have any read notifications yet"
                  : "You'll see notifications here when there's account activity"}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-center">
        <Button variant="ghost" size="sm" onClick={handleViewAll} className="flex items-center">
          View all notifications
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DashboardNotifications;

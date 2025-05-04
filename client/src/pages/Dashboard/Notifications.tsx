import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Clock,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  UserCheck,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { formatDate, truncateText } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// This would come from the API in a real implementation
interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'system' | 'transaction' | 'security' | 'announcement';
  isRead: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // This would be fetched from an API in a real implementation
  const dummyNotifications: Notification[] = [];
  
  // In a real implementation, we would have an API endpoint to get notifications
  // const { data: notifications, isLoading } = useQuery<Notification[]>({
  //   queryKey: ['/api/notifications'],
  // });
  const notifications = dummyNotifications;
  const isLoading = false;

  // Mark notification as read
  const handleMarkAsRead = (notificationId: number) => {
    // In a real implementation, this would call an API to mark as read
    // Mark notification as read
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    // In a real implementation, this would call an API to mark all as read
    // Mark all notifications as read
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(notification => notification.type === activeTab);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'security':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'announcement':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary-500" />;
    }
  };

  // Count unread notifications
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading notifications...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">Stay updated on your account activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Notifications</CardTitle>
              <CardDescription>
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'No new notifications'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="all">
                All
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-primary-500" variant="default">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="transaction">Transactions</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="announcement">Announcements</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {getFilteredNotifications().length === 0 ? (
                <div className="text-center py-16">
                  <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No notifications</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    You don't have any {activeTab !== 'all' ? activeTab : ''} notifications at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredNotifications().map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex p-4 rounded-lg border ${notification.isRead 
                        ? 'bg-transparent' 
                        : 'bg-gray-50 dark:bg-gray-800 border-l-4 border-l-primary-500'}`}
                    >
                      <div className="flex-shrink-0 mr-4">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className={`text-sm font-medium ${notification.isRead 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-900 dark:text-white'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(new Date(notification.createdAt))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {truncateText(notification.message, 120)}
                        </p>
                        {!notification.isRead && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2 text-primary-600 dark:text-primary-400 p-0 h-auto"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                <div className="font-medium">Transaction Notifications</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">Email</Button>
                <Button size="sm" variant="outline">In-App</Button>
                <Button size="sm" variant="default">SMS</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldAlert className="h-5 w-5 text-gray-500 mr-2" />
                <div className="font-medium">Security Alerts</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="default">Email</Button>
                <Button size="sm" variant="default">In-App</Button>
                <Button size="sm" variant="default">SMS</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
                <div className="font-medium">Announcements</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="default">Email</Button>
                <Button size="sm" variant="outline">In-App</Button>
                <Button size="sm" variant="outline">SMS</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-gray-500 mr-2" />
                <div className="font-medium">Account Updates</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="default">Email</Button>
                <Button size="sm" variant="default">In-App</Button>
                <Button size="sm" variant="outline">SMS</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
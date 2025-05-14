import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Trash2,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    userId: 'user123',
    type: 'price_alert',
    title: 'Price Alert: AAPL',
    message: 'Apple Inc. (AAPL) has reached your target price of $185.00',
    date: '2025-05-12T09:30:00Z',
    isRead: false,
    metadata: {
      symbol: 'AAPL',
      price: '185.92',
      targetPrice: '185.00'
    }
  },
  {
    id: '2',
    userId: 'user123',
    type: 'market_news',
    title: 'Market News: Fed Announcement',
    message: 'Federal Reserve signals potential interest rate cut later this year',
    date: '2025-05-12T08:15:00Z',
    isRead: false,
    metadata: {
      source: 'Financial Times',
      url: 'https://example.com/news/1'
    }
  },
  {
    id: '3',
    userId: 'user123',
    type: 'deposit_complete',
    title: 'Deposit Complete',
    message: 'Your deposit of $1,000.00 has been successfully processed',
    date: '2025-05-10T14:45:00Z',
    isRead: true,
    metadata: {
      amount: '1000.00',
      transactionId: 'DEP-123456'
    }
  },
  {
    id: '4',
    userId: 'user123',
    type: 'trade_executed',
    title: 'Trade Executed: Buy MSFT',
    message: 'Your order to buy 5 shares of Microsoft Corporation (MSFT) has been executed at $412.65 per share',
    date: '2025-05-08T10:30:00Z',
    isRead: true,
    metadata: {
      symbol: 'MSFT',
      action: 'buy',
      shares: 5,
      price: '412.65',
      total: '2063.25',
      orderId: 'ORD-789012'
    }
  },
  {
    id: '5',
    userId: 'user123',
    type: 'dividend_received',
    title: 'Dividend Received',
    message: 'You have received a dividend payment of $25.50 from your investments',
    date: '2025-05-01T09:15:00Z',
    isRead: true,
    metadata: {
      amount: '25.50',
      source: 'Quarterly dividends'
    }
  }
];

// Mock alert settings
const mockAlertSettings = [
  {
    id: 'price_alerts',
    name: 'Price Alerts',
    description: 'Notifications when securities reach your target price',
    enabled: true
  },
  {
    id: 'market_news',
    name: 'Market News',
    description: 'Important news about the market and your holdings',
    enabled: true
  },
  {
    id: 'deposit_withdrawal',
    name: 'Deposits & Withdrawals',
    description: 'Notifications about account funding activities',
    enabled: true
  },
  {
    id: 'trade_confirmations',
    name: 'Trade Confirmations',
    description: 'Confirmations when your trades are executed',
    enabled: true
  },
  {
    id: 'dividend_payments',
    name: 'Dividend Payments',
    description: 'Notifications about dividend payments',
    enabled: true
  },
  {
    id: 'account_statements',
    name: 'Account Statements',
    description: 'Notifications when new statements are available',
    enabled: false
  },
  {
    id: 'tax_documents',
    name: 'Tax Documents',
    description: 'Notifications when tax documents are ready',
    enabled: true
  }
];

interface NotificationsAlertsProps {
  onViewAll?: () => void;
  onCreateAlert?: () => void;
}

const NotificationsAlerts: React.FC<NotificationsAlertsProps> = ({
  onViewAll,
  onCreateAlert
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('notifications');
  
  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        return mockNotifications;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });
  
  // Fetch alert settings
  const { data: alertSettings = [], isLoading: alertSettingsLoading } = useQuery({
    queryKey: ['alertSettings', user?.id],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        return mockAlertSettings;
      } catch (error) {
        console.error('Error fetching alert settings:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // In a real app, this would be an API call
      // For now, we'll simulate a successful response
      return { success: true, notificationId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notifications', user?.id], (oldData: any) => 
        oldData.map((notification: any) => 
          notification.id === data.notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
    }
  });
  
  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // In a real app, this would be an API call
      // For now, we'll simulate a successful response
      return { success: true, notificationId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notifications', user?.id], (oldData: any) => 
        oldData.filter((notification: any) => notification.id !== data.notificationId)
      );
      toast({
        title: 'Notification Deleted',
        description: 'The notification has been removed.',
      });
    }
  });
  
  // Toggle alert setting mutation
  const toggleAlertSettingMutation = useMutation({
    mutationFn: async ({ settingId, enabled }: { settingId: string, enabled: boolean }) => {
      // In a real app, this would be an API call
      // For now, we'll simulate a successful response
      return { success: true, settingId, enabled };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['alertSettings', user?.id], (oldData: any) => 
        oldData.map((setting: any) => 
          setting.id === data.settingId 
            ? { ...setting, enabled: data.enabled } 
            : setting
        )
      );
      toast({
        title: 'Settings Updated',
        description: `${data.enabled ? 'Enabled' : 'Disabled'} notification setting.`,
      });
    }
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_alert':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'market_news':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'deposit_complete':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'trade_executed':
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case 'dividend_received':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  // Handle delete notification
  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };
  
  // Handle toggle alert setting
  const handleToggleAlertSetting = (settingId: string, enabled: boolean) => {
    toggleAlertSettingMutation.mutate({ settingId, enabled });
  };
  
  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  if (notificationsLoading || alertSettingsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
          <CardDescription>Loading your notifications...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notifications & Alerts</CardTitle>
          <CardDescription>Stay updated on your investments and account</CardDescription>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-primary">{unreadCount} new</Badge>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Alert Settings</TabsTrigger>
          </TabsList>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You don't have any notifications</p>
                <Button variant="outline" onClick={onCreateAlert}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Alerts
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-lg transition-colors ${
                      notification.isRead ? 'bg-background' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.date)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex justify-between items-center pt-2">
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as read
                            </Button>
                          )}
                          {notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 5 && (
                  <div className="flex justify-center mt-4">
                    <Button variant="ghost" onClick={onViewAll}>
                      View All Notifications
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Alert Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {alertSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={setting.id} className="text-base">
                      {setting.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  <Switch
                    id={setting.id}
                    checked={setting.enabled}
                    onCheckedChange={(checked) => handleToggleAlertSetting(setting.id, checked)}
                  />
                </div>
              ))}
              
              <div className="pt-4">
                <Button onClick={onCreateAlert}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Create Custom Alert
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationsAlerts;

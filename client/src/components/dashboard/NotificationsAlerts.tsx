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
import { 
  getNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  getAlertSettings,
  updateAlertSetting,
  AlertSetting
} from '@/services/notificationService';

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
  const { data: notificationsData = { notifications: [], total: 0, unreadCount: 0 }, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) throw new Error("User ID is required");
        
        // Fetch real notifications data from the API
        const response = await getNotifications({
          userId: Number(user.id),
          limit: 5,
          page: 1
        });
        
        return response;
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
        if (!user?.id) throw new Error("User ID is required");
        
        // Fetch real alert settings from the API
        return await getAlertSettings(Number(user.id));
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
      return await markNotificationAsRead(Number(notificationId));
    },
    onSuccess: () => {
      // Refresh notifications after marking one as read
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        title: 'Notification updated',
        description: 'Notification marked as read.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notification. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await deleteNotification(Number(notificationId));
    },
    onSuccess: () => {
      // Refresh notifications after deleting one
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        title: 'Notification Deleted',
        description: 'The notification has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Toggle alert setting mutation
  const toggleAlertSettingMutation = useMutation({
    mutationFn: async ({ settingId, enabled }: { settingId: string, enabled: boolean }) => {
      if (!user?.id) throw new Error("User ID is required");
      return await updateAlertSetting(Number(user.id), settingId, enabled);
    },
    onSuccess: () => {
      // Refresh alert settings after toggling one
      queryClient.invalidateQueries({ queryKey: ['alertSettings', user?.id] });
      toast({
        title: 'Setting Updated',
        description: 'Your notification preference has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update setting. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Function to handle when a user reads a notification
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  // Function to handle when a user deletes a notification
  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };
  
  // Function to toggle an alert setting
  const handleToggleAlertSetting = (settingId: string, currentValue: boolean) => {
    toggleAlertSettingMutation.mutate({
      settingId,
      enabled: !currentValue
    });
  };
  
  // Function to get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_alert':
        return <AlertCircle className="h-5 w-5 text-primary" />;
      case 'market_news':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'deposit_complete':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'trade_executed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'dividend_received':
        return <TrendingDown className="h-5 w-5 text-purple-500" />;
      case 'account':
        return <Bell className="h-5 w-5 text-orange-500" />;
      case 'security':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'marketing':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />;
      case 'verification':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'account_statements':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'tax_documents':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };
  
  // Show loading state
  if (notificationsLoading || alertSettingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2 mx-auto animate-pulse" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle>Notifications & Alerts</CardTitle>
          {notificationsData.unreadCount > 0 ? (
            <Badge variant="destructive" className="rounded-full">
              {notificationsData.unreadCount} New
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          Stay informed about your account and investments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Alert Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="space-y-4">
            {notificationsData.notifications.length > 0 ? (
              <>
                <div className="space-y-4">
                  {notificationsData.notifications.map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg border transition-colors ${notification.isRead ? 'bg-background' : 'bg-muted border-primary/20'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${!notification.isRead ? 'text-primary' : ''}`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {!notification.isRead && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleMarkAsRead(notification.id.toString())}
                                disabled={markAsReadMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteNotification(notification.id.toString())}
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onViewAll}
                    className="w-full sm:w-auto"
                  >
                    View all notifications
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No notifications at this time</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              {alertSettings.map((setting: AlertSetting) => (
                <div key={setting.id} className="flex items-center justify-between space-x-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`setting-${setting.id}`} className="text-base font-medium">
                      {setting.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch 
                    id={`setting-${setting.id}`} 
                    checked={setting.enabled} 
                    onCheckedChange={() => handleToggleAlertSetting(setting.id, setting.enabled)}
                    disabled={toggleAlertSettingMutation.isPending}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCreateAlert}
                className="w-full sm:w-auto"
              >
                Configure custom alerts
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationsAlerts;

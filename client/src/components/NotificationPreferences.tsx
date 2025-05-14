import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotifications';
import type { NotificationType } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Bell, Mail, MessageSquare, Shield, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface NotificationTypePreference {
  id: NotificationType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const channels: NotificationChannel[] = [
  {
    id: 'emailNotifications',
    name: 'Email',
    description: 'Receive updates via email',
    icon: <Mail className="h-5 w-5 text-gray-500" />,
  },
  {
    id: 'pushNotifications',
    name: 'Push Notifications',
    description: 'Receive in-app notifications',
    icon: <Bell className="h-5 w-5 text-gray-500" />,
  },
  {
    id: 'smsNotifications',
    name: 'SMS',
    description: 'Receive text messages',
    icon: <MessageSquare className="h-5 w-5 text-gray-500" />,
  },
];

const notificationTypes: NotificationTypePreference[] = [
  {
    id: 'transaction',
    name: 'Transactions',
    description: 'Deposits, withdrawals and other financial activities',
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">💰</span>,
  },
  {
    id: 'account',
    name: 'Account',
    description: 'Account updates and changes',
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">👤</span>,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security alerts and warnings',
    icon: <Shield className="h-5 w-5 text-red-500" />,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Promotions and special offers',
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">🎁</span>,
  },
  {
    id: 'system',
    name: 'System',
    description: 'System updates and announcements',
    icon: <Bell className="h-5 w-5 text-gray-500" />,
  },
  {
    id: 'verification',
    name: 'Verification',
    description: 'Account verification updates',
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">✅</span>,
  },
];

const NotificationPreferences = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('channels');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [preferences, setPreferences] = useState<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    notificationTypes: Record<NotificationType, boolean>;
  }>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    notificationTypes: {
      transaction: true,
      account: true,
      security: true,
      marketing: false,
      system: true,
      verification: true,
    },
  });
  
  // Load preferences using our hook
  const { 
    data: preferencesData, 
    isLoading: isLoadingPreferences,
    isError: isLoadError,
    error: loadError,
    refetch 
  } = useNotificationPreferences();
  
  // Update preferences mutation
  const { 
    mutateAsync: updatePreferences, 
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError
  } = useUpdateNotificationPreferences();
  
  // Update local state when preferences are loaded
  useEffect(() => {
    if (preferencesData) {
      setPreferences(preferencesData);
      // Reset changes flag when new data is loaded
      setHasChanges(false);
      setSaveSuccess(false);
    }
  }, [preferencesData]);

  const handleChannelChange = (channelId: string, checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [channelId]: checked,
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleTypeChange = (typeId: NotificationType, checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [typeId]: checked,
      },
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };
  
  const handleSavePreferences = async () => {
    try {
      await updatePreferences(preferences);
      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
      });
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive',
      });
    }
  };
  
  const handleResetToDefaults = () => {
    setPreferences({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      notificationTypes: {
        transaction: true,
        account: true,
        security: true,
        marketing: false,
        system: true,
        verification: true,
      },
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  // Loading skeleton UI  
  if (isLoadingPreferences) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (isLoadError) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
          <p className="text-gray-500">Customize how you receive notifications</p>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load your notification preferences. Please try again.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-gray-500">Customize how you receive notifications</p>
      </div>

      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Your notification preferences have been saved successfully.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="types">Notification Types</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Notification Delivery</CardTitle>
              <CardDescription>Choose how you'd like to receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {channel.icon}
                      <div>
                        <Label htmlFor={`channel-${channel.id}`} className="font-medium">
                          {channel.name}
                        </Label>
                        <p className="text-sm text-gray-500">{channel.description}</p>
                      </div>
                    </div>
                    <Switch
                      id={`channel-${channel.id}`}
                      checked={preferences[channel.id as keyof typeof preferences] as boolean}
                      onCheckedChange={(checked) => handleChannelChange(channel.id, checked)}
                      disabled={isUpdating}
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="marketing-emails" className="font-medium">
                        Marketing Emails
                      </Label>
                      <p className="text-sm text-gray-500">Receive promotional content and offers</p>
                    </div>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => handleChannelChange('marketingEmails', checked)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>Select which types of notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {notificationTypes.map((type) => (
                  <div
                    key={type.id}
                    className={cn(
                      "flex items-start space-x-4 p-4 rounded-lg border transition-colors",
                      preferences.notificationTypes[type.id] ? "border-primary-200 bg-primary-50/50" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="mt-1">{type.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`type-${type.id}`} className="font-medium">
                          {type.name}
                        </Label>
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={preferences.notificationTypes[type.id]}
                          onCheckedChange={(checked) => handleTypeChange(type.id, !!checked)}
                          disabled={isUpdating}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleResetToDefaults}
          disabled={isUpdating}
        >
          Reset to Defaults
        </Button>
        
        <Button 
          onClick={handleSavePreferences} 
          disabled={!hasChanges || isUpdating}
          className={cn(!hasChanges && "opacity-50")}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;

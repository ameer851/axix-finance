import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getSystemSettings, setMaintenanceMode } from '@/services/adminService';
import { AlertTriangle, Info, Settings, Clock } from 'lucide-react';

/**
 * MaintenanceMode component for the admin panel
 * Allows administrators to enable/disable system maintenance mode
 * and customize the maintenance message shown to users
 */
const MaintenanceMode: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for the maintenance message
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [maintenanceAction, setMaintenanceAction] = useState<'enable' | 'disable'>('enable');
  
  // Fetch current system settings
  const { 
    data: systemSettings, 
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
    staleTime: 30000, // 30 seconds
    onSuccess: (data) => {
      // If we haven't set a message, set it from the settings
      if (!maintenanceMessage && data.maintenanceMode && data.lastUpdated) {
        setMaintenanceMessage(data.maintenanceMode ? 
          (data.maintenanceMode) :
          'System is under maintenance. Please try again later.'
        );
      }
    }
  });
  
  // Mutation for setting maintenance mode
  const maintenanceMutation = useMutation({
    mutationFn: ({ isActive, message }: { isActive: boolean, message: string }) => 
      setMaintenanceMode(isActive, message),
    onSuccess: () => {
      // Close dialog and refetch settings
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      
      toast({
        title: `Maintenance Mode ${maintenanceAction === 'enable' ? 'Enabled' : 'Disabled'}`,
        description: maintenanceAction === 'enable' 
          ? 'System is now in maintenance mode. Users will be notified.'
          : 'Maintenance mode has been disabled. Normal system operation resumed.',
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to ${maintenanceAction} maintenance mode: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // Handle toggling maintenance mode
  const handleMaintenanceToggle = (isActive: boolean) => {
    setMaintenanceAction(isActive ? 'enable' : 'disable');
    
    // If enabling maintenance, show dialog for confirmation and message
    if (isActive) {
      // Pre-fill with current message if available
      setMaintenanceMessage(maintenanceMessage || 'System is under maintenance. Please try again later.');
      setShowConfirmDialog(true);
    } else {
      // If disabling, show a simple confirmation
      setShowConfirmDialog(true);
    }
  };
  
  // Handle confirming maintenance mode change
  const handleConfirmMaintenance = () => {
    const isActive = maintenanceAction === 'enable';
    maintenanceMutation.mutate({
      isActive,
      message: isActive ? maintenanceMessage : ''
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Maintenance</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Enable or disable system maintenance mode
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Loading state */}
          {isSettingsLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-6 w-[50px]" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          
          {/* Error state */}
          {isSettingsError && (
            <div className="bg-red-50 p-4 rounded-md text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading system settings: {settingsError?.message || 'Unknown error'}</span>
            </div>
          )}
          
          {/* Settings content */}
          {!isSettingsLoading && !isSettingsError && systemSettings && (
            <>
              <div className="flex flex-col space-y-8">
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div className="space-y-0.5">
                    <Label 
                      htmlFor="maintenance-toggle" 
                      className="text-base font-medium"
                    >
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-gray-500">
                      When enabled, users will see a maintenance message and most system functions will be disabled.
                    </p>
                  </div>
                  <Switch
                    id="maintenance-toggle"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>
                
                {systemSettings.maintenanceMode && (
                  <div className="rounded-md border p-4 bg-amber-50 text-amber-800">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium">System is currently in maintenance mode</h3>
                        <p className="text-sm mt-1">
                          Current maintenance message:
                        </p>
                        <p className="text-sm italic mt-1 pl-2 border-l-2 border-amber-300">
                          "{systemSettings.maintenanceMode}"
                        </p>
                        <div className="text-xs mt-2 text-amber-600">
                          <p>Enabled by: {systemSettings.updatedBy || 'Administrator'}</p>
                          <p>Last updated: {systemSettings.lastUpdated ? new Date(systemSettings.lastUpdated).toLocaleString() : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">System Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg border bg-gray-50">
                      <p className="text-xs text-gray-500">Registration</p>
                      <p className={`text-sm font-medium ${systemSettings.registrationEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {systemSettings.registrationEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-gray-50">
                      <p className="text-xs text-gray-500">Withdrawals</p>
                      <p className={`text-sm font-medium ${systemSettings.withdrawalsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {systemSettings.withdrawalsEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-gray-50">
                      <p className="text-xs text-gray-500">Deposits</p>
                      <p className={`text-sm font-medium ${systemSettings.depositsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {systemSettings.depositsEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-gray-50">
                      <p className="text-xs text-gray-500">System Mode</p>
                      <p className={`text-sm font-medium ${systemSettings.maintenanceMode ? 'text-amber-600' : 'text-green-600'}`}>
                        {systemSettings.maintenanceMode ? 'Maintenance' : 'Operational'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last checked: {new Date().toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchSettings()}
            disabled={isSettingsLoading}
          >
            <Settings className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </CardFooter>
      </Card>
      
      {/* Maintenance Mode Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {maintenanceAction === 'enable' ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
            </DialogTitle>
            <DialogDescription>
              {maintenanceAction === 'enable'
                ? 'When maintenance mode is enabled, users will not be able to perform most actions on the platform.'
                : 'Disabling maintenance mode will restore full functionality to all users.'}
            </DialogDescription>
          </DialogHeader>
          
          {maintenanceAction === 'enable' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                <Textarea
                  id="maintenance-message"
                  placeholder="Enter message to display to users..."
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                <p className="font-medium">Important:</p>
                <p>
                  Enabling maintenance mode will prevent users from performing most actions, including:
                </p>
                <ul className="list-disc list-inside mt-1">
                  <li>Deposits and withdrawals</li>
                  <li>Account registration</li>
                  <li>Trading and investments</li>
                  <li>User profile updates</li>
                </ul>
                <p className="mt-2">Administrators will still have full access.</p>
              </div>
            </div>
          )}
          
          {maintenanceAction === 'disable' && (
            <div className="py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800 text-sm">
                <Info className="h-4 w-4 inline-block mr-1" />
                <span>
                  Are you sure you want to disable maintenance mode? This will restore full functionality to all users.
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant={maintenanceAction === 'enable' ? 'default' : 'success'}
              onClick={handleConfirmMaintenance}
              disabled={maintenanceAction === 'enable' && !maintenanceMessage.trim()}
            >
              {maintenanceAction === 'enable' ? 'Enable' : 'Disable'} Maintenance Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceMode;

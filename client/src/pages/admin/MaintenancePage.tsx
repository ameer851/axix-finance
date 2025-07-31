import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { toast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Settings, AlertTriangle, Clock, Users, Server, Database, Shield, Save } from 'lucide-react';

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: 'The system is currently under maintenance. Please try again later.',
    scheduledStart: '',
    scheduledEnd: '',
    allowAdminAccess: true,
    maintenanceType: 'system',
    affectedServices: [] as string[]
  });

  const { data: serverMaintenance, isLoading } = useQuery({
    queryKey: ['admin-maintenance'],
    queryFn: adminService.getMaintenanceSettings
  });

  React.useEffect(() => {
    if (serverMaintenance) {
      setMaintenance(prev => ({
        ...prev,
        ...serverMaintenance,
        affectedServices: serverMaintenance.affectedServices || []
      }));
    }
  }, [serverMaintenance]);

  const updateMutation = useMutation({
    mutationFn: adminService.updateMaintenanceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
      toast({ 
        title: 'Success', 
        description: maintenance.enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update maintenance settings', variant: 'destructive' });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setMaintenance(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (service: string) => {
    setMaintenance(prev => {
      const currentServices = prev.affectedServices || [];
      return {
        ...prev,
        affectedServices: currentServices.includes(service)
          ? currentServices.filter(s => s !== service)
          : [...currentServices, service]
      };
    });
  };

  const handleSave = () => {
    updateMutation.mutate(maintenance);
  };

  const enableMaintenanceNow = () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    setMaintenance(prev => ({
      ...prev,
      enabled: true,
      scheduledStart: now.toISOString().slice(0, 16),
      scheduledEnd: endTime.toISOString().slice(0, 16)
    }));
  };

  const disableMaintenanceNow = () => {
    setMaintenance(prev => ({
      ...prev,
      enabled: false
    }));
  };

  const availableServices = [
    'deposits',
    'withdrawals', 
    'trading',
    'portfolio',
    'messaging',
    'registration'
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Maintenance Management
        </h1>
        <div className="flex gap-2">
          {maintenance.enabled ? (
            <Button 
              onClick={disableMaintenanceNow} 
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Disable Now
            </Button>
          ) : (
            <Button 
              onClick={enableMaintenanceNow} 
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              Enable Now
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Current Status
            </span>
            {maintenance.enabled ? (
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                MAINTENANCE ACTIVE
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">
                <Server className="w-3 h-3 mr-1" />
                SYSTEM OPERATIONAL
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenance.enabled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">🚧 System is currently in maintenance mode</p>
              <p className="text-red-700 text-sm mt-1">
                {maintenance.message}
              </p>
              {maintenance.scheduledEnd && (
                <p className="text-red-600 text-sm mt-2">
                  Scheduled end: {new Date(maintenance.scheduledEnd).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">✅ System is operational</p>
              <p className="text-green-700 text-sm mt-1">
                All services are running normally.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Maintenance Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceEnabled">Enable Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Put the system in maintenance mode</p>
              </div>
              <Switch
                id="maintenanceEnabled"
                checked={maintenance.enabled}
                onCheckedChange={(checked) => handleInputChange('enabled', checked)}
              />
            </div>

            <div>
              <Label htmlFor="maintenanceType">Maintenance Type</Label>
              <Select 
                value={maintenance.maintenanceType} 
                onValueChange={(value) => handleInputChange('maintenanceType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Maintenance</SelectItem>
                  <SelectItem value="database">Database Maintenance</SelectItem>
                  <SelectItem value="security">Security Update</SelectItem>
                  <SelectItem value="feature">Feature Deployment</SelectItem>
                  <SelectItem value="emergency">Emergency Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
              <Textarea
                id="maintenanceMessage"
                value={maintenance.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Enter message to display to users"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scheduledStart">Scheduled Start</Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                value={maintenance.scheduledStart}
                onChange={(e) => handleInputChange('scheduledStart', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="scheduledEnd">Scheduled End</Label>
              <Input
                id="scheduledEnd"
                type="datetime-local"
                value={maintenance.scheduledEnd}
                onChange={(e) => handleInputChange('scheduledEnd', e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowAdminAccess">Allow Admin Access</Label>
                <p className="text-sm text-gray-500">Allow administrators to access during maintenance</p>
              </div>
              <Switch
                id="allowAdminAccess"
                checked={maintenance.allowAdminAccess}
                onCheckedChange={(checked) => handleInputChange('allowAdminAccess', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Affected Services */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Affected Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableServices.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`service-${service}`}
                    checked={maintenance.affectedServices?.includes(service) || false}
                    onChange={() => handleServiceToggle(service)}
                    className="rounded border-gray-300"
                    aria-label={service}
                  />
                  <Label htmlFor={`service-${service}`} className="capitalize">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
            {(maintenance.affectedServices?.length || 0) > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Affected services:</strong> {maintenance.affectedServices?.join(', ') || ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setMaintenance(prev => ({
                  ...prev,
                  maintenanceType: 'system',
                  message: 'Scheduled system maintenance. We\'ll be back shortly.',
                  affectedServices: []
                }));
              }}
            >
              <Server className="w-4 h-4 mr-2" />
              System Maintenance
            </Button>
            <Button
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
              onClick={() => {
                setMaintenance(prev => ({
                  ...prev,
                  maintenanceType: 'database',
                  message: 'Database optimization in progress. Please try again later.',
                  affectedServices: ['deposits', 'withdrawals', 'trading']
                }));
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              Database Update
            </Button>
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => {
                setMaintenance(prev => ({
                  ...prev,
                  maintenanceType: 'emergency',
                  message: 'Emergency maintenance in progress. All services temporarily unavailable.',
                  affectedServices: availableServices
                }));
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button at Bottom */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Maintenance Settings'}
        </Button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { toast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Settings, Save, Globe, Mail, DollarSign, Shield, Clock, Key, Eye, EyeOff } from 'lucide-react';
import EmailTester from '@/components/admin/EmailTester';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    siteName: 'AxixFinance',
    supportEmail: 'support@axixfinance.com',
    maxDepositAmount: 10000,
    minDepositAmount: 100,
    defaultDepositFee: 0.02,
    defaultWithdrawalFee: 0.03,
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    twoFactorRequired: false,
    sessionTimeout: 30
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminService.getSystemSettings
  });

  React.useEffect(() => {
    if (serverSettings) {
      setSettings(prev => ({
        ...prev,
        ...serverSettings,
        // Ensure numeric fields are properly handled
        maxDepositAmount: serverSettings.maxDepositAmount || prev.maxDepositAmount,
        minDepositAmount: serverSettings.minDepositAmount || prev.minDepositAmount,
        defaultDepositFee: serverSettings.defaultDepositFee || prev.defaultDepositFee,
        defaultWithdrawalFee: serverSettings.defaultWithdrawalFee || prev.defaultWithdrawalFee,
        sessionTimeout: serverSettings.sessionTimeout || prev.sessionTimeout
      }));
    }
  }, [serverSettings]);

  const updateMutation = useMutation({
    mutationFn: adminService.updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Success', description: 'Settings updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: () => adminService.updateAdminPassword(
      passwordData.currentPassword,
      passwordData.newPassword,
      passwordData.confirmPassword
    ),
    onSuccess: () => {
      toast({ 
        title: 'Success', 
        description: 'Password updated successfully' 
      });
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update password', 
        variant: 'destructive' 
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordSubmit = () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'All password fields are required',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New password and confirm password do not match',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'New password must be at least 8 characters long',
        variant: 'destructive'
      });
      return;
    }

    passwordMutation.mutate();
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

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
          System Settings
        </h1>
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName || ''}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="Enter site name"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail || ''}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout || 30}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value) || 30)}
                placeholder="30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minDepositAmount">Minimum Deposit Amount ($)</Label>
              <Input
                id="minDepositAmount"
                type="number"
                value={settings.minDepositAmount || 100}
                onChange={(e) => handleInputChange('minDepositAmount', parseFloat(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="maxDepositAmount">Maximum Deposit Amount ($)</Label>
              <Input
                id="maxDepositAmount"
                type="number"
                value={settings.maxDepositAmount || 10000}
                onChange={(e) => handleInputChange('maxDepositAmount', parseFloat(e.target.value) || 0)}
                placeholder="10000"
              />
            </div>
            <div>
              <Label htmlFor="defaultDepositFee">Default Deposit Fee (%)</Label>
              <Input
                id="defaultDepositFee"
                type="number"
                step="0.01"
                value={(settings.defaultDepositFee || 0) * 100}
                onChange={(e) => handleInputChange('defaultDepositFee', (parseFloat(e.target.value) || 0) / 100)}
                placeholder="2.0"
              />
            </div>
            <div>
              <Label htmlFor="defaultWithdrawalFee">Default Withdrawal Fee (%)</Label>
              <Input
                id="defaultWithdrawalFee"
                type="number"
                step="0.01"
                value={(settings.defaultWithdrawalFee || 0) * 100}
                onChange={(e) => handleInputChange('defaultWithdrawalFee', (parseFloat(e.target.value) || 0) / 100)}
                placeholder="3.0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="registrationEnabled">User Registration</Label>
                <p className="text-sm text-gray-500">Allow new users to register</p>
              </div>
              <Switch
                id="registrationEnabled"
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => handleInputChange('registrationEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactorRequired">Require 2FA</Label>
                <p className="text-sm text-gray-500">Mandatory two-factor authentication</p>
              </div>
              <Switch
                id="twoFactorRequired"
                checked={settings.twoFactorRequired}
                onCheckedChange={(checked) => handleInputChange('twoFactorRequired', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Send email notifications to users</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Send SMS notifications to users</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Email Testing Tool */}
        <EmailTester />

        {/* System Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Put the system in maintenance mode</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
              />
            </div>
            {settings.maintenanceMode && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-semibold">⚠️ Maintenance Mode Active</p>
                <p className="text-yellow-700 text-sm mt-1">
                  The system is currently in maintenance mode. Only administrators can access the platform.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password Change Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordData.newPassword && passwordData.newPassword.length < 8 && (
                <p className="text-sm text-red-600 mt-1">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handlePasswordSubmit}
              disabled={passwordMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
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
          {updateMutation.isPending ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}

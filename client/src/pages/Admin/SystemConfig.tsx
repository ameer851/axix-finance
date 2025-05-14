import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
// Layout is handled in App.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Globe, Mail, FileImage, Clock, Server, Database } from 'lucide-react';

// Mock system settings
const systemSettings = {
  branding: {
    appName: 'Carax Finance',
    companyName: 'Carax Inc.',
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    primaryColor: '#2563eb',
    accentColor: '#4f46e5',
  },
  locale: {
    timezone: 'Europe/London',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    currencySymbol: '$',
  },
  email: {
    smtpServer: 'smtp.example.com',
    smtpPort: 587,
    smtpUsername: 'notifications@example.com',
    smtpPassword: '••••••••••••',
    fromEmail: 'noreply@example.com',
    fromName: 'Carax Finance',
    enableSsl: true,
  },
  uploads: {
    maxFileSize: 5, // MB
    allowedExtensions: '.jpg, .jpeg, .png, .gif, .pdf, .doc, .docx',
    storageLocation: 'local', // local, s3, etc.
    imageQuality: 80,
  }
};

const SystemConfig: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(systemSettings);
  const [activeTab, setActiveTab] = useState('branding');
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Mock update function
  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      console.log('Updating settings:', newSettings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return newSettings;
    },
    onSuccess: (data) => {
      setSettings(data);
      toast({
        title: 'Success',
        description: 'System settings updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error}`,
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleBrandingChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      branding: {
        ...settings.branding,
        [key]: value
      }
    });
  };

  const handleLocaleChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      locale: {
        ...settings.locale,
        [key]: value
      }
    });
  };

  const handleEmailChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      email: {
        ...settings.email,
        [key]: value
      }
    });
  };

  const handleUploadsChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      uploads: {
        ...settings.uploads,
        [key]: value
      }
    });
  };

  // Mock function to send test email
  const handleSendTestEmail = () => {
    if (!testEmailAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sending Test Email',
      description: `Sending test email to ${testEmailAddress}...`,
    });

    setTimeout(() => {
      toast({
        title: 'Test Email Sent',
        description: `A test email has been sent to ${testEmailAddress}`,
      });
    }, 2000);
  };

  // Mock function for maintenance mode
  const toggleMaintenanceMode = () => {
    setMaintenanceMode(!maintenanceMode);
    
    toast({
      title: maintenanceMode ? 'Maintenance Mode Disabled' : 'Maintenance Mode Enabled',
      description: maintenanceMode 
        ? 'Your application is now accessible to all users' 
        : 'Your application is now in maintenance mode and inaccessible to regular users',
      variant: maintenanceMode ? 'default' : 'destructive',
    });
  };

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Configuration</h1>
          <p className="text-muted-foreground">Configure global system settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your application
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col space-y-1 px-2 py-2">
                <Button 
                  variant={activeTab === 'branding' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('branding')}
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Branding
                </Button>
                <Button 
                  variant={activeTab === 'locale' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('locale')}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Localization
                </Button>
                <Button 
                  variant={activeTab === 'email' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('email')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Settings
                </Button>
                <Button 
                  variant={activeTab === 'uploads' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('uploads')}
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  File Uploads
                </Button>
                <Button 
                  variant={activeTab === 'maintenance' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('maintenance')}
                >
                  <Server className="mr-2 h-4 w-4" />
                  Maintenance
                </Button>
              </nav>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>
                {activeTab === 'branding' && (
                  <div className="flex items-center">
                    <FileImage className="mr-2 h-5 w-5" /> Branding Settings
                  </div>
                )}
                {activeTab === 'locale' && (
                  <div className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" /> Localization Settings
                  </div>
                )}
                {activeTab === 'email' && (
                  <div className="flex items-center">
                    <Mail className="mr-2 h-5 w-5" /> Email Configuration
                  </div>
                )}
                {activeTab === 'uploads' && (
                  <div className="flex items-center">
                    <FileImage className="mr-2 h-5 w-5" /> File Upload Settings
                  </div>
                )}
                {activeTab === 'maintenance' && (
                  <div className="flex items-center">
                    <Server className="mr-2 h-5 w-5" /> System Maintenance
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {activeTab === 'branding' && "Customize your application's appearance and branding"}
                {activeTab === 'locale' && "Configure regional settings and formatting"}
                {activeTab === 'email' && "Set up system email notification settings"}
                {activeTab === 'uploads' && "Configure file upload limits and settings"}
                {activeTab === 'maintenance' && "Manage system maintenance and updates"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Branding Settings */}
              {activeTab === 'branding' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appName">Application Name</Label>
                      <Input 
                        id="appName" 
                        value={settings.branding.appName}
                        onChange={(e) => handleBrandingChange('appName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input 
                        id="companyName" 
                        value={settings.branding.companyName}
                        onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input 
                        id="logoUrl" 
                        value={settings.branding.logoUrl}
                        onChange={(e) => handleBrandingChange('logoUrl', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faviconUrl">Favicon URL</Label>
                      <Input 
                        id="faviconUrl" 
                        value={settings.branding.faviconUrl}
                        onChange={(e) => handleBrandingChange('faviconUrl', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="primaryColor" 
                          value={settings.branding.primaryColor}
                          onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                        />
                        <input 
                          type="color" 
                          value={settings.branding.primaryColor} 
                          onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                          className="w-10 h-10 p-1 rounded border"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="accentColor" 
                          value={settings.branding.accentColor}
                          onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                        />
                        <input 
                          type="color" 
                          value={settings.branding.accentColor} 
                          onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                          className="w-10 h-10 p-1 rounded border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Branding Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Locale Settings */}
              {activeTab === 'locale' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Time Zone</Label>
                      <Select 
                        defaultValue={settings.locale.timezone}
                        onValueChange={(value) => handleLocaleChange('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        defaultValue={settings.locale.language}
                        onValueChange={(value) => handleLocaleChange('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select 
                        defaultValue={settings.locale.dateFormat}
                        onValueChange={(value) => handleLocaleChange('dateFormat', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          <SelectItem value="MMM D, YYYY">MMM D, YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select 
                        defaultValue={settings.locale.timeFormat}
                        onValueChange={(value) => handleLocaleChange('timeFormat', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        defaultValue={settings.locale.currency}
                        onValueChange={(value) => handleLocaleChange('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                          <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                          <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                          <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currencySymbol">Currency Symbol</Label>
                      <Input 
                        id="currencySymbol" 
                        value={settings.locale.currencySymbol}
                        onChange={(e) => handleLocaleChange('currencySymbol', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Locale Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              {activeTab === 'email' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpServer">SMTP Server</Label>
                      <Input 
                        id="smtpServer" 
                        value={settings.email.smtpServer}
                        onChange={(e) => handleEmailChange('smtpServer', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input 
                        id="smtpPort" 
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => handleEmailChange('smtpPort', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">SMTP Username</Label>
                      <Input 
                        id="smtpUsername" 
                        value={settings.email.smtpUsername}
                        onChange={(e) => handleEmailChange('smtpUsername', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input 
                        id="smtpPassword" 
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleEmailChange('smtpPassword', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input 
                        id="fromEmail" 
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => handleEmailChange('fromEmail', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name</Label>
                      <Input 
                        id="fromName" 
                        value={settings.email.fromName}
                        onChange={(e) => handleEmailChange('fromName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="enableSsl" 
                      checked={settings.email.enableSsl}
                      onCheckedChange={(checked) => handleEmailChange('enableSsl', checked)}
                    />
                    <Label htmlFor="enableSsl">Enable SSL/TLS</Label>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-base font-medium mb-2">Test Email Configuration</h3>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter email address" 
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                      />
                      <Button onClick={handleSendTestEmail}>Send Test</Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Email Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* File Upload Settings */}
              {activeTab === 'uploads' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                      <Input 
                        id="maxFileSize" 
                        type="number"
                        min="1"
                        max="100"
                        value={settings.uploads.maxFileSize}
                        onChange={(e) => handleUploadsChange('maxFileSize', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageQuality">Image Quality (1-100)</Label>
                      <Input 
                        id="imageQuality"
                        type="number"
                        min="1"
                        max="100" 
                        value={settings.uploads.imageQuality}
                        onChange={(e) => handleUploadsChange('imageQuality', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allowedExtensions">Allowed File Extensions</Label>
                    <Textarea 
                      id="allowedExtensions" 
                      value={settings.uploads.allowedExtensions}
                      onChange={(e) => handleUploadsChange('allowedExtensions', e.target.value)}
                      placeholder="Enter comma-separated list of allowed file extensions"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter comma-separated list of allowed file extensions (e.g., .jpg, .png, .pdf)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storageLocation">Storage Location</Label>
                    <Select 
                      defaultValue={settings.uploads.storageLocation}
                      onValueChange={(value) => handleUploadsChange('storageLocation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Storage</SelectItem>
                        <SelectItem value="s3">Amazon S3</SelectItem>
                        <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                        <SelectItem value="azure">Azure Blob Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Upload Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Maintenance Settings */}
              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Maintenance Mode</CardTitle>
                      <CardDescription>
                        When enabled, regular users will not be able to access the application.
                        Only administrators will have access.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Maintenance Mode</h4>
                          <p className="text-sm text-muted-foreground">
                            {maintenanceMode 
                              ? 'Your application is currently in maintenance mode' 
                              : 'Your application is currently accessible to all users'}
                          </p>
                        </div>
                        <Switch 
                          checked={maintenanceMode}
                          onCheckedChange={toggleMaintenanceMode}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea 
                        id="maintenanceMessage" 
                        placeholder="Enter the message to display to users during maintenance"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedCompletion">Expected Completion</Label>
                      <Input 
                        id="expectedCompletion" 
                        type="datetime-local"
                      />
                    </div>
                  </div>

                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">System Performance</CardTitle>
                      <CardDescription>
                        Configure system-level performance settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Debug Mode</h4>
                            <p className="text-sm text-muted-foreground">
                              Enable detailed error messages and logging
                            </p>
                          </div>
                          <Switch id="debugMode" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Cache System</h4>
                            <p className="text-sm text-muted-foreground">
                              Enable system-wide caching
                            </p>
                          </div>
                          <Switch id="cacheEnabled" defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-4">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Maintenance Settings'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default SystemConfig;

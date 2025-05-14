import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
// Layout is handled in App.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Lock, Key, Shield, Timer, AlertTriangle, Fingerprint, Globe, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock security settings
const securitySettings = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expireDays: 90,
  },
  loginSecurity: {
    twoFactorEnabled: true,
    twoFactorRequired: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
  },
  sessionSettings: {
    sessionTimeout: 60, // minutes
    allowConcurrentSessions: true,
    maxConcurrentSessions: 3,
  },
  ipWhitelisting: {
    enabled: false,
    whitelistedIps: ['192.168.1.1', '10.0.0.1'],
  },
  auditLogging: {
    logFailedLogins: true,
    logSuccessfulLogins: true,
    logAdminActions: true,
    logLevel: 'info',
  }
};

const SecuritySettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(securitySettings);
  const [activeTab, setActiveTab] = useState('password');

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
        description: 'Security settings updated successfully',
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

  const handleSaveSettings = () => {
    updateMutation.mutate(settings);
  };

  const handlePasswordPolicyChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      passwordPolicy: {
        ...settings.passwordPolicy,
        [key]: value
      }
    });
  };

  const handleLoginSecurityChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      loginSecurity: {
        ...settings.loginSecurity,
        [key]: value
      }
    });
  };

  const handleSessionSettingsChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      sessionSettings: {
        ...settings.sessionSettings,
        [key]: value
      }
    });
  };

  const handleIPWhitelistingChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      ipWhitelisting: {
        ...settings.ipWhitelisting,
        [key]: value
      }
    });
  };

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground">Configure system security policies and access controls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col space-y-1 px-2 py-2">
                <Button 
                  variant={activeTab === 'password' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('password')}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Password Policy
                </Button>
                <Button 
                  variant={activeTab === 'login' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('login')}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Login Security
                </Button>
                <Button 
                  variant={activeTab === 'session' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('session')}
                >
                  <Timer className="mr-2 h-4 w-4" />
                  Session Management
                </Button>
                <Button 
                  variant={activeTab === 'ip' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('ip')}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  IP Restriction
                </Button>
                <Button 
                  variant={activeTab === 'audit' ? 'secondary' : 'ghost'} 
                  className="justify-start" 
                  onClick={() => setActiveTab('audit')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Audit Logging
                </Button>
              </nav>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {activeTab === 'password' && (
                  <div className="flex items-center">
                    <Key className="mr-2 h-5 w-5" /> Password Policy
                  </div>
                )}
                {activeTab === 'login' && (
                  <div className="flex items-center">
                    <Lock className="mr-2 h-5 w-5" /> Login Security
                  </div>
                )}
                {activeTab === 'session' && (
                  <div className="flex items-center">
                    <Timer className="mr-2 h-5 w-5" /> Session Management
                  </div>
                )}
                {activeTab === 'ip' && (
                  <div className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" /> IP Restrictions
                  </div>
                )}
                {activeTab === 'audit' && (
                  <div className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" /> Audit Logging
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {activeTab === 'password' && "Configure password requirements and policies"}
                {activeTab === 'login' && "Manage login security and 2FA settings"}
                {activeTab === 'session' && "Control user session behavior"}
                {activeTab === 'ip' && "Restrict access by IP address"}
                {activeTab === 'audit' && "Configure security audit logging"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {/* Password Policy Settings */}
                {activeTab === 'password' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minLength">Minimum Length</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="minLength" 
                            type="number" 
                            min="6" 
                            max="30" 
                            value={settings.passwordPolicy.minLength}
                            onChange={(e) => handlePasswordPolicyChange('minLength', parseInt(e.target.value))}
                          />
                          <span className="text-sm text-muted-foreground">characters</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expireDays">Password Expiration</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="expireDays" 
                            type="number" 
                            min="0" 
                            max="365" 
                            value={settings.passwordPolicy.expireDays}
                            onChange={(e) => handlePasswordPolicyChange('expireDays', parseInt(e.target.value))}
                          />
                          <span className="text-sm text-muted-foreground">days (0 for never)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border p-3 rounded-md">
                      <Label className="text-base">Password Requirements</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireUppercase" className="cursor-pointer">Require uppercase letters</Label>
                          <Switch 
                            id="requireUppercase" 
                            checked={settings.passwordPolicy.requireUppercase}
                            onCheckedChange={(checked) => handlePasswordPolicyChange('requireUppercase', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireLowercase" className="cursor-pointer">Require lowercase letters</Label>
                          <Switch 
                            id="requireLowercase" 
                            checked={settings.passwordPolicy.requireLowercase}
                            onCheckedChange={(checked) => handlePasswordPolicyChange('requireLowercase', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireNumbers" className="cursor-pointer">Require numbers</Label>
                          <Switch 
                            id="requireNumbers" 
                            checked={settings.passwordPolicy.requireNumbers}
                            onCheckedChange={(checked) => handlePasswordPolicyChange('requireNumbers', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireSpecialChars" className="cursor-pointer">Require special characters</Label>
                          <Switch 
                            id="requireSpecialChars" 
                            checked={settings.passwordPolicy.requireSpecialChars}
                            onCheckedChange={(checked) => handlePasswordPolicyChange('requireSpecialChars', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Login Security Settings */}
                {activeTab === 'login' && (
                  <div className="space-y-4">
                    <div className="border p-3 rounded-md space-y-3">
                      <Label className="text-base">Two-Factor Authentication (2FA)</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="twoFactorEnabled" className="cursor-pointer">Enable 2FA option for users</Label>
                          <Switch 
                            id="twoFactorEnabled" 
                            checked={settings.loginSecurity.twoFactorEnabled}
                            onCheckedChange={(checked) => handleLoginSecurityChange('twoFactorEnabled', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="twoFactorRequired" className="cursor-pointer">Require 2FA for all users</Label>
                          <Switch 
                            id="twoFactorRequired" 
                            checked={settings.loginSecurity.twoFactorRequired}
                            disabled={!settings.loginSecurity.twoFactorEnabled}
                            onCheckedChange={(checked) => handleLoginSecurityChange('twoFactorRequired', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="maxLoginAttempts" 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={settings.loginSecurity.maxLoginAttempts}
                          onChange={(e) => handleLoginSecurityChange('maxLoginAttempts', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">attempts</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lockoutDuration">Account Lockout Duration</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="lockoutDuration" 
                          type="number" 
                          min="5" 
                          max="1440" 
                          value={settings.loginSecurity.lockoutDuration}
                          onChange={(e) => handleLoginSecurityChange('lockoutDuration', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Management Settings */}
                {activeTab === 'session' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="sessionTimeout" 
                          type="number" 
                          min="5" 
                          max="1440" 
                          value={settings.sessionSettings.sessionTimeout}
                          onChange={(e) => handleSessionSettingsChange('sessionTimeout', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </div>

                    <div className="border p-3 rounded-md space-y-3">
                      <Label className="text-base">Concurrent Sessions</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowConcurrentSessions" className="cursor-pointer">Allow concurrent logins</Label>
                          <Switch 
                            id="allowConcurrentSessions" 
                            checked={settings.sessionSettings.allowConcurrentSessions}
                            onCheckedChange={(checked) => handleSessionSettingsChange('allowConcurrentSessions', checked)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxConcurrentSessions">Maximum concurrent sessions</Label>
                          <Input 
                            id="maxConcurrentSessions" 
                            type="number" 
                            min="1" 
                            max="10" 
                            value={settings.sessionSettings.maxConcurrentSessions}
                            disabled={!settings.sessionSettings.allowConcurrentSessions}
                            onChange={(e) => handleSessionSettingsChange('maxConcurrentSessions', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* IP Restriction Settings */}
                {activeTab === 'ip' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border p-3 rounded-md">
                      <div>
                        <Label htmlFor="ipWhitelistEnabled" className="text-base cursor-pointer">Enable IP Whitelisting</Label>
                        <p className="text-sm text-muted-foreground">Only allow access from specific IP addresses</p>
                      </div>
                      <Switch 
                        id="ipWhitelistEnabled" 
                        checked={settings.ipWhitelisting.enabled}
                        onCheckedChange={(checked) => handleIPWhitelistingChange('enabled', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Whitelisted IP Addresses</Label>
                      <div className="border rounded-md p-3 space-y-2">
                        {settings.ipWhitelisting.whitelistedIps.map((ip, index) => (
                          <div key={index} className="flex items-center justify-between bg-secondary/50 p-2 rounded">
                            <span>{ip}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={!settings.ipWhitelisting.enabled}
                              onClick={() => {
                                const newIps = [...settings.ipWhitelisting.whitelistedIps];
                                newIps.splice(index, 1);
                                handleIPWhitelistingChange('whitelistedIps', newIps);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <Input 
                            placeholder="Enter IP address" 
                            id="newIp" 
                            disabled={!settings.ipWhitelisting.enabled}
                          />
                          <Button 
                            variant="outline"
                            disabled={!settings.ipWhitelisting.enabled}
                            onClick={() => {
                              const input = document.getElementById('newIp') as HTMLInputElement;
                              if (input.value.trim()) {
                                handleIPWhitelistingChange('whitelistedIps', [
                                  ...settings.ipWhitelisting.whitelistedIps,
                                  input.value.trim()
                                ]);
                                input.value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Logging Settings */}
                {activeTab === 'audit' && (
                  <div className="space-y-4">
                    <div className="border p-3 rounded-md space-y-3">
                      <Label className="text-base">Events to Log</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="logFailedLogins" className="cursor-pointer">Log failed login attempts</Label>
                          <Switch 
                            id="logFailedLogins" 
                            checked={settings.auditLogging.logFailedLogins}
                            onCheckedChange={(checked) => {
                              setSettings({
                                ...settings,
                                auditLogging: {
                                  ...settings.auditLogging,
                                  logFailedLogins: checked
                                }
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="logSuccessfulLogins" className="cursor-pointer">Log successful logins</Label>
                          <Switch 
                            id="logSuccessfulLogins" 
                            checked={settings.auditLogging.logSuccessfulLogins}
                            onCheckedChange={(checked) => {
                              setSettings({
                                ...settings,
                                auditLogging: {
                                  ...settings.auditLogging,
                                  logSuccessfulLogins: checked
                                }
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="logAdminActions" className="cursor-pointer">Log administrative actions</Label>
                          <Switch 
                            id="logAdminActions" 
                            checked={settings.auditLogging.logAdminActions}
                            onCheckedChange={(checked) => {
                              setSettings({
                                ...settings,
                                auditLogging: {
                                  ...settings.auditLogging,
                                  logAdminActions: checked
                                }
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logLevel">Log Detail Level</Label>
                      <Select 
                        defaultValue={settings.auditLogging.logLevel} 
                        onValueChange={(value) => {
                          setSettings({
                            ...settings,
                            auditLogging: {
                              ...settings.auditLogging,
                              logLevel: value
                            }
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error only</SelectItem>
                          <SelectItem value="warn">Warning and errors</SelectItem>
                          <SelectItem value="info">Informational</SelectItem>
                          <SelectItem value="debug">Debug (verbose)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </ScrollArea>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default SecuritySettings;

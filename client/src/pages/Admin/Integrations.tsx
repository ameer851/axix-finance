import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Check, ChevronRight, Copy, ExternalLink, Link2, RefreshCw, Shield, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock data for integrations
const PAYMENT_INTEGRATIONS = [
  { id: 1, name: 'Stripe', status: true, apiKey: 'sk_test_*****************************', createdAt: '2023-04-12' },
  { id: 2, name: 'PayPal', status: false, apiKey: '', createdAt: '2023-04-15' },
  { id: 3, name: 'Square', status: false, apiKey: '', createdAt: '2023-05-01' },
];

const NOTIFICATION_INTEGRATIONS = [
  { id: 1, name: 'SendGrid', status: true, apiKey: 'SG.*****************************', createdAt: '2023-04-10' },
  { id: 2, name: 'Twilio', status: true, apiKey: 'TS.*****************************', createdAt: '2023-04-20' },
  { id: 3, name: 'PushNotifications.io', status: false, apiKey: '', createdAt: '2023-05-05' },
];

const ANALYTICS_INTEGRATIONS = [
  { id: 1, name: 'Google Analytics', status: true, apiKey: 'UA-*****************************', createdAt: '2023-03-15' },
  { id: 2, name: 'Mixpanel', status: false, apiKey: '', createdAt: '2023-04-18' },
  { id: 3, name: 'Hotjar', status: true, apiKey: 'HJ.*****************************', createdAt: '2023-05-02' },
];

const SOCIAL_INTEGRATIONS = [
  { id: 1, name: 'Google OAuth', status: true, apiKey: 'G-*****************************', createdAt: '2023-03-20' },
  { id: 2, name: 'Facebook Login', status: true, apiKey: 'FB.*****************************', createdAt: '2023-04-05' },
  { id: 3, name: 'Twitter API', status: false, apiKey: '', createdAt: '2023-04-25' },
  { id: 4, name: 'LinkedIn API', status: false, apiKey: '', createdAt: '2023-05-10' },
];

const AdminIntegrations: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('payment');
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [newIntegration, setNewIntegration] = useState({ name: '', apiKey: '', webhookUrl: '', secretKey: '' });
  const [isEditingKey, setIsEditingKey] = useState<number | null>(null);
  const [newApiKey, setNewApiKey] = useState('');

  // Get integrations based on active tab
  const getIntegrations = () => {
    switch (activeTab) {
      case 'payment':
        return PAYMENT_INTEGRATIONS;
      case 'notification':
        return NOTIFICATION_INTEGRATIONS;
      case 'analytics':
        return ANALYTICS_INTEGRATIONS;
      case 'social':
        return SOCIAL_INTEGRATIONS;
      default:
        return [];
    }
  };

  // Handle toggling integration status
  const handleToggleStatus = (id: number) => {
    // In a real app, this would make an API call to update the status
    toast({
      title: 'Status Updated',
      description: 'Integration status has been updated successfully.',
    });
  };

  // Handle editing API key
  const handleSaveApiKey = (id: number) => {
    if (!newApiKey.trim()) {
      toast({
        title: 'Error',
        description: 'API key cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, this would make an API call to update the API key
    toast({
      title: 'API Key Updated',
      description: 'Your API key has been updated successfully.',
    });
    
    setIsEditingKey(null);
    setNewApiKey('');
  };

  // Handle deleting integration
  const handleDeleteIntegration = (id: number) => {
    // In a real app, this would make an API call to delete the integration
    toast({
      title: 'Integration Removed',
      description: 'The integration has been removed successfully.',
      variant: 'default',
    });
  };

  // Handle adding new integration
  const handleAddIntegration = () => {
    if (!newIntegration.name.trim() || !newIntegration.apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Name and API key are required.',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, this would make an API call to add the integration
    toast({
      title: 'Integration Added',
      description: `${newIntegration.name} has been added successfully.`,
    });
    
    setIsAddingIntegration(false);
    setNewIntegration({ name: '', apiKey: '', webhookUrl: '', secretKey: '' });
  };

  // Handle API key copy
  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard.',
    });
  };

  // Convert integration name to documentation link (mock)
  const getDocumentationLink = (name: string) => {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '');
    return `https://docs.caraxfinance.com/integrations/${normalizedName}`;
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Third-Party Integrations" 
        description="Manage all your external service connections and API keys."
      />

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Secure Your Keys</AlertTitle>
        <AlertDescription>
          All API keys are securely stored and encrypted. Never share your keys with anyone not authorized to access them.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
          <TabsTrigger value="notification">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="social">Social Login</TabsTrigger>
        </TabsList>

        {['payment', 'notification', 'analytics', 'social'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {tabValue === 'payment' && 'Payment Gateway Integrations'}
                {tabValue === 'notification' && 'Notification Service Integrations'}
                {tabValue === 'analytics' && 'Analytics Platform Integrations'}
                {tabValue === 'social' && 'Social Media Integrations'}
              </h3>
              <Dialog open={isAddingIntegration} onOpenChange={setIsAddingIntegration}>
                <DialogTrigger asChild>
                  <Button>
                    Add Integration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Integration</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new integration. You'll need to provide the API key and any other required credentials.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="integration-name" className="text-right">Name</Label>
                      <Input
                        id="integration-name"
                        className="col-span-3"
                        value={newIntegration.name}
                        onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="api-key" className="text-right">API Key</Label>
                      <Input
                        id="api-key"
                        className="col-span-3"
                        type="password"
                        value={newIntegration.apiKey}
                        onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="webhook-url" className="text-right">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        className="col-span-3"
                        value={newIntegration.webhookUrl}
                        onChange={(e) => setNewIntegration({ ...newIntegration, webhookUrl: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="secret-key" className="text-right">Secret Key</Label>
                      <Input
                        id="secret-key"
                        className="col-span-3"
                        type="password"
                        value={newIntegration.secretKey}
                        onChange={(e) => setNewIntegration({ ...newIntegration, secretKey: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingIntegration(false)}>Cancel</Button>
                    <Button onClick={handleAddIntegration}>Add Integration</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getIntegrations().map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium">{integration.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={integration.status}
                            onCheckedChange={() => handleToggleStatus(integration.id)}
                          />
                          <span className={integration.status ? "text-green-500" : "text-gray-500"}>
                            {integration.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isEditingKey === integration.id ? (
                          <div className="flex space-x-2">
                            <Input
                              className="max-w-xs"
                              type="password"
                              value={newApiKey}
                              onChange={(e) => setNewApiKey(e.target.value)}
                              placeholder="Enter new API key"
                            />
                            <Button size="sm" onClick={() => handleSaveApiKey(integration.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <code className="bg-secondary px-2 py-1 rounded text-xs">
                              {integration.apiKey || 'Not configured'}
                            </code>
                            {integration.apiKey && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyApiKey(integration.apiKey)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{integration.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {integration.status && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingKey(integration.id)}>
                              Refresh Key
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={getDocumentationLink(integration.name)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              Docs <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteIntegration(integration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {getIntegrations().length === 0 && (
              <div className="text-center p-8 border border-dashed rounded-md">
                <h3 className="font-medium text-gray-500 mb-2">No integrations found</h3>
                <p className="text-gray-400 mb-4">Add your first integration to get started</p>
                <Button onClick={() => setIsAddingIntegration(true)}>
                  Add Integration
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Webhooks Configuration</CardTitle>
          <CardDescription>Configure webhook endpoints for your integrations to receive real-time updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex items-center justify-between border p-4 rounded-md">
              <div>
                <h4 className="font-medium">System Events Webhook</h4>
                <p className="text-sm text-gray-500">Receives all system-level events and notifications</p>
              </div>
              <Button variant="outline" className="flex items-center gap-1">
                Configure <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between border p-4 rounded-md">
              <div>
                <h4 className="font-medium">Payment Events Webhook</h4>
                <p className="text-sm text-gray-500">Receives all payment processing events</p>
              </div>
              <Button variant="outline" className="flex items-center gap-1">
                Configure <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between border p-4 rounded-md">
              <div>
                <h4 className="font-medium">User Events Webhook</h4>
                <p className="text-sm text-gray-500">Receives user-related events like signup, login, etc.</p>
              </div>
              <Button variant="outline" className="flex items-center gap-1">
                Configure <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Test Webhooks</Button>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Security Settings</CardTitle>
          <CardDescription>Configure security settings for API access and integrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ip-whitelist">IP Whitelisting</Label>
              <p className="text-sm text-gray-500">Restrict API access to specific IP addresses</p>
            </div>
            <Switch id="ip-whitelist" checked={true} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rate-limiting">API Rate Limiting</Label>
              <p className="text-sm text-gray-500">Limit API requests per minute to prevent abuse</p>
            </div>
            <Switch id="rate-limiting" checked={true} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="jwt-auth">JWT Authentication</Label>
              <p className="text-sm text-gray-500">Use JWT tokens for API authentication</p>
            </div>
            <Switch id="jwt-auth" checked={true} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="access-logs">API Access Logs</Label>
              <p className="text-sm text-gray-500">Log all API access and requests</p>
            </div>
            <Switch id="access-logs" checked={true} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Update Security Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminIntegrations;

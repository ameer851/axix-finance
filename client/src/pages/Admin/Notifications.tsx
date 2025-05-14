import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
// We don't need to import AdminLayout here as it's handled in App.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, Send, FileText, Mail, Users, AlertCircle,
  Clock, CheckCircle2, Info, BellRing, Smartphone
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Mock notification templates
const notificationTemplates = [
  {
    id: 1,
    name: 'Welcome Email',
    type: 'email',
    subject: 'Welcome to Carax Finance',
    body: 'Dear {{user.name}},\n\nWelcome to Carax Finance! Your account has been created successfully.\n\nBest regards,\nThe Carax Team',
    active: true,
  },
  {
    id: 2,
    name: 'Password Reset',
    type: 'email',
    subject: 'Password Reset Request',
    body: 'Dear {{user.name}},\n\nYou requested a password reset. Click the link below to reset your password:\n\n{{resetLink}}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Carax Team',
    active: true,
  },
  {
    id: 3,
    name: 'Transaction Confirmation',
    type: 'email',
    subject: 'Transaction Confirmation',
    body: 'Dear {{user.name}},\n\nYour transaction of {{transaction.amount}} has been {{transaction.status}}.\n\nTransaction ID: {{transaction.id}}\nDate: {{transaction.date}}\n\nBest regards,\nThe Carax Team',
    active: true,
  },
  {
    id: 4,
    name: 'New Login Alert',
    type: 'in-app',
    body: 'New login to your account from {{login.device}} in {{login.location}}.',
    active: true,
  },
  {
    id: 5,
    name: 'Account Verification',
    type: 'sms',
    body: 'Your Carax verification code is {{code}}. Valid for 10 minutes.',
    active: true,
  }
];

// Mock user groups
const userGroups = [
  { id: 1, name: 'All Users', count: 150 },
  { id: 2, name: 'Premium Users', count: 45 },
  { id: 3, name: 'New Users (Last 30 days)', count: 23 },
  { id: 4, name: 'Inactive Users', count: 32 },
  { id: 5, name: 'Verified Users', count: 120 },
];

const NotificationsManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('broadcast');
  const [templates, setTemplates] = useState(notificationTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    selectedGroups: [] as number[],
    notificationType: 'in-app',
    priority: 'normal',
    scheduledTime: ''
  });

  // Mock save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      // Mock API call
      console.log('Saving template:', template);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return template;
    },
    onSuccess: (data) => {
      if (editMode) {
        setTemplates(prev => prev.map(t => t.id === data.id ? data : t));
        toast({
          title: 'Template Updated',
          description: 'Notification template has been updated successfully',
        });
      } else {
        setTemplates(prev => [...prev, { ...data, id: Date.now() }]);
        toast({
          title: 'Template Created',
          description: 'New notification template has been created successfully',
        });
      }
      setSelectedTemplate(null);
      setEditMode(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save template: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Mock broadcast notification mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock API call
      console.log('Broadcasting notification:', data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { sentCount: Math.floor(Math.random() * 100) + 50 };
    },
    onSuccess: (data) => {
      toast({
        title: 'Notification Sent',
        description: `Successfully sent to ${data.sentCount} recipients`,
      });
      setBroadcastForm({
        title: '',
        message: '',
        selectedGroups: [],
        notificationType: 'in-app',
        priority: 'normal',
        scheduledTime: ''
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send notification: ${error}`,
        variant: 'destructive',
      });
    }
  });

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditMode(true);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate({
      name: '',
      type: 'email',
      subject: '',
      body: '',
      active: true,
    });
    setEditMode(false);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate?.name || !selectedTemplate?.body) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    saveTemplateMutation.mutate(selectedTemplate);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!broadcastForm.title || !broadcastForm.message || broadcastForm.selectedGroups.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one user group',
        variant: 'destructive',
      });
      return;
    }
    
    broadcastMutation.mutate(broadcastForm);
  };

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage system notifications and messaging</p>
        </div>

        <Tabs defaultValue="broadcast" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="broadcast">
              <Send className="h-4 w-4 mr-2" />
              Broadcast Message
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Notification Templates
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Bell className="h-4 w-4 mr-2" />
              Notification Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="broadcast" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Send Notification</CardTitle>
                  <CardDescription>
                    Broadcast a message to multiple users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notificationType">Notification Type</Label>
                      <RadioGroup 
                        defaultValue="in-app" 
                        className="flex space-x-4"
                        value={broadcastForm.notificationType}
                        onValueChange={(value) => setBroadcastForm({...broadcastForm, notificationType: value})}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="in-app" id="in-app" />
                          <Label htmlFor="in-app" className="font-normal">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="email" />
                          <Label htmlFor="email" className="font-normal">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sms" id="sms" />
                          <Label htmlFor="sms" className="font-normal">SMS</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title/Subject</Label>
                      <Input 
                        id="title" 
                        value={broadcastForm.title}
                        onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                        placeholder="Enter notification title or email subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        rows={5}
                        value={broadcastForm.message}
                        onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                        placeholder="Enter notification message"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        defaultValue="normal"
                        value={broadcastForm.priority}
                        onValueChange={(value) => setBroadcastForm({...broadcastForm, priority: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">Schedule (optional)</Label>
                      <Input 
                        id="scheduledTime" 
                        type="datetime-local"
                        value={broadcastForm.scheduledTime}
                        onChange={(e) => setBroadcastForm({...broadcastForm, scheduledTime: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to send immediately
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={broadcastMutation.isPending}
                      >
                        {broadcastMutation.isPending ? (
                          <>Sending Notification...</>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Notification
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                  <CardDescription>
                    Choose groups to send notification to
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {userGroups.map((group) => (
                        <div key={group.id} className="flex items-start space-x-3">
                          <Checkbox 
                            id={`group-${group.id}`} 
                            checked={broadcastForm.selectedGroups.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBroadcastForm({
                                  ...broadcastForm, 
                                  selectedGroups: [...broadcastForm.selectedGroups, group.id]
                                });
                              } else {
                                setBroadcastForm({
                                  ...broadcastForm,
                                  selectedGroups: broadcastForm.selectedGroups.filter(id => id !== group.id)
                                });
                              }
                            }}
                          />
                          <div className="space-y-1">
                            <Label 
                              htmlFor={`group-${group.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {group.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {group.count} users
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <div className="w-full text-center text-sm text-muted-foreground">
                    {broadcastForm.selectedGroups.length > 0 ? (
                      <>
                        Selected {broadcastForm.selectedGroups.length} group(s) with approximately{' '}
                        <span className="font-semibold">
                          {userGroups
                            .filter(g => broadcastForm.selectedGroups.includes(g.id))
                            .reduce((acc, group) => acc + group.count, 0)
                          }{' '}
                          recipients
                        </span>
                      </>
                    ) : (
                      'No groups selected'
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={handleCreateTemplate}>
                <FileText className="h-4 w-4 mr-2" /> 
                Create Template
              </Button>
            </div>
            
            {selectedTemplate ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editMode ? 'Edit Template' : 'Create Template'}
                  </CardTitle>
                  <CardDescription>
                    {editMode 
                      ? 'Modify an existing notification template' 
                      : 'Create a new notification template'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input 
                          id="templateName" 
                          value={selectedTemplate.name}
                          onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="templateType">Notification Type</Label>
                        <Select 
                          defaultValue={selectedTemplate.type}
                          value={selectedTemplate.type}
                          onValueChange={(value) => setSelectedTemplate({...selectedTemplate, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="in-app">In-App Notification</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedTemplate.type === 'email' && (
                      <div className="space-y-2">
                        <Label htmlFor="templateSubject">Email Subject</Label>
                        <Input 
                          id="templateSubject" 
                          value={selectedTemplate.subject || ''}
                          onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="templateBody">
                        {selectedTemplate.type === 'email' ? 'Email Body' : 'Notification Content'}
                      </Label>
                      <Textarea 
                        id="templateBody" 
                        rows={8}
                        value={selectedTemplate.body}
                        onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use variables like {'{{user.name}}'} to personalize the message.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="templateActive" 
                        checked={selectedTemplate.active}
                        onCheckedChange={(checked) => setSelectedTemplate({...selectedTemplate, active: checked})}
                      />
                      <Label htmlFor="templateActive">Template is active</Label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate} disabled={saveTemplateMutation.isPending}>
                    {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className={!template.active ? 'opacity-70' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          template.type === 'email' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          template.type === 'sms' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {template.type === 'email' ? 'Email' : 
                           template.type === 'sms' ? 'SMS' : 
                           'In-App'}
                        </div>
                      </div>
                      {template.type === 'email' && (
                        <CardDescription className="mt-1">
                          Subject: {template.subject}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {template.body}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                      <Button size="sm" onClick={() => handleEditTemplate(template)}>
                        Edit
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure system-wide notification settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">Email Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableEmails" className="cursor-pointer">
                          Enable email notifications
                        </Label>
                        <Switch id="enableEmails" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableEmailDigest" className="cursor-pointer">
                          Send daily email digest
                        </Label>
                        <Switch id="enableEmailDigest" />
                      </div>
                      <div className="space-y-2 pl-6 border-l-2 border-muted mt-2">
                        <Label htmlFor="digestTime">Digest delivery time</Label>
                        <Select defaultValue="08:00">
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="06:00">6:00 AM</SelectItem>
                            <SelectItem value="08:00">8:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="16:00">4:00 PM</SelectItem>
                            <SelectItem value="20:00">8:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-medium">In-App Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableInApp" className="cursor-pointer">
                          Enable in-app notifications
                        </Label>
                        <Switch id="enableInApp" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoDeleteRead" className="cursor-pointer">
                          Auto-delete read notifications after
                        </Label>
                        <Select defaultValue="30">
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-medium">SMS Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableSms" className="cursor-pointer">
                          Enable SMS notifications
                        </Label>
                        <Switch id="enableSms" defaultChecked />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smsProvider">SMS Provider</Label>
                        <Select defaultValue="twilio">
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="twilio">Twilio</SelectItem>
                            <SelectItem value="nexmo">Nexmo/Vonage</SelectItem>
                            <SelectItem value="aws">AWS SNS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default NotificationsManagement;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Search, 
  MessageSquare,
  Check,
  Mail,
  MailOpen,
  User,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Message, MessageStatus, User as UserType } from '@shared/schema';

const responseSchema = z.object({
  response: z.string().min(1, { message: 'Response is required' }),
});

type ResponseForm = z.infer<typeof responseSchema>;

const AdminMessages: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);

  // Setup form
  const form = useForm<ResponseForm>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: ''
    }
  });

  // Fetch all messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/messages');
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        return await response.json();
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Could not load messages',
          variant: 'destructive'
        });
        return [];
      }
    }
  });

  // Fetch unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['/api/messages/unread'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/messages/unread');
        if (!response.ok) {
          throw new Error('Failed to fetch unread count');
        }
        const data = await response.json();
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    }
  });

  // Respond to message mutation
  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number; response: string }) => {
      const result = await apiRequest('POST', `/api/messages/${id}/respond`, { response });
      if (!result.ok) {
        throw new Error('Failed to respond to message');
      }
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });
      setResponseDialogOpen(false);
      setSelectedMessage(null);
      toast({
        title: 'Response sent',
        description: 'Your response has been sent to the user'
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send response',
        variant: 'destructive'
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-fetch with search query
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleCloseDetails = () => {
    setSelectedMessage(null);
  };

  const openResponseDialog = (message: Message) => {
    setSelectedMessage(message);
    setResponseDialogOpen(true);
  };

  const onSubmitResponse = (values: ResponseForm) => {
    if (selectedMessage) {
      respondMutation.mutate({
        id: selectedMessage.id,
        response: values.response
      });
    }
  };

  // Filter messages based on search query
  const filteredMessages = React.useMemo(() => {
    if (!searchQuery) return messages;
    
    return messages.filter((message: Message) => 
      message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  // Get message status badge
  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case 'unread':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Unread</Badge>;
      case 'read':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Read</Badge>;
      case 'replied':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Replied</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'unread':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'read':
        return <MailOpen className="h-5 w-5 text-gray-500" />;
      case 'replied':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  // Group messages by status
  const unreadMessages = filteredMessages.filter((m: Message) => m.status === 'unread');
  const readMessages = filteredMessages.filter((m: Message) => m.status === 'read');
  const repliedMessages = filteredMessages.filter((m: Message) => m.status === 'replied');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage and respond to user inquiries and support requests
          </p>
        </div>
        
        {unreadCount > 0 && (
          <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Mail className="h-4 w-4 mr-1" />
            {unreadCount} new message{unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/5 lg:w-1/3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                {messagesLoading 
                  ? 'Loading messages...' 
                  : `${filteredMessages.length} message${filteredMessages.length !== 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex w-full items-center space-x-2 mb-4">
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              
              <Tabs defaultValue="unread" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="unread" className="relative">
                    Unread
                    {unreadMessages.length > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadMessages.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="read">Read</TabsTrigger>
                  <TabsTrigger value="replied">Replied</TabsTrigger>
                </TabsList>
                
                <TabsContent value="unread" className="mt-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : unreadMessages.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      No unread messages.
                    </div>
                  ) : (
                    unreadMessages.map((message: Message) => (
                      <div 
                        key={message.id} 
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                          ${selectedMessage?.id === message.id ? 'bg-gray-50 dark:bg-gray-800 border-primary' : ''}
                        `}
                        onClick={() => handleViewMessage(message)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {getStatusIcon(message.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium truncate">
                                {message.subject || 'No Subject'}
                              </h3>
                              <div className="ml-2">
                                {getStatusBadge(message.status)}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {message.content || 'No content'}
                            </p>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>From: User #{message.userId}</span>
                              <span>{message.createdAt && formatDate(new Date(message.createdAt))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="read" className="mt-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : readMessages.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      No read messages.
                    </div>
                  ) : (
                    readMessages.map((message: Message) => (
                      <div 
                        key={message.id} 
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                          ${selectedMessage?.id === message.id ? 'bg-gray-50 dark:bg-gray-800 border-primary' : ''}
                        `}
                        onClick={() => handleViewMessage(message)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {getStatusIcon(message.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium truncate">
                                {message.subject || 'No Subject'}
                              </h3>
                              <div className="ml-2">
                                {getStatusBadge(message.status)}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {message.content || 'No content'}
                            </p>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>From: User #{message.userId}</span>
                              <span>{message.createdAt && formatDate(new Date(message.createdAt))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="replied" className="mt-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : repliedMessages.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      No replied messages.
                    </div>
                  ) : (
                    repliedMessages.map((message: Message) => (
                      <div 
                        key={message.id} 
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                          ${selectedMessage?.id === message.id ? 'bg-gray-50 dark:bg-gray-800 border-primary' : ''}
                        `}
                        onClick={() => handleViewMessage(message)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {getStatusIcon(message.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium truncate">
                                {message.subject || 'No Subject'}
                              </h3>
                              <div className="ml-2">
                                {getStatusBadge(message.status)}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {message.content || 'No content'}
                            </p>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>From: User #{message.userId}</span>
                              <span>{message.createdAt && formatDate(new Date(message.createdAt))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-3/5 lg:w-2/3">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-primary-500" />
                      {selectedMessage.subject || 'No Subject'}
                      <div className="ml-3">
                        {getStatusBadge(selectedMessage.status)}
                      </div>
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      From: User #{selectedMessage.userId}
                      {selectedMessage.createdAt && (
                        <span className="ml-4">
                          {formatDate(new Date(selectedMessage.createdAt))}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleCloseDetails}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-t pt-4">
                  <div className="prose dark:prose-invert max-w-none">
                    <p>{selectedMessage.content || 'No content'}</p>
                  </div>
                  
                  {selectedMessage.response && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Send className="h-4 w-4 mr-1 text-green-500" /> Your Response
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm">{selectedMessage.response}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <div></div>
                {selectedMessage.status !== 'replied' && (
                  <Button
                    onClick={() => openResponseDialog(selectedMessage)}
                    className="flex items-center"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Respond
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a message
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a message from the list to view its details.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Message</DialogTitle>
            <DialogDescription>
              Write your response to the user's inquiry.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmitResponse)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Original Message:</h3>
                <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {selectedMessage?.content || 'No content'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="response" className="text-sm font-medium">
                  Your Response:
                </label>
                <Textarea
                  id="response"
                  placeholder="Type your response here..."
                  rows={6}
                  {...form.register('response')}
                />
                {form.formState.errors.response && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.response.message}
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setResponseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={respondMutation.isPending}
              >
                {respondMutation.isPending ? 'Sending...' : 'Send Response'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages;
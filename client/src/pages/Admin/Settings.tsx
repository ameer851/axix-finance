import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAllSettings, updateSetting } from '@/services/adminService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Setting } from '@shared/schema';

const settingSchema = z.object({
  name: z.string().min(3, { message: 'Setting name is required' }),
  value: z.string().min(1, { message: 'Setting value is required' }),
  description: z.string().optional()
});

type SettingForm = z.infer<typeof settingSchema>;

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch settings
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      try {
        return await getAllSettings();
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Could not load settings',
          variant: 'destructive'
        });
        return [];
      }
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });

  // Setup form
  const form = useForm<SettingForm>({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      name: '',
      value: '',
      description: ''
    }
  });

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async (values: SettingForm) => {
      return await updateSetting(values.name, values.value, values.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Setting updated successfully',
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update setting',
        variant: 'destructive'
      });
    }
  });

  // Create setting mutation
  const createMutation = useMutation({
    mutationFn: async (values: SettingForm) => {
      return await updateSetting(values.name, values.value, values.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Success',
        description: 'Setting created successfully',
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create setting',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (values: SettingForm) => {
    if (editingId) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (setting: Setting) => {
    setEditingId(setting.name);
    form.setValue('name', setting.name);
    form.setValue('value', setting.value);
    form.setValue('description', setting.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const isSubmitting = updateMutation.isPending || createMutation.isPending;

  // Group settings by category (first part of the name before .)
  const groupedSettings = React.useMemo(() => {
    const groups: Record<string, Setting[]> = {};
    
    settings.forEach((setting: Setting) => {
      const parts = setting.name.split('.');
      const category = parts.length > 1 ? parts[0] : 'general';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      
      groups[category].push(setting);
    });
    
    return groups;
  }, [settings]);

  const categories = Object.keys(groupedSettings).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage global platform settings and configurations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add / Edit Setting</CardTitle>
            <CardDescription>
              {editingId ? 'Update an existing setting' : 'Create a new system setting'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setting Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., payments.minimum_deposit" 
                          {...field} 
                          disabled={!!editingId}
                        />
                      </FormControl>
                      <FormDescription>
                        Use dot notation for categories (e.g., feature.setting_name)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Setting value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Setting description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Setting' : 'Create Setting'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                  No settings found. Add your first setting.
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="mb-4">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categories.map(category => (
                <TabsContent key={category} value={category}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {category.charAt(0).toUpperCase() + category.slice(1)} Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {groupedSettings[category].map((setting: Setting) => (
                        <div key={setting.name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-sm font-medium">{setting.name}</h3>
                              {setting.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {setting.description}
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(setting)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm font-mono">
                            {setting.value}
                          </div>
                          <Separator />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
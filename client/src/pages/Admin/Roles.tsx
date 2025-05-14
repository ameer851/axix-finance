import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Layout is handled in App.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Plus, Shield, Trash2, User, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

// Mock functions for API calls (these would connect to your actual API)
async function getRoles() {
  // Simulate API call
  return [
    {
      id: 1,
      name: 'Administrator',
      description: 'Full access to all resources',
      permissions: ['manage_users', 'manage_roles', 'manage_settings', 'manage_transactions', 'view_reports', 'manage_security'],
      userCount: 3,
      createdAt: '2023-01-01',
      updatedAt: '2023-04-15',
    },
    {
      id: 2,
      name: 'Editor',
      description: 'Can edit content but not manage users or settings',
      permissions: ['view_dashboard', 'edit_content', 'view_reports'],
      userCount: 8,
      createdAt: '2023-01-15',
      updatedAt: '2023-03-10',
    },
    {
      id: 3,
      name: 'Viewer',
      description: 'Read-only access to selected resources',
      permissions: ['view_dashboard', 'view_reports'],
      userCount: 15,
      createdAt: '2023-02-01',
      updatedAt: '2023-02-01',
    },
    {
      id: 4,
      name: 'Customer Support',
      description: 'Can view and respond to customer issues',
      permissions: ['view_dashboard', 'manage_support', 'view_users'],
      userCount: 6,
      createdAt: '2023-03-15',
      updatedAt: '2023-04-20',
    },
  ];
}

// All possible permissions in the system
const allPermissions = [
  { id: 'manage_users', name: 'Manage Users', description: 'Create, update, and delete user accounts' },
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create and modify roles and permissions' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Change system configuration and settings' },
  { id: 'manage_transactions', name: 'Manage Transactions', description: 'View, approve, and cancel transactions' },
  { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to the main dashboard' },
  { id: 'edit_content', name: 'Edit Content', description: 'Create and edit website content' },
  { id: 'view_reports', name: 'View Reports', description: 'Access to analytics and reporting' },
  { id: 'manage_security', name: 'Manage Security', description: 'Configure security settings and access controls' },
  { id: 'manage_support', name: 'Manage Support', description: 'Handle customer support tickets and inquiries' },
  { id: 'view_users', name: 'View Users', description: 'View user information but cannot modify' },
];

// Group permissions by category
const permissionCategories = [
  { 
    id: 'user_management', 
    name: 'User Management', 
    permissions: ['manage_users', 'view_users'] 
  },
  { 
    id: 'admin', 
    name: 'Administration', 
    permissions: ['manage_roles', 'manage_settings', 'manage_security'] 
  },
  { 
    id: 'content', 
    name: 'Content & Data', 
    permissions: ['edit_content', 'view_dashboard', 'view_reports'] 
  },
  { 
    id: 'operations', 
    name: 'Operations', 
    permissions: ['manage_transactions', 'manage_support'] 
  },
];

const RolesAndPermissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    id: null,
    name: '',
    description: '',
    permissions: [] as string[],
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch roles data
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });
  
  // Role mutation for create/update operations
  const roleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      // Simulate API call
      console.log('Saving role:', roleData);
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...roleData, id: roleData.id || Date.now() };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: editingRole ? 'Role Updated' : 'Role Created',
        description: `${data.name} has been ${editingRole ? 'updated' : 'created'} successfully.`,
      });
      setShowRoleDialog(false);
      setEditingRole(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save role: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulate API call
      console.log('Deleting role:', id);
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Role Deleted',
        description: 'The role has been deleted successfully.',
      });
      setShowDeleteAlert(false);
      setRoleToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete role: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle opening the dialog for a new role
  const handleOpenDialog = () => {
    setEditingRole(null);
    setRoleFormData({
      id: null,
      name: '',
      description: '',
      permissions: [],
    });
    setShowRoleDialog(true);
  };
  
  // Handle editing an existing role
  const handleEditRole = (role: any) => {
    setEditingRole(role.id);
    setRoleFormData({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
    setShowRoleDialog(true);
  };
  
  // Handle role deletion confirmation
  const handleDeleteRole = (role: any) => {
    setRoleToDelete(role.id);
    setShowDeleteAlert(true);
  };
  
  // Handle role form submission
  const handleSubmitRole = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleFormData.name) {
      toast({
        title: 'Validation Error',
        description: 'Role name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    roleMutation.mutate(roleFormData);
  };
  
  // Check if a permission category is selected (all its permissions are selected)
  const isCategorySelected = (categoryId: string) => {
    const category = permissionCategories.find(c => c.id === categoryId);
    if (!category) return false;
    
    return category.permissions.every(permId => 
      roleFormData.permissions.includes(permId)
    );
  };
  
  // Handle permission category checkbox change
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const category = permissionCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    if (checked) {
      // Add all permissions from the category
      const newPermissions = [...roleFormData.permissions];
      category.permissions.forEach(permId => {
        if (!newPermissions.includes(permId)) {
          newPermissions.push(permId);
        }
      });
      setRoleFormData({...roleFormData, permissions: newPermissions});
    } else {
      // Remove all permissions from the category
      const newPermissions = roleFormData.permissions.filter(
        permId => !category.permissions.includes(permId)
      );
      setRoleFormData({...roleFormData, permissions: newPermissions});
    }
  };
  
  // Handle individual permission checkbox change
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setRoleFormData({
        ...roleFormData,
        permissions: [...roleFormData.permissions, permissionId],
      });
    } else {
      setRoleFormData({
        ...roleFormData,
        permissions: roleFormData.permissions.filter(id => id !== permissionId),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their access rights</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>
      
      <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{role.name}</CardTitle>
                    <Badge variant="outline">{role.userCount} users</Badge>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permId) => {
                        const permission = allPermissions.find(p => p.id === permId);
                        return (
                          <Badge key={permId} variant="secondary" className="text-xs">
                            {permission?.name || permId}
                          </Badge>
                        );
                      })}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Created: {role.createdAt}</span>
                    <span>Updated: {role.updatedAt}</span>
                  </div>
                </CardContent>
                <div className="flex justify-end px-6 pb-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteRole(role)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Permissions</CardTitle>
              <CardDescription>
                All permissions that can be assigned to roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {permissionCategories.map((category) => (
                  <div key={category.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium text-lg mb-2">{category.name}</h3>
                    <div className="space-y-3 pl-4">
                      {allPermissions
                        .filter(p => category.permissions.includes(p.id))
                        .map(permission => (
                          <div key={permission.id} className="flex items-start space-x-3">
                            <Shield className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">{permission.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Modify this role and its permissions' 
                : 'Define a new role with specific permissions'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitRole}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input 
                  id="name" 
                  value={roleFormData.name} 
                  onChange={e => setRoleFormData({...roleFormData, name: e.target.value})} 
                  className="col-span-3" 
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input 
                  id="description" 
                  value={roleFormData.description} 
                  onChange={e => setRoleFormData({...roleFormData, description: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              
              <div className="border rounded-lg p-4 mt-4">
                <h3 className="font-medium mb-2">Permissions</h3>
                
                <div className="space-y-4">
                  {permissionCategories.map(category => (
                    <div key={category.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox 
                          id={`category-${category.id}`}
                          checked={isCategorySelected(category.id)}
                          onCheckedChange={(checked) => handleCategoryChange(category.id, !!checked)}
                        />
                        <Label htmlFor={`category-${category.id}`} className="font-semibold">
                          {category.name}
                        </Label>
                      </div>
                      
                      <div className="ml-6 space-y-2">
                        {allPermissions
                          .filter(p => category.permissions.includes(p.id))
                          .map(permission => (
                            <div key={permission.id} className="flex items-start space-x-2">
                              <Checkbox 
                                id={`perm-${permission.id}`}
                                checked={roleFormData.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                              />
                              <div className="grid gap-1.5">
                                <Label 
                                  htmlFor={`perm-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowRoleDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={roleMutation.isPending}>
                {roleMutation.isPending && (
                  <div className="animate-spin mr-2">
                    <Shield className="h-4 w-4" />
                  </div>
                )}
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Role Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role
              and remove it from all users who currently have it assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (roleToDelete) deleteRoleMutation.mutate(roleToDelete);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RolesAndPermissions;

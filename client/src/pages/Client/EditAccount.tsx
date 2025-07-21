import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile, updateUserSecurity } from '@/services/userService';
import { User, Lock, Eye, EyeOff, Shield } from 'lucide-react';

// ErrorBoundary component
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log error info here
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

const EditAccount: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    dateOfBirth: ''
  });
  
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getUserProfile(user?.id),
    enabled: !!user?.id,
    staleTime: 300000 // 5 minutes
  });

  // Update profile form with fetched data
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || user?.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        zipCode: profileData.zipCode || '',
        country: profileData.country || '',
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : ''
      });
      
      setSecurityForm(prev => ({
        ...prev,
        twoFactorEnabled: profileData.twoFactorEnabled || false
      }));
    }
  }, [profileData, user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => updateUserProfile(user?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'There was an error updating your profile. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Update security settings mutation
  const updateSecurityMutation = useMutation({
    mutationFn: (data: any) => updateUserSecurity(user?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setSecurityForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      toast({
        title: 'Security Settings Updated',
        description: 'Your security settings have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'There was an error updating your security settings. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle security form changes
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  // Handle security form submission
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityForm.newPassword) {
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        toast({
          title: 'Password Mismatch',
          description: 'New password and confirmation do not match.',
          variant: 'destructive'
        });
        return;
      }
      
      if (securityForm.newPassword.length < 8) {
        toast({
          title: 'Password Too Short',
          description: 'Password must be at least 8 characters long.',
          variant: 'destructive'
        });
        return;
      }
    }
    
    updateSecurityMutation.mutate({
      currentPassword: securityForm.currentPassword,
      newPassword: securityForm.newPassword,
      twoFactorEnabled: securityForm.twoFactorEnabled
    });
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account Settings</CardTitle>
            <CardDescription>Manage your account information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileForm.firstName}
                          onChange={handleProfileChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileForm.lastName}
                          onChange={handleProfileChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        className="mt-1"
                        disabled={true}
                      />
                      <p className="text-xs text-gray-500 mt-1">Contact support to change your email address</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={handleProfileChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={profileForm.address}
                        onChange={handleProfileChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={profileForm.city}
                          onChange={handleProfileChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          name="state"
                          value={profileForm.state}
                          onChange={handleProfileChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">Zip/Postal Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={profileForm.zipCode}
                          onChange={handleProfileChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={profileForm.country}
                          onChange={handleProfileChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="security">
                <form onSubmit={handleSecuritySubmit}>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-primary" />
                            Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Switch
                          checked={securityForm.twoFactorEnabled}
                          onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, twoFactorEnabled: checked }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={securityForm.currentPassword}
                          onChange={handleSecurityChange}
                          className="mt-1 pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={securityForm.newPassword}
                          onChange={handleSecurityChange}
                          className="mt-1 pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={handleSecurityChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateSecurityMutation.isPending}>
                        {updateSecurityMutation.isPending ? 'Saving...' : 'Update Security Settings'}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default EditAccount;

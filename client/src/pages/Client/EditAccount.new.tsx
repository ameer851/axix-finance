import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile, updateUserSecurity } from '@/services/userService';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Save, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Camera,
  Edit3
} from 'lucide-react';

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
        description: 'Your profile information has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Update security mutation
  const updateSecurityMutation = useMutation({
    mutationFn: (data: any) => updateUserSecurity(user?.id, data),
    onSuccess: () => {
      setSecurityForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      toast({
        title: 'Security Updated',
        description: 'Your security settings have been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update security settings. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Handle form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your personal information and security preferences</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-1">
                <nav className="space-y-1">
                  <button
                    onClick={() => setCurrentTab('profile')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentTab === 'profile'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Personal Info
                  </button>
                  <button
                    onClick={() => setCurrentTab('security')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentTab === 'security'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Lock className="h-4 w-4 mr-3" />
                    Security
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              
              {/* Profile Tab */}
              {currentTab === 'profile' && (
                <div className="space-y-6">
                  {/* Profile Header Card */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-12 w-12 text-primary" />
                          </div>
                          <button 
                            className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-2 hover:bg-primary/90 transition-colors"
                            title="Change profile picture"
                          >
                            <Camera className="h-3 w-3" />
                          </button>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {profileForm.firstName} {profileForm.lastName}
                          </h2>
                          <p className="text-gray-600">{profileForm.email}</p>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified Account
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal Information Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Edit3 className="h-5 w-5" />
                        <span>Personal Information</span>
                      </CardTitle>
                      <CardDescription>
                        Update your personal details and contact information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleProfileSubmit} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                              First Name
                            </Label>
                            <Input
                              id="firstName"
                              name="firstName"
                              value={profileForm.firstName}
                              onChange={handleProfileChange}
                              className="focus:ring-2 focus:ring-primary/20"
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                              Last Name
                            </Label>
                            <Input
                              id="lastName"
                              name="lastName"
                              value={profileForm.lastName}
                              onChange={handleProfileChange}
                              className="focus:ring-2 focus:ring-primary/20"
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={profileForm.email}
                              onChange={handleProfileChange}
                              className="focus:ring-2 focus:ring-primary/20 bg-gray-50"
                              placeholder="Enter your email"
                              disabled
                            />
                            <p className="text-xs text-gray-500">Contact support to change your email address</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              Phone Number
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={profileForm.phone}
                              onChange={handleProfileChange}
                              className="focus:ring-2 focus:ring-primary/20"
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Street Address
                            </Label>
                            <Input
                              id="address"
                              name="address"
                              value={profileForm.address}
                              onChange={handleProfileChange}
                              className="focus:ring-2 focus:ring-primary/20"
                              placeholder="Enter your street address"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                                City
                              </Label>
                              <Input
                                id="city"
                                name="city"
                                value={profileForm.city}
                                onChange={handleProfileChange}
                                className="focus:ring-2 focus:ring-primary/20"
                                placeholder="City"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                                State/Province
                              </Label>
                              <Input
                                id="state"
                                name="state"
                                value={profileForm.state}
                                onChange={handleProfileChange}
                                className="focus:ring-2 focus:ring-primary/20"
                                placeholder="State"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                                ZIP Code
                              </Label>
                              <Input
                                id="zipCode"
                                name="zipCode"
                                value={profileForm.zipCode}
                                onChange={handleProfileChange}
                                className="focus:ring-2 focus:ring-primary/20"
                                placeholder="ZIP"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                                Country
                              </Label>
                              <Input
                                id="country"
                                name="country"
                                value={profileForm.country}
                                onChange={handleProfileChange}
                                className="focus:ring-2 focus:ring-primary/20"
                                placeholder="Country"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Date of Birth
                              </Label>
                              <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={profileForm.dateOfBirth}
                                onChange={handleProfileChange}
                                className="focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-200">
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                            className="px-6"
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Security Tab */}
              {currentTab === 'security' && (
                <div className="space-y-6">
                  {/* Two-Factor Authentication Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Two-Factor Authentication</span>
                      </CardTitle>
                      <CardDescription>
                        Add an extra layer of security to your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Enable 2FA</h3>
                          <p className="text-sm text-gray-600">
                            Protect your account with two-factor authentication
                          </p>
                        </div>
                        <Switch
                          checked={securityForm.twoFactorEnabled}
                          onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, twoFactorEnabled: checked }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Change Password Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lock className="h-5 w-5" />
                        <span>Change Password</span>
                      </CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSecuritySubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={securityForm.currentPassword}
                              onChange={handleSecurityChange}
                              className="focus:ring-2 focus:ring-primary/20 pr-10"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                            New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              value={securityForm.newPassword}
                              onChange={handleSecurityChange}
                              className="focus:ring-2 focus:ring-primary/20 pr-10"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={securityForm.confirmPassword}
                            onChange={handleSecurityChange}
                            className="focus:ring-2 focus:ring-primary/20"
                            placeholder="Confirm new password"
                          />
                        </div>
                        
                        <div className="flex justify-end pt-6 border-t border-gray-200">
                          <Button 
                            type="submit" 
                            disabled={updateSecurityMutation.isPending}
                            className="px-6"
                          >
                            {updateSecurityMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Update Security
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EditAccount;

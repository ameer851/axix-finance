import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, getUserBalance, getUserActivity, updateUserProfile } from '@/services/userService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Shield, Clock, CreditCard, User, Bell, Lock, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('overview');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getUserProfile(user?.id),
    enabled: !!user?.id,
    staleTime: 300000 // 5 minutes
  });

  // Fetch user balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: () => getUserBalance(user?.id),
    enabled: !!user?.id,
    staleTime: 60000 // 1 minute
  });

  // Fetch user activity
  const { data: activityData = [], isLoading: activityLoading } = useQuery({
    queryKey: ['activity', user?.id],
    queryFn: () => getUserActivity(user?.id),
    enabled: !!user?.id,
    staleTime: 60000 // 1 minute
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part?.[0] || '').join('').toUpperCase();
  };

  // Only use real user data from context or backend queries
  const userInitials = user && user.firstName && user.lastName ? 
    getInitials(`${user.firstName} ${user.lastName}`) : (user?.username?.[0]?.toUpperCase() || 'U');
  const userName = user && user.firstName && user.lastName ?
    `${user.firstName} ${user.lastName}` : (user?.username || '');

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge className="bg-green-500 flex items-center">
        <Shield className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-500 border-yellow-500 flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // Open edit dialog and prefill with profileData
  const handleEditProfile = () => {
    setEditForm({
      firstName: profileData?.firstName || '',
      lastName: profileData?.lastName || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      address: profileData?.address || '',
      city: profileData?.city || '',
      state: profileData?.state || '',
      zipCode: profileData?.zipCode || '',
      country: profileData?.country || '',
      dateOfBirth: profileData?.dateOfBirth || '',
    });
    setShowEditDialog(true);
  };

  // Handle form input change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  // Handle save
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.id, editForm);
      toast({ title: 'Profile updated', description: 'Your profile was updated successfully.' });
      setShowEditDialog(false);
      // Optionally, refetch profile data
      // queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      window.location.reload(); // quick refresh for now
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading || balanceLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profileData?.avatarUrl || ""} alt={userName} />
                <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user?.email}</p>
              
              <div className="flex space-x-2 mb-4">
                {getVerificationBadge(profileData?.isVerified || false)}
                <Badge variant="outline" className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {profileData?.accountType || 'Standard'}
                </Badge>
              </div>
              
              <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                    <span className="font-medium">{formatDate(profileData?.createdAt || new Date())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Last Login</span>
                    <span className="font-medium">{formatDate(profileData?.lastLogin || new Date())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
                    <Badge className={profileData?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                      {profileData?.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Details Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your account information and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <CreditCard className="h-5 w-5 mr-2 text-primary" />
                        <h3 className="font-medium">Account Balance</h3>
                      </div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(balanceData?.availableBalance || parseFloat(user?.balance || '0'))}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Pending: {formatCurrency(balanceData?.pendingBalance || 0)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 mr-2 text-primary" />
                        <h3 className="font-medium">Account Statistics</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Total Deposits</span>
                          <span className="font-medium">{formatCurrency(profileData?.totalDeposits || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawals</span>
                          <span className="font-medium">{formatCurrency(profileData?.totalWithdrawals || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Transactions</span>
                          <span className="font-medium">{profileData?.transactionCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-medium mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                        <p className="font-medium">{userName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium">{profileData?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Country</p>
                        <p className="font-medium">{profileData?.country || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                        <p className="font-medium">{profileData?.address || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                        <p className="font-medium">{profileData?.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2" onClick={handleEditProfile}>
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="pt-4">
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <Lock className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Security Settings</h3>
                    </div>
                    
                    <div className="space-y-4 mt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Badge className={profileData?.twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}>
                          {profileData?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last changed {profileData?.passwordLastChanged ? formatDate(profileData.passwordLastChanged) : 'Never'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Change</Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Login Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified when someone logs into your account
                          </p>
                        </div>
                        <Badge className={profileData?.loginNotificationsEnabled ? 'bg-green-500' : 'bg-red-500'}>
                          {profileData?.loginNotificationsEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <Bell className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Notification Preferences</h3>
                    </div>
                    
                    <div className="space-y-4 mt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive notifications about account activity
                          </p>
                        </div>
                        <Badge className={profileData?.emailNotificationsEnabled ? 'bg-green-500' : 'bg-red-500'}>
                          {profileData?.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Transaction Alerts</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified about deposits and withdrawals
                          </p>
                        </div>
                        <Badge className={profileData?.transactionAlertsEnabled ? 'bg-green-500' : 'bg-red-500'}>
                          {profileData?.transactionAlertsEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Security Settings
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="pt-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Recent Account Activity</h3>
                  
                  {activityLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : activityData.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-gray-500 dark:text-gray-400">No recent activity found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activityData.map((activity: any) => (
                        <div key={activity.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">{formatDate(activity.timestamp)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.ipAddress}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button variant="outline">
                      View All Activity
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleSaveProfile(); }}>
            <div className="grid gap-4 py-2">
              <label htmlFor="firstName">First Name</label>
              <Input name="firstName" id="firstName" placeholder="First Name" value={editForm.firstName} onChange={handleEditChange} required />
              <label htmlFor="lastName">Last Name</label>
              <Input name="lastName" id="lastName" placeholder="Last Name" value={editForm.lastName} onChange={handleEditChange} required />
              <label htmlFor="email">Email</label>
              <Input name="email" id="email" placeholder="Email" value={editForm.email} onChange={handleEditChange} required />
              <label htmlFor="phone">Phone</label>
              <Input name="phone" id="phone" placeholder="Phone" value={editForm.phone} onChange={handleEditChange} />
              <label htmlFor="address">Address</label>
              <Input name="address" id="address" placeholder="Address" value={editForm.address} onChange={handleEditChange} />
              <label htmlFor="city">City</label>
              <Input name="city" id="city" placeholder="City" value={editForm.city} onChange={handleEditChange} />
              <label htmlFor="state">State</label>
              <Input name="state" id="state" placeholder="State" value={editForm.state} onChange={handleEditChange} />
              <label htmlFor="zipCode">Zip Code</label>
              <Input name="zipCode" id="zipCode" placeholder="Zip Code" value={editForm.zipCode} onChange={handleEditChange} />
              <label htmlFor="country">Country</label>
              <Input name="country" id="country" placeholder="Country" value={editForm.country} onChange={handleEditChange} />
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <Input name="dateOfBirth" id="dateOfBirth" type="date" value={editForm.dateOfBirth} onChange={handleEditChange} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

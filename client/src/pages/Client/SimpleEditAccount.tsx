import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import { 
  User, 
  Mail, 
  Calendar,
  Save,
  UserCircle,
  Edit3,
  Check
} from 'lucide-react';

const SimpleEditAccount: React.FC = () => {
  const { user, updateUser } = useAuth() as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bitcoinAddress: '',
    bitcoinCashAddress: '',
    ethereumAddress: '',
    bnbAddress: '',
    usdtTrc20Address: ''
  });

  // Profile query
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => updateUserProfile(user!.id, data),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        bitcoinAddress: profile.bitcoinAddress || '',
        bitcoinCashAddress: profile.bitcoinCashAddress || '',
        ethereumAddress: profile.ethereumAddress || '',
        bnbAddress: profile.bnbAddress || '',
        usdtTrc20Address: profile.usdtTrc20Address || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Please log in to edit your account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Your Account</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and wallet addresses</p>
      </div>

      {/* Account Information Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="w-6 h-6 text-blue-600" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-sm font-semibold text-gray-700">Account Name:</Label>
                <Input
                  id="accountName"
                  value={user.username}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDate" className="text-sm font-semibold text-gray-700">Registration date:</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">Your Full Name:</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your full name"
                  value={`${formData.firstName} ${formData.lastName}`.trim()}
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    const firstName = parts[0] || '';
                    const lastName = parts.slice(1).join(' ') || '';
                    setFormData(prev => ({ ...prev, firstName, lastName }));
                  }}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Your E-mail address:</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Cryptocurrency Wallet Addresses */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                Cryptocurrency Wallet Addresses
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bitcoinAddress" className="text-sm font-semibold text-gray-700">Your BITCOIN Wallet Address:</Label>
                  <Input
                    id="bitcoinAddress"
                    placeholder="Enter your Bitcoin wallet address"
                    value={formData.bitcoinAddress}
                    onChange={(e) => handleInputChange('bitcoinAddress', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bitcoinCashAddress" className="text-sm font-semibold text-gray-700">Your Bitcoin cash Wallet Address:</Label>
                  <Input
                    id="bitcoinCashAddress"
                    placeholder="Enter your Bitcoin Cash wallet address"
                    value={formData.bitcoinCashAddress}
                    onChange={(e) => handleInputChange('bitcoinCashAddress', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ethereumAddress" className="text-sm font-semibold text-gray-700">Your Ethereum Wallet Address:</Label>
                  <Input
                    id="ethereumAddress"
                    placeholder="Enter your Ethereum wallet address"
                    value={formData.ethereumAddress}
                    onChange={(e) => handleInputChange('ethereumAddress', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usdtAddress" className="text-sm font-semibold text-gray-700">Your Usdt erc20 Wallet Address:</Label>
                  <Input
                    id="usdtAddress"
                    placeholder="Enter your USDT ERC20 wallet address"
                    value={formData.usdtTrc20Address}
                    onChange={(e) => handleInputChange('usdtTrc20Address', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bnbAddress" className="text-sm font-semibold text-gray-700">Your BNB Wallet Address:</Label>
                  <Input
                    id="bnbAddress"
                    placeholder="Enter your BNB wallet address"
                    value={formData.bnbAddress}
                    onChange={(e) => handleInputChange('bnbAddress', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || profileLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {updateProfileMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Change Account data
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Account Status</h3>
              <p className="text-sm text-gray-600">Your account is currently active and verified</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                {user.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleEditAccount;

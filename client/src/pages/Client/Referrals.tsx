import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Users, DollarSign, Award, ChevronRight } from 'lucide-react';
import { getUserReferrals, getUserReferralStats } from '@/services/userService';
import { formatCurrency, formatDate } from '@/lib/utils';

const Referrals: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fetch user referral data
  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: () => getUserReferrals(user?.id),
    enabled: !!user?.id,
    staleTime: 300000 // 5 minutes
  });

  // Fetch user referral stats
  const { data: referralStats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: () => getUserReferralStats(user?.id),
    enabled: !!user?.id,
    staleTime: 300000 // 5 minutes
  });

  const referralLink = `https://caraxfinance.com/register?ref=${user?.referralCode || user?.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    });
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Carax Finance',
          text: 'Sign up for Carax Finance using my referral link and get a bonus!',
          url: referralLink,
        });
        
        toast({
          title: 'Shared!',
          description: 'Thanks for sharing your referral link',
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="grid grid-cols-1 gap-6">
        {/* Referral Link Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Referral Program</CardTitle>
            <CardDescription>Invite friends and earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center mb-6">
              <h3 className="text-lg font-medium mb-2">Your Referral Link</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Share this link with friends and earn {referralStats?.commissionRate || '10%'} of their deposits
              </p>
              
              <div className="flex items-center mb-4">
                <Input 
                  value={referralLink}
                  readOnly
                  className="mr-2"
                />
                <Button 
                  onClick={copyToClipboard} 
                  variant="outline"
                  className="min-w-[100px]"
                >
                  {copied ? (
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </span>
                  )}
                </Button>
              </div>
              
              <Button onClick={shareReferral} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Referral Link
              </Button>
            </div>
            
            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-lg font-medium">Total Referrals</h3>
                    <p className="text-3xl font-bold">
                      {statsLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        referralStats?.totalReferrals || 0
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <DollarSign className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-lg font-medium">Total Earnings</h3>
                    <p className="text-3xl font-bold">
                      {statsLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        formatCurrency(referralStats?.totalEarnings || 0)
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Award className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-lg font-medium">Current Tier</h3>
                    <p className="text-3xl font-bold">
                      {statsLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        referralStats?.currentTier || 'Bronze'
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tier Progress */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Tier Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      {referralStats?.currentTier || 'Bronze'} → {referralStats?.nextTier || 'Silver'}
                    </span>
                    <span className="text-sm font-medium">
                      {referralStats?.tierProgress || 0}%
                    </span>
                  </div>
                  <Progress value={referralStats?.tierProgress || 0} className="h-2" />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Tier Benefits</h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Badge className="mt-0.5 mr-2">Bronze</Badge>
                      <span className="text-sm">10% commission on referral deposits</span>
                    </div>
                    <div className="flex items-start">
                      <Badge className="bg-gray-400 mt-0.5 mr-2">Silver</Badge>
                      <span className="text-sm">12% commission + 5% bonus on your deposits</span>
                    </div>
                    <div className="flex items-start">
                      <Badge className="bg-yellow-500 mt-0.5 mr-2">Gold</Badge>
                      <span className="text-sm">15% commission + 10% bonus on your deposits</span>
                    </div>
                    <div className="flex items-start">
                      <Badge className="bg-blue-500 mt-0.5 mr-2">Platinum</Badge>
                      <span className="text-sm">20% commission + 15% bonus on your deposits + VIP support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Referrals List Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>People who joined using your referral link</CardDescription>
          </CardHeader>
          <CardContent>
            {referralsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-1">No referrals yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Share your referral link to start earning rewards
                </p>
                <Button onClick={shareReferral}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Your Link
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deposits</TableHead>
                      <TableHead>Your Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral: any) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div className="font-medium">{referral.name || `User #${referral.id}`}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{referral.email}</div>
                        </TableCell>
                        <TableCell>{formatDate(referral.joinedAt)}</TableCell>
                        <TableCell>
                          <Badge className={referral.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                            {referral.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(referral.totalDeposits || 0)}</TableCell>
                        <TableCell>{formatCurrency(referral.yourEarnings || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {referrals.length > 0 && (
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Referrals;

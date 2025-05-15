import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUserReferrals, getUserReferralStats } from '@/services/userService';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Referral: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referralStats', user?.id],
    queryFn: () => getUserReferralStats(user?.id),
    enabled: !!user?.id
  });

  // Fetch referrals list
  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: () => getUserReferrals(user?.id),
    enabled: !!user?.id
  });

  const handleCopy = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Referral Program</CardTitle>
        <CardDescription>Invite friends and earn rewards for every successful referral.</CardDescription>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Your Referral Link:</span>
              <span className="bg-muted px-2 py-1 rounded text-xs select-all">{stats.referralLink}</span>
              <Button size="icon" variant="ghost" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-6 flex-wrap text-sm mb-2">
              <div><b>Total Referrals:</b> {stats.totalReferrals}</div>
              <div><b>Active Referrals:</b> {stats.activeReferrals}</div>
              <div><b>Total Earnings:</b> ${stats.totalEarnings}</div>
              <div><b>Pending Earnings:</b> ${stats.pendingEarnings}</div>
              <div><b>Commission Rate:</b> {stats.commissionRate}</div>
              <div><b>Current Tier:</b> {stats.currentTier}</div>
              <div><b>Next Tier:</b> {stats.nextTier}</div>
              <div><b>Tier Progress:</b> {stats.tierProgress}%</div>
            </div>
          </div>
        )}
        <h3 className="font-semibold mb-2">Your Referrals</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Deposits</TableHead>
                <TableHead>Your Earnings</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">No referrals yet.</TableCell></TableRow>
              ) : (
                referrals.map((ref: any) => (
                  <TableRow key={ref.id}>
                    <TableCell>{ref.name}</TableCell>
                    <TableCell>{ref.email}</TableCell>
                    <TableCell>{ref.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>${ref.totalDeposits}</TableCell>
                    <TableCell>${ref.yourEarnings}</TableCell>
                    <TableCell>{new Date(ref.joinedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Referral;

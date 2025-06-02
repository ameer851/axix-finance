import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Users, Gift, TrendingUp } from 'lucide-react';

const Referral: React.FC = () => {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Referral Program</CardTitle>
          <CardDescription className="text-lg">
            Invite friends and earn rewards for every successful referral
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
              <p className="text-gray-500 max-w-md">
                Our referral program is currently under development. You'll be able to invite friends 
                and earn commissions on their investments very soon!
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800">Earn Commissions</h4>
              <p className="text-sm text-green-600">Get rewarded for every successful referral</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-800">Track Referrals</h4>
              <p className="text-sm text-blue-600">Monitor your referral performance in real-time</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-800">Tier System</h4>
              <p className="text-sm text-purple-600">Unlock higher commission rates as you grow</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-medium">
              🚀 Stay tuned! We're working hard to bring you an amazing referral experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Referral;

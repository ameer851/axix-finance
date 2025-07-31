import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  FileText,
  ArrowRight
} from 'lucide-react';

const DepositsListPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Active Deposits
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage your active investment deposits and their performance.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Deposit
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Deposits</p>
                <p className="text-2xl font-bold text-green-900">-</p>
                <p className="text-xs text-green-600 mt-1">Currently earning</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Invested</p>
                <p className="text-2xl font-bold text-blue-900">-</p>
                <p className="text-xs text-blue-600 mt-1">Principal amount</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Earnings</p>
                <p className="text-2xl font-bold text-purple-900">-</p>
                <p className="text-xs text-purple-600 mt-1">Profit generated</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <div className="relative pt-20">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Your Investment Journey</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You don't have any active deposits yet. Make your first deposit to start earning with our investment plans.
                </p>
                <div className="space-y-4">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg flex items-center gap-2 mx-auto">
                    <Plus className="h-5 w-5" />
                    Make Your First Deposit
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-sm text-gray-500">
                    Minimum deposit: $50 • Multiple investment plans available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Plans Preview */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Investment Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Starter Plan", rate: "2%", duration: "3 days", min: "$50", color: "blue" },
            { name: "Premium Plan", rate: "3.5%", duration: "7 days", min: "$1,000", color: "green" },
            { name: "Delux Plan", rate: "5%", duration: "10 days", min: "$5,000", color: "purple" },
            { name: "Luxury Plan", rate: "7.5%", duration: "30 days", min: "$20,000", color: "amber" }
          ].map((plan, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold text-sm mb-2">{plan.name}</h3>
                  <div className={`text-lg font-bold text-${plan.color}-600 mb-1`}>
                    {plan.rate} Daily
                  </div>
                  <p className="text-xs text-gray-600">{plan.duration}</p>
                  <p className="text-xs text-gray-500 mt-1">Min: {plan.min}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepositsListPage;

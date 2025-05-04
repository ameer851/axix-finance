import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calculator } from 'lucide-react';

interface InvestmentPlan {
  name: string;
  minInvestment: number;
  maxInvestment: number | null;
  dailyReturn: number;
  duration: number;
  referralCommission: number;
  principalIncluded: boolean;
}

const InvestmentCalculator: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>("STARTER PLAN");
  const [investmentAmount, setInvestmentAmount] = useState<number>(500);
  const [includeReferrals, setIncludeReferrals] = useState<boolean>(false);
  const [referralAmount, setReferralAmount] = useState<number>(1000);
  const [total, setTotal] = useState<number>(0);
  const [referralBonus, setReferralBonus] = useState<number>(0);
  const [dailyReturns, setDailyReturns] = useState<number[]>([]);

  const plans: InvestmentPlan[] = [
    {
      name: "STARTER PLAN",
      minInvestment: 50,
      maxInvestment: 999,
      dailyReturn: 2,
      duration: 3,
      referralCommission: 10,
      principalIncluded: true
    },
    {
      name: "PREMIUM PLAN",
      minInvestment: 1000,
      maxInvestment: 4999,
      dailyReturn: 3.5,
      duration: 7,
      referralCommission: 10,
      principalIncluded: true
    },
    {
      name: "DELUX PLAN",
      minInvestment: 5000,
      maxInvestment: 19999,
      dailyReturn: 5,
      duration: 10,
      referralCommission: 10,
      principalIncluded: true
    },
    {
      name: "LUXURY PLAN",
      minInvestment: 20000,
      maxInvestment: null,
      dailyReturn: 7.5,
      duration: 30,
      referralCommission: 10,
      principalIncluded: true
    }
  ];

  const getCurrentPlan = (): InvestmentPlan => {
    return plans.find(plan => plan.name === selectedPlan) || plans[0];
  };

  const calculateReturns = () => {
    const plan = getCurrentPlan();
    
    // Calculate investment returns
    const dailyYield = (investmentAmount * plan.dailyReturn) / 100;
    const newDailyReturns = Array.from({ length: plan.duration }, (_, i) => dailyYield);
    setDailyReturns(newDailyReturns);
    
    const investmentReturn = dailyYield * plan.duration;
    const totalReturn = plan.principalIncluded ? investmentAmount + investmentReturn : investmentReturn;
    setTotal(totalReturn);
    
    // Calculate referral bonus if enabled
    if (includeReferrals) {
      const refBonus = (referralAmount * plan.referralCommission) / 100;
      setReferralBonus(refBonus);
    } else {
      setReferralBonus(0);
    }
  };

  useEffect(() => {
    calculateReturns();
  }, [selectedPlan, investmentAmount, includeReferrals, referralAmount]);

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
    const newPlan = plans.find(p => p.name === value);
    if (newPlan) {
      // Adjust investment amount if it's outside the plan's range
      if (investmentAmount < newPlan.minInvestment) {
        setInvestmentAmount(newPlan.minInvestment);
      } else if (newPlan.maxInvestment && investmentAmount > newPlan.maxInvestment) {
        setInvestmentAmount(newPlan.maxInvestment);
      }
    }
  };

  const handleInvestmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      const plan = getCurrentPlan();
      if (value < plan.minInvestment) {
        setInvestmentAmount(plan.minInvestment);
      } else if (plan.maxInvestment && value > plan.maxInvestment) {
        setInvestmentAmount(plan.maxInvestment);
      } else {
        setInvestmentAmount(value);
      }
    }
  };

  const handleSliderChange = (value: number[]) => {
    setInvestmentAmount(value[0]);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const currentPlan = getCurrentPlan();
  const sliderMax = currentPlan.maxInvestment || 50000;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Calculator className="h-6 w-6 text-primary-600" />
          <div>
            <CardTitle>Investment Calculator</CardTitle>
            <CardDescription>Estimate your investment returns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan">Investment Plan</Label>
          <Select value={selectedPlan} onValueChange={handlePlanChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.name} value={plan.name}>
                  {plan.name} ({plan.dailyReturn}% daily for {plan.duration} days)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount">Investment Amount</Label>
            <span className="text-sm text-gray-500">
              Min: ${currentPlan.minInvestment} {currentPlan.maxInvestment ? `- Max: $${currentPlan.maxInvestment}` : ''}
            </span>
          </div>
          <Input
            id="amount"
            type="number"
            value={investmentAmount}
            onChange={handleInvestmentAmountChange}
            min={currentPlan.minInvestment}
            max={currentPlan.maxInvestment || undefined}
          />
          <Slider 
            defaultValue={[investmentAmount]} 
            value={[investmentAmount]}
            max={sliderMax} 
            min={currentPlan.minInvestment} 
            step={10}
            onValueChange={handleSliderChange}
            className="py-4"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeReferrals"
              checked={includeReferrals}
              onChange={(e) => setIncludeReferrals(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="includeReferrals">Include Referral Bonus</Label>
          </div>
          
          {includeReferrals && (
            <div className="pl-6 space-y-2 mt-2">
              <Label htmlFor="referralAmount">Referral Investment Amount</Label>
              <Input
                id="referralAmount"
                type="number"
                value={referralAmount}
                onChange={(e) => setReferralAmount(parseFloat(e.target.value) || 0)}
                min={0}
              />
              <p className="text-sm text-gray-500">
                You'll earn {currentPlan.referralCommission}% commission: {formatCurrency(referralBonus)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Investment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Investment:</span>
              <span>{formatCurrency(investmentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Rate:</span>
              <span>{currentPlan.dailyReturn}%</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{currentPlan.duration} days</span>
            </div>
            <div className="flex justify-between">
              <span>Investment Return:</span>
              <span className="text-green-600">{formatCurrency(total - investmentAmount)}</span>
            </div>
            {includeReferrals && (
              <div className="flex justify-between">
                <span>Referral Commission:</span>
                <span className="text-blue-600">{formatCurrency(referralBonus)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 border-gray-200 dark:border-gray-700">
              <div className="flex justify-between font-bold">
                <span>Total Return:</span>
                <span className="text-primary-600">{formatCurrency(total + referralBonus)}</span>
              </div>
            </div>
          </div>
        </div>

        {dailyReturns.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-md mb-2">Daily Returns</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {dailyReturns.map((amount, i) => (
                <div key={i} className="text-center p-2 bg-gray-50 dark:bg-neutral-800 rounded-md">
                  <div className="text-sm text-gray-500">Day {i + 1}</div>
                  <div className="font-medium">{formatCurrency(amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          * This calculator provides an estimate. Actual returns may vary.
        </p>
        <Button
          onClick={() => {
            window.location.href = '/portfolio';
          }}
        >
          Start Investing
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InvestmentCalculator;
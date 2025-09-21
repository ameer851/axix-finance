import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import {
  getInvestmentProjections,
  type InvestmentCalculation,
  type InvestmentProjection,
} from "@/services/investmentCalculationService";
import { Calculator, Clock, DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface InvestmentCalculatorProps {
  currentBalance?: number;
  onPlanSelect?: (plan: InvestmentCalculation) => void;
}

export function InvestmentCalculator({
  currentBalance = 0,
  onPlanSelect,
}: InvestmentCalculatorProps) {
  const [principalAmount, setPrincipalAmount] = useState<number>(1000);
  const [projections, setProjections] = useState<InvestmentProjection | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(currentBalance);

  // Fetch user balance on component mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balanceData = await api.get("/balance");
        setUserBalance(balanceData.availableBalance || 0);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    if (!currentBalance) {
      fetchBalance();
    }
  }, [currentBalance]);

  const calculateProjections = async () => {
    if (principalAmount <= 0) return;

    setLoading(true);
    try {
      const result = await getInvestmentProjections(
        principalAmount,
        userBalance
      );
      setProjections(result);
    } catch (error) {
      console.error("Failed to calculate projections:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getRecommendedBadge = (planId: string, recommendedPlanId?: string) => {
    if (planId === recommendedPlanId) {
      return (
        <Badge variant="default" className="ml-2">
          Recommended
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Investment Calculator
          </CardTitle>
          <CardDescription>
            Calculate your potential returns based on different investment plans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Investment Amount</Label>
              <Input
                id="principal"
                type="number"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min="100"
                max="100000"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <DollarSign className="h-4 w-4 mr-2" />
                {formatCurrency(userBalance)}
              </div>
            </div>
          </div>

          <Button
            onClick={calculateProjections}
            disabled={loading || principalAmount <= 0}
            className="w-full"
          >
            {loading ? "Calculating..." : "Calculate Projections"}
          </Button>
        </CardContent>
      </Card>

      {projections && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24-Hour Projections
              </CardTitle>
              <CardDescription>
                Expected returns and balance after 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projections.calculations.map((calc) => (
                  <Card
                    key={calc.planId}
                    className={`relative ${calc.planId === projections.recommendedPlan?.planId ? "ring-2 ring-primary" : ""}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {calc.planName}
                        </CardTitle>
                        {getRecommendedBadge(
                          calc.planId,
                          projections.recommendedPlan?.planId
                        )}
                      </div>
                      <CardDescription>
                        {formatPercentage(calc.returnPercentage)} daily return
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Daily Return:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(calc.dailyReturn)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>24h Return:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(calc.totalReturn24h)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Balance after 24h:</span>
                          <span className="text-lg text-primary">
                            {formatCurrency(calc.projectedBalance24h)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant={
                          calc.planId === projections.recommendedPlan?.planId
                            ? "default"
                            : "outline"
                        }
                        className="w-full"
                        onClick={() => onPlanSelect?.(calc)}
                      >
                        Select Plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Long-term Projections
              </CardTitle>
              <CardDescription>
                Projected returns for different time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Plan</th>
                      <th className="text-right p-3">30 Days</th>
                      <th className="text-right p-3">End of Plan</th>
                      <th className="text-right p-3">Total Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.calculations.map((calc) => (
                      <tr
                        key={calc.planId}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-3 font-medium">
                          {calc.planName}
                          {calc.planId ===
                            projections.recommendedPlan?.planId && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Recommended
                            </Badge>
                          )}
                        </td>
                        <td className="text-right p-3">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(calc.projectedBalance30d)}
                            </div>
                            <div className="text-sm text-green-600">
                              +{formatCurrency(calc.totalReturn30d)}
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-3">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(calc.projectedBalanceEnd)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {calc.durationDays} days
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-3">
                          <div className="space-y-1">
                            <div className="font-medium text-green-600">
                              +{formatCurrency(calc.totalReturnPlan)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatPercentage(
                                (calc.totalReturnPlan / calc.principalAmount) *
                                  100
                              )}{" "}
                              total
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

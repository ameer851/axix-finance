import { InvestmentCalculator } from "@/components/InvestmentCalculator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InvestmentCalculation } from "@/services/investmentCalculationService";
import {
  getInvestmentPlans,
  type InvestmentPlan,
} from "@/services/investmentService";
import { Clock, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function InvestmentCalculatorPage() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  useEffect(() => {
    getInvestmentPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);
  const handlePlanSelect = (plan: InvestmentCalculation) => {
    console.log("Selected plan:", plan);
    // Here you could navigate to a plan details page or start the investment process
    // For now, we'll just log the selection
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Investment Calculator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover your potential returns with our investment plans. Calculate
          projections and see what you could earn in just 24 hours.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Real-time Calculations</CardTitle>
            <CardDescription>
              Get instant projections for all our investment plans
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Target className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Personalized Recommendations</CardTitle>
            <CardDescription>
              Receive tailored plan suggestions based on your investment amount
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>24-Hour Projections</CardTitle>
            <CardDescription>
              See exactly what you'll earn in the first day of your investment
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Investment Plans Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Investment Plans</CardTitle>
          <CardDescription>
            Choose from our range of investment plans designed to maximize your
            returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  <Badge variant="secondary">
                    {p.dailyProfit}% daily • {p.duration} days
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  ${p.minAmount.toLocaleString()}{" "}
                  {p.maxAmount ? `- $${p.maxAmount.toLocaleString()}` : "+"}
                </p>
                <p className="text-sm">Total return: {p.totalReturn}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calculator Component */}
      <InvestmentCalculator onPlanSelect={handlePlanSelect} />

      {/* Disclaimer */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-orange-600 mt-0.5">⚠️</div>
            <div className="space-y-2">
              <h4 className="font-semibold text-orange-800">
                Important Disclaimer
              </h4>
              <p className="text-sm text-orange-700">
                The projections shown are estimates based on the selected
                investment plans and historical performance. Actual returns may
                vary depending on market conditions, plan terms, and other
                factors. Past performance does not guarantee future results.
                Please invest responsibly and only what you can afford to lose.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

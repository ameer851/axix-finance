import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  calculateInvestmentProgress,
  formatCurrency,
  formatDate,
  getDaysRemaining,
  getUserActiveInvestments,
  getUserInvestmentReturns,
  type Investment,
  type InvestmentReturn,
} from "@/services/investmentService";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface InvestmentDashboardProps {
  onDepositClick?: () => void;
}

export function InvestmentDashboard({
  onDepositClick,
}: InvestmentDashboardProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [returns, setReturns] = useState<InvestmentReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvestmentData();
  }, []);

  const loadInvestmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [investmentsData, returnsData] = await Promise.all([
        getUserActiveInvestments(),
        getUserInvestmentReturns(),
      ]);

      setInvestments(investmentsData);
      setReturns(returnsData);
    } catch (err) {
      console.error("Error loading investment data:", err);
      setError("Failed to load investment data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <TrendingUp className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>{error}</p>
            <Button
              onClick={loadInvestmentData}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.principalAmount,
    0
  );
  const totalEarned = investments.reduce(
    (sum, inv) => sum + inv.totalEarned,
    0
  );
  const activeInvestments = investments.filter(
    (inv) => inv.status === "active"
  );
  const activeInvestmentsValue = activeInvestments.reduce(
    (sum, inv) => sum + inv.principalAmount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invested
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvested)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEarned)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Investments
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(activeInvestmentsValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeInvestments.length} active{" "}
              {activeInvestments.length === 1 ? "plan" : "plans"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Active Investments
            </CardTitle>
            <CardDescription>
              Your currently active investment plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeInvestments.map((investment) => {
              const progress = calculateInvestmentProgress(investment);
              const daysRemaining = getDaysRemaining(investment);
              const dailyReturn =
                investment.principalAmount * (investment.dailyProfit / 100);

              return (
                <Card
                  key={investment.id}
                  className="border-l-4 border-l-primary"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {investment.planName}
                          </h3>
                          <Badge className={getStatusColor(investment.status)}>
                            {getStatusIcon(investment.status)}
                            {investment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Started {formatDate(investment.startDate)} •{" "}
                          {investment.daysElapsed} days elapsed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {formatCurrency(investment.principalAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Principal
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>
                            {Math.round(progress)}% • {daysRemaining} days
                            remaining
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Daily Return</p>
                          <p className="font-medium text-green-600">
                            +{formatCurrency(dailyReturn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Earned</p>
                          <p className="font-medium text-green-600">
                            +{formatCurrency(investment.totalEarned)}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center text-sm">
                        <span>Ends on {formatDate(investment.endDate)}</span>
                        <span className="font-medium">
                          Expected Total:{" "}
                          {formatCurrency(
                            investment.principalAmount + investment.totalReturn
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Returns */}
      {returns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Returns
            </CardTitle>
            <CardDescription>Your latest investment returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {returns.slice(0, 5).map((returnItem) => (
                <div
                  key={returnItem.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="font-medium">
                      +{formatCurrency(returnItem.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(returnItem.returnDate)}
                    </p>
                  </div>
                  <Badge variant="secondary">Return</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Investments State */}
      {investments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Active Investments
              </h3>
              <p className="text-muted-foreground mb-6">
                Start your investment journey by depositing funds and selecting
                an investment plan.
              </p>
              <Button onClick={onDepositClick}>Start Investing</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

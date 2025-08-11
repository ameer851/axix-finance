import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
} from "@/services/goalService";
import type { Goal } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, DollarSign, Edit, Plus, Target, Trash2 } from "lucide-react";
import React, { useState } from "react";

interface GoalFormData {
  name: string;
  targetAmount: string;
  targetDate: string;
  currentAmount: string;
  progress: number;
  status: "active" | "completed" | "paused";
}

interface GoalsPlanningProps {
  onCreateGoal?: () => void;
  onEditGoal?: (goalId: string) => void;
  onDeleteGoal?: (goalId: string) => void;
}

// Helper function to calculate monthly contribution
function calculateMonthlyContribution(
  remainingAmount: number,
  targetDate: string
): number {
  const target = new Date(targetDate);
  const now = new Date();

  // If target date is in the past, return the full amount
  if (target <= now) {
    return remainingAmount;
  }

  // Calculate months between now and target date
  const monthsDiff =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());

  // If less than a month, return the full amount
  if (monthsDiff <= 0) {
    return remainingAmount;
  }

  return remainingAmount / monthsDiff;
}

const GoalsPlanning: React.FC<GoalsPlanningProps> = ({
  onCreateGoal,
  onEditGoal,
  onDeleteGoal,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalFormData>({
    name: "",
    targetAmount: "",
    targetDate: "",
    currentAmount: "0",
    progress: 0,
    status: "active",
  });

  // Fetch goals data
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) throw new Error("User ID is required");
        return await getGoals(user.id);
      } catch (error) {
        console.error("Error fetching goals:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (newGoal: GoalFormData) => {
      if (!user?.id) throw new Error("User ID is required");

      // Call the real API to create a goal
      return await createGoal({
        userId: user.id,
        name: newGoal.name,
        targetAmount: String(newGoal.targetAmount),
        targetDate: newGoal.targetDate,
        currentAmount: String(newGoal.currentAmount),
        progress: newGoal.progress,
        status: newGoal.status,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
      toast({
        title: "Goal Created",
        description: "Your investment goal has been created successfully.",
      });
      setShowNewGoalDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Goal> }) => {
      // Ensure all fields are strings
      const fixedData: Partial<Goal> = {
        ...data,
        targetAmount:
          data.targetAmount !== undefined
            ? String(data.targetAmount)
            : undefined,
        currentAmount:
          data.currentAmount !== undefined
            ? String(data.currentAmount)
            : undefined,
        progress:
          data.progress !== undefined ? Number(data.progress) : undefined,
        status: data.status as "active" | "completed" | "paused" | undefined,
      };
      return await updateGoal(id, fixedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
      toast({
        title: "Goal Updated",
        description: "Your investment goal has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
      toast({
        title: "Goal Deleted",
        description: "Your investment goal has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Format currency
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate time remaining
  const calculateTimeRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "Past due";
    }

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return `${years} ${years === 1 ? "year" : "years"}${months > 0 ? `, ${months} ${months === 1 ? "month" : "months"}` : ""}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? "month" : "months"}`;
    } else {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
    }
  };

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-orange-500";
    if (progress < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoalForm((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setGoalForm({
      name: "",
      targetAmount: "",
      targetDate: "",
      currentAmount: "0",
      progress: 0,
      status: "active",
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate(goalForm);
  };

  if (goalsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Goals & Planning</CardTitle>
          <CardDescription>Loading your investment goals...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Goals & Planning</CardTitle>
            <CardDescription>
              Track your investment goals and progress
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewGoalDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                You don't have any investment goals yet
              </p>
              <Button onClick={() => setShowNewGoalDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <Card key={goal.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <Badge
                        variant={goal.progress >= 100 ? "default" : "outline"}
                      >
                        {goal.progress >= 100 ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Target: {formatCurrency(goal.targetAmount)} by{" "}
                      {formatDate(goal.targetDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{goal.progress}%</span>
                        </div>
                        <Progress
                          value={goal.progress}
                          className={getProgressColor(goal.progress)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Current Amount
                          </p>
                          <p className="font-medium">
                            {formatCurrency(goal.currentAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining</p>
                          <p className="font-medium">
                            {formatCurrency(
                              String(
                                parseFloat(goal.targetAmount) -
                                  parseFloat(goal.currentAmount)
                              )
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Time Remaining
                          </p>
                          <p className="font-medium">
                            {calculateTimeRemaining(goal.targetDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Monthly Contribution
                          </p>
                          <p className="font-medium">
                            {formatCurrency(
                              String(
                                calculateMonthlyContribution(
                                  parseFloat(goal.targetAmount) -
                                    parseFloat(goal.currentAmount),
                                  goal.targetDate
                                )
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Implement real edit functionality here
                        // This could open a dialog with the current goal data
                        if (onEditGoal) {
                          onEditGoal(String(goal.id));
                        } else {
                          // Example of how to update a goal
                          /*
                        updateGoalMutation.mutate({
                          id: goal.id,
                          data: {
                            targetAmount: parseFloat(goal.targetAmount) + 1000
                          }
                        });
                        */
                          toast({
                            title: "Edit Functionality",
                            description:
                              "This would normally open an edit dialog.",
                          });
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onDeleteGoal) {
                          onDeleteGoal(String(goal.id));
                        } else {
                          // Delete the goal using our mutation
                          deleteGoalMutation.mutate(String(goal.id));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Goal Dialog */}
      <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Investment Goal</DialogTitle>
            <DialogDescription>
              Set a financial target and timeline for your investment goal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Retirement Fund"
                  value={goalForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={goalForm.targetAmount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="targetDate"
                    name="targetDate"
                    type="date"
                    className="pl-8"
                    value={goalForm.targetDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {goalForm.targetAmount && goalForm.targetDate && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium mb-1">
                    Suggested Monthly Contribution
                  </p>
                  <p>
                    {formatCurrency(
                      String(
                        calculateMonthlyContribution(
                          parseFloat(goalForm.targetAmount),
                          goalForm.targetDate
                        )
                      )
                    )}{" "}
                    per month
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewGoalDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createGoalMutation.isPending}>
                {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoalsPlanning;
